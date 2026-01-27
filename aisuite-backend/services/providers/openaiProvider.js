const OpenAI = require("openai");
const {
  selectKey,
  updateKeyUsage,
  markKeyFailed
} = require("../../utils/keyBalancer");
const LoadBalancerConfig = require("../../models/LoadBalancerConfig");
const log = require("../../utils/logger");

const PROVIDER = "openai";

async function callOpenAIProvider(prompt, model) {
  const lbConfig = await LoadBalancerConfig.findOne() || { retryCount: 1 };
  const maxRetries = lbConfig.retryCount;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    let selectedKey = null;

    try {
      selectedKey = await selectKey(PROVIDER);

      const client = new OpenAI({
        apiKey: selectedKey.key
      });

      const response = await client.responses.create({
        model,
        input: prompt
      });

      const text = response.output_text || "";
      const tokensUsed =
        response.usage?.total_tokens ||
        response.usage?.input_tokens + response.usage?.output_tokens ||
        0;

      await updateKeyUsage(selectedKey._id, tokensUsed);

      log("INFO", "[OpenAI] Success", { model, tokensUsed });

      return { text, tokensUsed };

    } catch (err) {
      log("ERROR", "[OpenAI] Failed", { attempt, error: err.message });

      if (selectedKey?._id) {
        await markKeyFailed(selectedKey._id, err.message);
      }

      if (attempt > maxRetries) {
        return {
          text: "OpenAI is temporarily unavailable.",
          tokensUsed: 0
        };
      }
    }
  }
}

module.exports = { callOpenAIProvider };
