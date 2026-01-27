const mongoose = require('mongoose');

/**
 * Message schema
 * Represents a single user or assistant message
 */
const MessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },

  content: {
    type: String,
    required: true
  },

  /**
   * individualOutputs example:
   * {
   *   "gpt-5-nano": { text, tokensUsed },
   *   "claude-3-5-sonnet": { text, tokensUsed }
   * }
   */
  individualOutputs: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  /**
   * tokenUsage is optional and flexible:
   * - can store per-message token stats
   * - kept as Mixed for backward compatibility
   */
  tokenUsage: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  timestamp: {
    type: Date,
    default: Date.now
  }
});

/**
 * Conversation schema
 * Represents a full chat thread
 */
const ConversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  title: {
    type: String,
    default: 'New Chat'
  },

  /**
   * Module type used for prompt generation
   * e.g. CareerGPT, StudyGPT, ContentGPT
   */
  moduleType: {
    type: String,
    required: true
  },

  messages: [MessageSchema],

  /**
   * Conversation-level token analytics
   * (aggregated over time)
   */
  totalTokens: {
    type: Number,
    default: 0
  },

  /**
   * Model-level token usage
   * DYNAMIC KEYS (no hard-coded models)
   * Example:
   * {
   *   "gpt-5-nano": 1200,
   *   "claude-3-5-sonnet": 980
   * }
   */
  modelTokens: {
    type: Map,
    of: Number,
    default: {}
  },

  /**
   * Provider-level token usage
   * Example:
   * {
   *   "openai": 1200,
   *   "anthropic": 980
   * }
   */
  providerTokens: {
    type: Map,
    of: Number,
    default: {}
  },

  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Conversation', ConversationSchema);


