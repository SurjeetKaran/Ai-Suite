const APIKey = require("../models/APIKey");
const LoadBalancerConfig = require("../models/LoadBalancerConfig");
const { decrypt } = require("./keyEncryptor");
const logger = require("../utils/logger");

async function selectKey(provider) {
    const config = await LoadBalancerConfig.findOne() || { strategy: "weighted" };

    let keys = await APIKey.find({
        provider,
        isActive: true,
        cooldownUntil: { $lte: new Date() }
    });

    if (!keys.length) {
        logger("ERROR", "No active API keys available", { provider });
        throw new Error("No API keys available for provider " + provider);
    }

    // 🔥 FILTER BY BOTH REQUEST & TOKEN LIMITS
    keys = keys.filter(k =>
        k.usedRequests < k.dailyLimit &&
        k.usedTokens < k.dailyTokenLimit
    );

    if (!keys.length) {
        logger("ERROR", "All API keys exceeded daily limits", { provider });
        throw new Error("All API keys exceeded daily limits");
    }

    let selected;

    if (config.strategy === "weighted") {
        const pool = [];
        keys.forEach(k => {
            for (let i = 0; i < k.weight; i++) pool.push(k);
        });
        selected = pool[Math.floor(Math.random() * pool.length)];
    }

    if (config.strategy === "round_robin") {
        selected = keys.sort(
            (a, b) => (a.lastUsedAt || 0) - (b.lastUsedAt || 0)
        )[0];
    }

    if (config.strategy === "failover") {
        selected = keys[0];
    }

    logger("INFO", "API key selected", {
        provider,
        keyId: selected._id,
        label: selected.label,
        strategy: config.strategy
    });

    selected.lastUsedAt = new Date();
    await selected.save();

    return {
        ...selected.toObject(),
        key: decrypt(selected.key)
    };
}

async function updateKeyUsage(keyId, usedTokens = 0) {
    await APIKey.findByIdAndUpdate(keyId, {
        $inc: { usedRequests: 1, usedTokens }
    });

    logger("INFO", "API key usage updated", {
        keyId,
        tokens: usedTokens
    });
}

async function markKeyFailed(keyId, errorMessage) {
    const config = await LoadBalancerConfig.findOne();
    const cooldownMinutes = config?.cooldownMinutes || 10;

    await APIKey.findByIdAndUpdate(keyId, {
        cooldownUntil: new Date(Date.now() + cooldownMinutes * 60000),
        lastError: errorMessage
    });

    logger("WARN", "API key marked failed & cooldown applied", {
        keyId,
        cooldownMinutes,
        error: errorMessage
    });
}

module.exports = {
    selectKey,
    updateKeyUsage,
    markKeyFailed
};

