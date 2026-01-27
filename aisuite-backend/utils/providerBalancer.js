const LoadBalancerConfig = require("../models/LoadBalancerConfig");
const log = require("./logger");

/**
 * Increment provider token usage after successful response
 * Used for:
 * - Admin analytics
 * - Daily provider token limits
 * - Reset cron jobs
 */
async function updateProviderUsage(providerName, tokensUsed = 0) {
  try {
    const lbConfig = await LoadBalancerConfig.findOne();

    if (!lbConfig || !Array.isArray(lbConfig.providers)) {
      return;
    }

    const provider = lbConfig.providers.find(
      p => p.provider === providerName
    );

    if (!provider) {
      log("WARN", "Provider not found in load balancer config", {
        provider: providerName
      });
      return;
    }

    provider.usedTokens += tokensUsed;
    await lbConfig.save();

    log("INFO", "Provider usage updated", {
      provider: providerName,
      tokensUsed,
      totalUsed: provider.usedTokens
    });

  } catch (err) {
    log("ERROR", "Failed to update provider usage", {
      provider: providerName,
      error: err.message
    });
  }
}

module.exports = {
  updateProviderUsage
};

