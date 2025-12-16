const mongoose = require('mongoose');
const log = require('../utils/logger');

// 1. Define a Schema for individual messages within a chat
const MessageSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: ['user', 'assistant']
  },

  content: { type: String, required: true },

  // NOW SUPPORTS OBJECTS LIKE { text, tokensUsed }
  individualOutputs: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Token usage
  // Token usage can be either a per-message summary object
  // (e.g. { model: 'chatGPT', provider: 'openai', tokens: 123 })
  // or an aggregated object keyed by model/provider. Use Mixed to allow both shapes.
  tokenUsage: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  timestamp: { type: Date, default: Date.now }
});


// 2. Define the Main Schema for the Chat Thread
const ConversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'New Chat' },
  moduleType: { type: String, required: true },
  messages: [MessageSchema],

  // 🆕 NEW: Conversation-level analytics (required for user analytics page)
  totalTokens: { type: Number, default: 0 },

  modelTokens: {
    type: Object,
    default: {
      chatGPT: 0,
      gemini: 0,
      claude: 0,
      groq: 0
    }
  },

  providerTokens: {
    type: Object,
    default: {
      groq: 0,
      openai: 0,
      anthropic: 0,
      google: 0
    }
  },

  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Conversation', ConversationSchema);

