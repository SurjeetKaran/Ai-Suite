const { buildAllPrompts } = require("../utils/promptHelper");
const log = require("../utils/logger");

// Provider balancer
const {
  selectProvider,
  updateProviderUsage
} = require("../utils/providerBalancer");

// Provider handlers
const { callGroqProvider } = require("./providers/groqProvider");
// const { callOpenAIProvider } = require("./providers/openaiProvider");
// const { callClaudeProvider } = require("./providers/anthropicProvider");

/**
 * 🔥 ONE-TIME provider registry
 * Add new providers HERE only (backend-only change)
 */
const providerHandlers = {
  groq: callGroqProvider,
  // openai: callOpenAIProvider,
  // anthropic: callClaudeProvider,
};

/**
 * ✅ CHANGE 1: INTERNAL MODEL OVERRIDE
 * ----------------------------------
 * Groq supports LLaMA models only.
 * We force SmartMix to use LLaMA-70B internally,
 * regardless of user-requested model.
 */
const INTERNAL_GROQ_MODEL = "llama3-70b-8192";

/**
 * SmartMix returns:
 * {
 *   chatGPT: { text: "...", tokensUsed: 123 },
 *   gemini:  { text: "...", tokensUsed: 55 },
 *   claude:  { text: "...", tokensUsed: 88 }
 * }
 */
async function smartMix(
  input,
  type = "text",
  history = [],
  activeModels = ["chatGPT", "gemini", "claude"]
) {
  log("INFO", "[SmartMix] Started", {
    type,
    historyLength: history.length,
    activeModels
  });

  // 1️⃣ Add conversation history
  let finalInput = input;
  if (history?.length > 0) {
    let combined = "Conversation History:\n";
    history.forEach(msg => {
      combined += `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}\n`;
    });
    combined += `\nUser's New Question:\n${input}`;
    finalInput = combined;
  }

  // 2️⃣ Prepare prompts
  const prompts = buildAllPrompts(finalInput, type);
  const outputs = {};

  // 3️⃣ Process each active model
  for (const model of activeModels) {
    const prompt = prompts[model];
    if (!prompt) continue;

    let result = null;
    let lastError = null;
    const triedProviders = new Set();

    // 🔁 Provider-level failover loop
    while (!result) {
      let provider;

      try {
        provider = await selectProvider();

        // Avoid retrying same provider
        if (triedProviders.has(provider)) {
          throw new Error("All providers already attempted");
        }

        triedProviders.add(provider);

        const handler = providerHandlers[provider];
        if (!handler) {
          throw new Error(`No handler registered for provider: ${provider}`);
        }

        /**
         * ✅ CHANGE 2: LOGICAL MODEL RESOLUTION
         * ------------------------------------
         * We DO NOT pass user-requested model (claude/gemini)
         * to GroqProvider.
         * We always resolve to LLaMA-70B internally.
         */
        const resolvedModel = INTERNAL_GROQ_MODEL;

        log("INFO", "[SmartMix] Provider selected", {
          provider,
          requestedModel: model,
          resolvedModel
        });

        // 🔥 Call provider with resolved Groq model
        result = await handler(prompt, resolvedModel);

        // 🧮 Update provider token usage
        await updateProviderUsage(provider, result.tokensUsed || 0);

      } catch (err) {
        lastError = err;

        log("ERROR", "[SmartMix] Provider attempt failed", {
          provider,
          requestedModel: model,
          error: err.message
        });

        // Stop retrying after all known providers attempted
        if (triedProviders.size >= Object.keys(providerHandlers).length) {
          break;
        }
      }
    }

    // Final fallback if all providers fail
    if (!result) {
      log("ERROR", "[SmartMix] All providers failed", {
        model,
        error: lastError?.message
      });

      result = {
        text: "All AI providers are temporarily unavailable. Please try again later.",
        tokensUsed: 0
      };
    }

    outputs[model] = {
      text: result.text || "",
      tokensUsed: result.tokensUsed || 0
    };
  }

  log("INFO", "[SmartMix] Completed", {
    modelCount: Object.keys(outputs).length
  });

  return outputs;
}

module.exports = { smartMix };
