const mongoose = require("mongoose");

const ProviderRuleSchema = new mongoose.Schema({
  provider: {
    type: String,
    required: true,
  },

  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },

  dailyTokenLimit: {
    type: Number,
    default: 1000000 // 1M tokens/day per provider
  },

  usedTokens: {
    type: Number,
    default: 0
  }
}, { _id: false });

const lbConfigSchema = new mongoose.Schema({
  strategy: {
    type: String,
    enum: ["weighted", "round_robin", "failover"],
    default: "weighted"
  },

  retryCount: { type: Number, default: 1 },
  cooldownMinutes: { type: Number, default: 10 },

  // ✅ NEW
  providers: {
    type: [ProviderRuleSchema],
    default: []
  }

}, { timestamps: true });

module.exports = mongoose.model("LoadBalancerConfig", lbConfigSchema);

