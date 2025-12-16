const cron = require("node-cron");
const APIKey = require("../models/APIKey");
const LoadBalancerConfig = require("../models/LoadBalancerConfig");
const logger = require("../utils/logger");

module.exports = function () {
  cron.schedule("0 0 * * *", async () => {
    try {
      logger("INFO", "Starting daily API key & provider usage reset...");

      // 1️⃣ Reset API key usage
      await APIKey.updateMany({}, { usedRequests: 0, usedTokens: 0 });

      // 2️⃣ Reset provider token usage
      await LoadBalancerConfig.updateMany(
        {},
        { $set: { "providers.$[].usedTokens": 0 } }
      );

      logger("INFO", "API key and provider usage counters reset successfully");
    } catch (err) {
      logger("ERROR", "Failed to reset usage counters", {
        error: err.message
      });
    }
  });
};
