const axios = require("axios");
const {
  selectKey,
  updateKeyUsage,
  markKeyFailed
} = require("../../utils/keyBalancer");
const LoadBalancerConfig = require("../../models/LoadBalancerConfig");
const log = require("../../utils/logger");

const PROVIDER = "deepseek";
const BASE_URL = "https://api.deepseek.com/v1/chat/completions";

async function callDeepSeekProvider(prompt, model) {
  const lbConfig = await LoadBalancerConfig.findOne() || { retryCount: 1 };
  const maxRetries = lbConfig.retryCount;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    let selectedKey = null;

    try {
      selectedKey = await selectKey(PROVIDER);

      const res = await axios.post(
        BASE_URL,
        {
          model,
          messages: [{ role: "user", content: prompt }]
        },
        {
          headers: {
            Authorization: `Bearer ${selectedKey.key}`,
            "Content-Type": "application/json"
          }
        }
      );

      const text = res.data.choices?.[0]?.message?.content || "";
      const tokensUsed = res.data.usage?.total_tokens || 0;

      await updateKeyUsage(selectedKey._id, tokensUsed);

      log("INFO", "[DeepSeek] Success", { model, tokensUsed });

      return { text, tokensUsed };

    } catch (err) {
      log("ERROR", "[DeepSeek] Failed", { attempt, error: err.message });

      if (selectedKey?._id) {
        await markKeyFailed(selectedKey._id, err.message);
      }

      if (attempt > maxRetries) {
        return {
          text: "DeepSeek is temporarily unavailable.",
          tokensUsed: 0
        };
      }
    }
  }
}

module.exports = { callDeepSeekProvider };
