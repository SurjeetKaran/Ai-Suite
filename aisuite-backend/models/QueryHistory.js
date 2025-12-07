// const mongoose = require('mongoose');

// const QueryHistorySchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   input: { type: String, required: true },
//   output: { type: String, required: true },          // merged/summarized output
//   type: { type: String },                             // e.g., CareerGPT, StudyGPT, ContentGPT
//   individualOutputs: {                                 // module-specific outputs for Pro users
//     chatGPT: { type: String },
//     gemini: { type: String },
//     claude: { type: String }
//   },
//   date: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model('QueryHistory', QueryHistorySchema);

const mongoose = require('mongoose');

// 1. Define a Schema for individual messages within a chat
const MessageSchema = new mongoose.Schema({
  role: { 
    type: String, 
    required: true, 
    enum: ['user', 'assistant'] // 'user' = input, 'assistant' = SmartMix output
  },
  content: { type: String, required: true }, // The actual text
  
  // 🆕 Keep your Pro feature: Store individual model responses inside the message
  individualOutputs: {
    chatGPT: { type: String },
    gemini: { type: String },
    claude: { type: String }
  },
  timestamp: { type: Date, default: Date.now }
});

// 2. Define the Main Schema for the Chat Thread
const ConversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'New Chat' },   // e.g., "Resume Help..."
  moduleType: { type: String, required: true },    // e.g., CareerGPT, StudyGPT
  messages: [MessageSchema],                       // 🔄 Array of messages (The History)
  lastUpdated: { type: Date, default: Date.now }   // To sort sidebar by recent
});

module.exports = mongoose.model('Conversation', ConversationSchema);
