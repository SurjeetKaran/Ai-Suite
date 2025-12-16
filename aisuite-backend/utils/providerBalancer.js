const LoadBalancerConfig = require("../models/LoadBalancerConfig");
const log = require("./logger");

/**
 * Select provider based on percentage distribution
 * Applies provider-level daily token limit
 */
async function selectProvider() {
  const lbConfig = await LoadBalancerConfig.findOne();

  if (!lbConfig || !lbConfig.providers || lbConfig.providers.length === 0) {
    throw new Error("No provider configuration found");
  }

  // 1️⃣ Filter active & quota-available providers
  const availableProviders = lbConfig.providers.filter(p =>
    p.percentage > 0 &&
    p.usedTokens < p.dailyTokenLimit
  );

  if (!availableProviders.length) {
    log("ERROR", "All providers exhausted or disabled");
    throw new Error("All providers are exhausted for today");
  }

  // 2️⃣ Validate total percentage = 100
  const totalPercentage = availableProviders.reduce(
    (sum, p) => sum + p.percentage,
    0
  );

  if (totalPercentage !== 100) {
    log("ERROR", "Provider percentage misconfiguration", {
      totalPercentage
    });
    throw new Error("Provider percentage must total 100");
  }

  // 3️⃣ Build weighted pool
  const pool = [];
  for (const provider of availableProviders) {
    for (let i = 0; i < provider.percentage; i++) {
      pool.push(provider.provider);
    }
  }

  // 4️⃣ Random selection
  const selectedProvider = pool[Math.floor(Math.random() * pool.length)];

  log("INFO", "Provider selected", { provider: selectedProvider });

  return selectedProvider;
}

/**
 * Increment provider token usage after successful response
 */
async function updateProviderUsage(providerName, tokensUsed) {
  const lbConfig = await LoadBalancerConfig.findOne();

  if (!lbConfig || !lbConfig.providers) return;

  const provider = lbConfig.providers.find(
    p => p.provider === providerName
  );

  if (!provider) return;

  provider.usedTokens += tokensUsed;
  await lbConfig.save();

  log("INFO", "Provider usage updated", {
    provider: providerName,
    tokensUsed,
    totalUsed: provider.usedTokens
  });
}

module.exports = {
  selectProvider,
  updateProviderUsage
};
