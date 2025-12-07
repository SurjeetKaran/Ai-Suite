const mongoose = require("mongoose");

const MemberSchema = new mongoose.Schema({
  // Link to the real User document
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  
  name: { type: String, required: true },
  email: { type: String, required: true }, 
  password: { type: String, required: true }, // Optional: Can be removed if we rely on User doc
  subscription: { type: String, enum: ["Free", "Pro"], default: "Free" },
  dailyQueryCount: { type: Number, default: 0 },
  subscribedAt: { type: Date },
  expiryDate: { type: Date },

  // Forgot Password Fields (optional if relying on User doc, but good for redundancy)
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date }
}, { timestamps: true });

const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  subscription: { type: String, enum: ["Pro"], default: "Pro" },
  
  // Team Leaders also need reset capabilities
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },

  members: {
    type: [MemberSchema],
    default: [], 
  }
}, { timestamps: true });

module.exports = mongoose.model("Team", TeamSchema);