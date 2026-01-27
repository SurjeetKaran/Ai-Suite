const log = require('../utils/logger');
const QueryHistory = require('../models/QueryHistory');
const { smartMix } = require('../services/smartMixService');

/**
 * Generate a conversation title from the first user message
 * (used only once per new chat)
 */
function generateTitleFromInput(input) {
  return input
    .replace(/\n/g, " ")
    .trim()
    .slice(0, 60) + (input.length > 60 ? "..." : "");
}

/**
 * POST /smartmix/process
 *
 * Frontend payload (CONFIRMED):
 * {
 *   input: string,
 *   type: "CareerGPT" | "StudyGPT" | "ContentGPT",
 *   conversationId: string | null,
 *   activeModels: ["gpt-5-nano", "claude-3-5-sonnet", ...]
 * }
 *
 * IMPORTANT DESIGN RULE:
 * - Backend TRUSTS frontend model list
 * - Backend NEVER rewrites model names
 * - Provider selection happens inside smartMixService
 */
exports.processSmartMix = async (req, res) => {
  try {
    const { input, type, activeModels, conversationId } = req.body;
    const userId = req.user._id;

    // 🛡️ Basic validation
    if (!Array.isArray(activeModels) || activeModels.length === 0) {
      return res.status(400).json({
        msg: "No models provided"
      });
    }

    const isNewChat = !conversationId;

    log("INFO", "[Controller] SmartMix request", {
      user: req.user.email,
      newChat: isNewChat,
      activeModels
    });

    /**
     * smartmixGuard middleware already:
     * - validated ownership
     * - enforced limits
     * - attached conversation to req if exists
     */
    let conversation = req.conversation;

    // 🆕 Create new conversation if needed
    if (!conversation) {
      conversation = new QueryHistory({
        userId,
        moduleType: type,
        messages: []
      });
    }

    // 👤 USER MESSAGE
    conversation.messages.push({
      role: "user",
      content: input,
      timestamp: new Date()
    });

    // 🏷️ Set title only once (first message of new chat)
    if (isNewChat && conversation.messages.length === 1) {
      conversation.title = generateTitleFromInput(input);
    }

    /**
     * 🔥 CORE CALL
     * - input → user text (history injected inside smartMix)
     * - type → module (CareerGPT / StudyGPT / ContentGPT)
     * - conversation.messages → history
     * - activeModels → REAL model IDs from frontend
     */
    const outputs = await smartMix(
      input,
      type,
      conversation.messages,
      activeModels
    );

    // 🤖 ASSISTANT MESSAGE
    conversation.messages.push({
      role: "assistant",
      content: "AI Response",
      individualOutputs: outputs,
      timestamp: new Date()
    });

    conversation.lastUpdated = new Date();
    await conversation.save();

    // 📤 RESPONSE (frontend expects this exact shape)
    return res.json({
      conversationId: conversation._id,
      outputs
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
 * Fetch a full conversation (read-only)
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
 * Delete a conversation owned by the user
 */
exports.deleteConversationById = async (req, res) => {
  try {
    const deleted = await QueryHistory.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!deleted) {
      return res.status(404).json({
        msg: "Conversation not found or unauthorized"
      });
    }

    res.json({
      msg: "Conversation deleted successfully",
      id: req.params.id
    });
  } catch (err) {
    log("ERROR", "Delete conversation failed", err);
    res.status(500).json({ msg: "Server error" });
  }
};
