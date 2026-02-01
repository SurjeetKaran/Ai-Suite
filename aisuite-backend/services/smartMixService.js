const { buildModulePrompt } = require("../utils/promptHelper");
const log = require("../utils/logger");

// Provider usage tracker
const { updateProviderUsage } = require("../utils/providerBalancer");

// Provider handlers
const { callOpenAIProvider } = require("./providers/openaiProvider");
const { callXAIProvider } = require("./providers/xaiProvider");
const { callGoogleProvider } = require("./providers/googleProvider");
const { callGroqProvider } = require("./providers/groqProvider");

const MODEL_PROVIDER_MAP = {
  // OpenAI
  "gpt-4o": "openai",
  "gpt-5-nano": "openai",

  // xAI
  "grok-4-latest": "xai",

  // Google Gemini
  "gemini-2.0-flash": "google",

  // Groq
  "mixtral-8x7b-32768": "groq",
  "llama-3.3-70b-versatile": "groq",
  "llama-3-8b-8192": "groq"
};

const providerHandlers = {
  openai: callOpenAIProvider,
  xai: callXAIProvider,
  google: callGoogleProvider,
  groq: callGroqProvider
};

async function smartMix(
  input,
  type = "text",
  history = [],
  activeModels = []
) {
  log("INFO", "[SmartMix] Started", {
    type,
    historyLength: history.length,
    activeModels
  });

  // 1️⃣ Build history-aware input
  let finalInput = input;
  if (history?.length > 0) {
    let combined = "Conversation History:\n";
    history.forEach(msg => {
      combined += `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}\n`;
    });
    combined += `\nUser's New Question:\n${input}`;
    finalInput = combined;
  }

  // 2️⃣ Build module-specific prompt (ONCE)
  const modulePrompt = buildModulePrompt(finalInput, type);

  const outputs = {};

  // 3️⃣ Process each requested model
  for (const model of activeModels) {
    let result;

    try {
      // 🔥 NORMALIZE MODEL ID TO LOWERCASE
      const normalizedModel = String(model).toLowerCase().trim();
      
      const provider = MODEL_PROVIDER_MAP[normalizedModel];
      if (!provider) {
        throw new Error(`No provider mapped for model: ${model}`);
      }

      const handler = providerHandlers[provider];
      if (!handler) {
        throw new Error(`No handler registered for provider: ${provider}`);
      }

      log("INFO", "[SmartMix] Routing", { model: normalizedModel, provider });

      result = await handler(modulePrompt, normalizedModel);

      await updateProviderUsage(provider, result.tokensUsed || 0);

    } catch (err) {
      log("ERROR", "[SmartMix] Failed", {
        model,
        error: err.message
      });

      result = {
        text: "AI model is temporarily unavailable.",
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
