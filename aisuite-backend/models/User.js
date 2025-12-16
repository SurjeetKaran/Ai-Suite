const mongoose = require('mongoose');
const log = require('../utils/logger');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true }, 
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  subscription: { type: String, enum: ['Free', 'Pro'], default: 'Free' },
  dailyQueryCount: { type: Number, default: 0 },
  
  // Subscription timing fields
  subscribedAt: { type: Date },
  expiryDate: { type: Date },

  // 🆕 Forgot Password Fields
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);



