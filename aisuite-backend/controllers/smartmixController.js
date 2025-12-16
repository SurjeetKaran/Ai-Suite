const log = require('../utils/logger');
const QueryHistory = require('../models/QueryHistory');
const { smartMix } = require('../services/smartMixService');

/**
 * Provider map
 */
const MODEL_TO_PROVIDER = {
  chatGPT: 'openai',
  gpt: 'openai',
  claude: 'anthropic',
  gemini: 'google',
  groq: 'groq'
};

// ✅ SINGLE SOURCE OF TRUTH FOR MODELS
const ALL_MODELS = ["chatGPT", "gemini", "claude"];

/**
 * Generate conversation title from first user input
 */
function generateTitleFromInput(input) {
  return input
    .replace(/\n/g, " ")
    .trim()
    .slice(0, 60) + (input.length > 60 ? "..." : "");
}

/**
 * Normalize output
 */
function normalizeOutputEntry(entry) {
  const empty = {
    text: '',
    total: 0,
    modelTokens: {},
    providerTokens: {}
  };

  if (entry == null) return empty;
  if (typeof entry === 'string') return { ...empty, text: entry };

  const text = entry.text || entry.output || entry.result || entry.message || '';
  const total =
    typeof entry.totalTokens === 'number' ? entry.totalTokens :
    typeof entry.tokensUsed === 'number' ? entry.tokensUsed :
    typeof entry.total === 'number' ? entry.total :
    0;

  return {
    text,
    total,
    modelTokens: entry.modelTokens || {},
    providerTokens: entry.providerTokens || {}
  };
}

/**
 * Aggregate token data
 */
function aggregateTokenData(normalizedOutputs) {
  const agg = {
    totalTokens: 0,
    modelTokens: {},
    providerTokens: {}
  };

  for (const modelKey of Object.keys(normalizedOutputs)) {
    const n = normalizedOutputs[modelKey];
    if (!n) continue;

    agg.totalTokens += n.total || 0;

    if (n.modelTokens && Object.keys(n.modelTokens).length) {
      for (const mk of Object.keys(n.modelTokens)) {
        agg.modelTokens[mk] = (agg.modelTokens[mk] || 0) + n.modelTokens[mk];
      }
    } else {
      agg.modelTokens[modelKey] = (agg.modelTokens[modelKey] || 0) + n.total;
    }

    if (n.providerTokens && Object.keys(n.providerTokens).length) {
      for (const pk of Object.keys(n.providerTokens)) {
        agg.providerTokens[pk] = (agg.providerTokens[pk] || 0) + n.providerTokens[pk];
      }
    } else {
      const provider = MODEL_TO_PROVIDER[modelKey] || 'unknown';
      agg.providerTokens[provider] = (agg.providerTokens[provider] || 0) + n.total;
    }
  }

  return agg;
}

/**
 * POST /smartmix/process
 */
exports.processSmartMix = async (req, res) => {
  try {
    const { input, type } = req.body;
    const userId = req.user._id;

    // 🔐 Sanitize activeModels
    let activeModels = Array.isArray(req.body.activeModels)
      ? req.body.activeModels.filter(m => ALL_MODELS.includes(m))
      : ALL_MODELS;

    if (!activeModels.length) activeModels = ALL_MODELS;

    const isNewChat = !req.body.conversationId;

    log("INFO", "[Controller] SmartMix request", {
      user: req.user.email,
      newChat: isNewChat,
      activeModels
    });

    // --------------------------------------------------
    // LOAD OR CREATE CONVERSATION
    // (ownership + limits already validated by middleware)
    // --------------------------------------------------
    let conversation = req.conversation;

    if (!conversation) {
      conversation = new QueryHistory({
        userId,
        moduleType: type,
        messages: []
      });
    }

    // --------------------------------------------------
    // USER MESSAGE
    // --------------------------------------------------
    conversation.messages.push({
      role: "user",
      content: input,
      timestamp: new Date(),
      tokenUsage: {
        total: 0,
        modelTokens: {},
        providerTokens: {}
      }
    });

    // Set title only once (first message)
    if (isNewChat && conversation.messages.length === 1) {
      conversation.title = generateTitleFromInput(input);
    }

    // --------------------------------------------------
    // SMARTMIX PROCESSING
    // --------------------------------------------------
    const rawOutputs = await smartMix(
      input,
      type,
      conversation.messages,
      activeModels
    );

    // Normalize outputs
    const normalized = {};
    for (const modelKey of activeModels) {
      normalized[modelKey] = normalizeOutputEntry(rawOutputs?.[modelKey]);
    }

    const aggregated = aggregateTokenData(normalized);

    // --------------------------------------------------
    // ASSISTANT MESSAGE
    // --------------------------------------------------
    conversation.messages.push({
      role: "assistant",
      content: "AI Response",
      individualOutputs: rawOutputs || {},
      timestamp: new Date(),
      tokenUsage: {
        total: aggregated.totalTokens,
        modelTokens: aggregated.modelTokens,
        providerTokens: aggregated.providerTokens
      }
    });

    // --------------------------------------------------
    // CONVERSATION-LEVEL AGGREGATION
    // --------------------------------------------------
    conversation.lastUpdated = new Date();
    conversation.totalTokens =
      (conversation.totalTokens || 0) + aggregated.totalTokens;

    conversation.modelTokens = conversation.modelTokens || {};
    for (const mk of Object.keys(aggregated.modelTokens)) {
      conversation.modelTokens[mk] =
        (conversation.modelTokens[mk] || 0) + aggregated.modelTokens[mk];
    }

    conversation.providerTokens = conversation.providerTokens || {};
    for (const pk of Object.keys(aggregated.providerTokens)) {
      conversation.providerTokens[pk] =
        (conversation.providerTokens[pk] || 0) + aggregated.providerTokens[pk];
    }

    await conversation.save();

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------
    return res.json({
      conversationId: conversation._id,
      outputs: rawOutputs,
      tokenSummary: {
        totalTokens: aggregated.totalTokens,
        modelTokens: aggregated.modelTokens,
        providerTokens: aggregated.providerTokens
      }
    });

  } catch (err) {
    log("ERROR", "[Controller] SmartMix failed", {
      error: err.message,
      stack: err.stack
    });

    return res.status(500).json({
      msg: "SmartMix failed",
      error: err.message
    });
  }
};


/**
 * GET /smartmix/history/:id
 */
exports.getConversationById = async (req, res) => {
  try {
    const conversation = await QueryHistory.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ msg: "Conversation not found" });
    }

    res.json({ conversation });
  } catch (err) {
    log("ERROR", "Get conversation failed", err);
    res.status(500).json({ msg: "Server error" });
  }
};

/**
 * DELETE /smartmix/history/:id
 */
exports.deleteConversationById = async (req, res) => {
  try {
    const deleted = await QueryHistory.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!deleted) {
      return res.status(404).json({ msg: "Conversation not found or unauthorized" });
    }

    res.json({ msg: "Conversation deleted successfully", id: req.params.id });
  } catch (err) {
    log("ERROR", "Delete conversation failed", err);
    res.status(500).json({ msg: "Server error" });
  }
};

