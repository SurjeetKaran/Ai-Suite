const APIKey = require("../models/APIKey");
const LoadBalancerConfig = require("../models/LoadBalancerConfig");
const { encrypt } = require("../utils/keyEncryptor");
const logger = require("../utils/logger");

/**
 * Utility: rebuild provider distribution from API keys
 */
async function syncProvidersWithLB() {
    const providers = await APIKey.distinct("provider");

    if (!providers.length) {
        await LoadBalancerConfig.deleteOne({});
        return;
    }

    const count = providers.length;
    const base = Math.floor(100 / count);
    let remainder = 100 - base * count;

    const providerRules = providers.map((p) => ({
        provider: p,
        percentage: base + (remainder-- > 0 ? 1 : 0),
        isActive: true,
        dailyTokenLimit: 1_000_000,
        usedTokens: 0
    }));

    let config = await LoadBalancerConfig.findOne();
    if (!config) config = new LoadBalancerConfig();

    config.providers = providerRules;
    await config.save();

    logger("INFO", "Load balancer providers synced", { providerRules });
}

/**
 * GET ALL KEYS
 */
exports.getAllKeys = async (req, res) => {
    try {
        const keys = await APIKey.find();
        const masked = keys.map(k => ({
            ...k.toObject(),
            key: "********"
        }));

        logger("INFO", "Admin fetched API key list");
        res.json(masked);
    } catch (err) {
        logger("ERROR", "Failed to fetch API keys", { error: err.message });
        res.status(500).json({ message: "Failed to fetch API keys" });
    }
};

/**
 * CREATE KEY  ✅ FIXED
 */
exports.createKey = async (req, res) => {
    try {
        let {
            provider,
            label,
            key,
            weight,
            dailyLimit,
            dailyTokenLimit
        } = req.body;

        if (!provider || !key) {
            return res.status(400).json({
                message: "Provider and API key are required"
            });
        }

        // 🚨 HARD GUARD (CRITICAL FIX)
        if (typeof key !== "string") {
            logger("ERROR", "Invalid API key type received", {
                provider,
                receivedType: typeof key,
                value: key
            });
            return res.status(400).json({
                message: "API key must be a string"
            });
        }

        key = key.trim();
        if (!key) {
            return res.status(400).json({
                message: "API key cannot be empty"
            });
        }

        const existingLabel = await APIKey.findOne({ provider, label });
        if (existingLabel) {
            return res.status(400).json({
                message: `A key with the label "${label}" already exists for provider "${provider}".`
            });
        }

        const encryptedKey = encrypt(key);
        if (!encryptedKey) {
            return res.status(500).json({
                message: "Failed to encrypt API key"
            });
        }

        const newKey = await APIKey.create({
            provider,
            label,
            key: encryptedKey,
            encrypted: true,
            weight,
            dailyLimit,
            dailyTokenLimit
        });

        // 🔥 AUTO-SYNC PROVIDERS
        await syncProvidersWithLB();

        logger("INFO", "API key created", { provider, label });
        res.status(201).json({
            message: "API key added successfully",
            key: newKey
        });

    } catch (err) {
        logger("ERROR", "Failed to create API key", { error: err.message });
        res.status(500).json({ message: "Failed to create API key" });
    }
};

/**
 * UPDATE KEY  ✅ FIXED
 */
exports.updateKey = async (req, res) => {
    try {
        const { id } = req.params;
        const update = req.body;

        if (update.key) {
            // 🚨 HARD GUARD (CRITICAL FIX)
            if (typeof update.key !== "string") {
                logger("ERROR", "Invalid API key type on update", {
                    id,
                    receivedType: typeof update.key,
                    value: update.key
                });
                return res.status(400).json({
                    message: "API key must be a string"
                });
            }

            update.key = encrypt(update.key.trim());
            if (!update.key) {
                return res.status(500).json({
                    message: "Failed to encrypt API key"
                });
            }
        }

        const updated = await APIKey.findByIdAndUpdate(id, update, { new: true });

        logger("INFO", "API key updated", { id });
        res.json({
            message: "API key updated successfully",
            key: updated
        });

    } catch (err) {
        logger("ERROR", "Failed to update API key", { error: err.message });
        res.status(500).json({ message: "Failed to update API key" });
    }
};

/**
 * DELETE KEY
 */
exports.deleteKey = async (req, res) => {
    try {
        await APIKey.findByIdAndDelete(req.params.id);

        // 🔥 RE-SYNC PROVIDERS
        await syncProvidersWithLB();

        logger("WARN", "API key deleted", { id: req.params.id });
        res.json({ message: "API key deleted" });
    } catch (err) {
        logger("ERROR", "Failed to delete API key", { error: err.message });
        res.status(500).json({ message: "Failed to delete API key" });
    }
};

/**
 * TOGGLE STATUS
 */
exports.toggleStatus = async (req, res) => {
    try {
        const key = await APIKey.findById(req.params.id);
        key.isActive = !key.isActive;
        await key.save();

        logger("INFO", "API key status toggled", {
            id: key._id,
            active: key.isActive
        });

        res.json({
            message: "Status updated",
            isActive: key.isActive
        });
    } catch (err) {
        logger("ERROR", "Failed to toggle key status", { error: err.message });
        res.status(500).json({ message: "Failed to toggle key" });
    }
};
