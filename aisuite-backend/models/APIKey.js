const mongoose = require("mongoose");
const log = require('../utils/logger');

const apiKeySchema = new mongoose.Schema({
    provider: { type: String, required: true },

    label: { type: String },
    key: { type: String, required: true },
    encrypted: { type: Boolean, default: false },

    weight: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },

    // Usage tracking
    usedRequests: { type: Number, default: 0 },
    usedTokens: { type: Number, default: 0 },

    // 🔥 LIMITS
    dailyLimit: { type: Number, default: 10000 },          // requests/day
    dailyTokenLimit: { type: Number, default: 1000000 },   // tokens/day ✅ NEW

    lastError: { type: String, default: "" },

    // Ensures key is selectable initially
    lastUsedAt: { type: Date, default: () => new Date(0) },
    cooldownUntil: { type: Date, default: () => new Date(0) },

}, { timestamps: true });

module.exports = mongoose.model("APIKey", apiKeySchema);


