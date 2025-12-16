const mongoose = require('mongoose');
const log = require('../utils/logger');

const PlanSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },   // Free, Pro, Team
  price: { type: Number, required: true },                // e.g., 0 for Free, 249 for Pro
  dailyQueryLimit: { type: Number, default: 3 },          // 0 = unlimited
  features: [{ type: String }]                            // Array of features
}, { timestamps: true });

module.exports = mongoose.model('Plan', PlanSchema);
