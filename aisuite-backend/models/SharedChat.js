/**
 * SharedChat.js
 * ---------------------------------------------------
 * Stores a READ-ONLY snapshot of a conversation
 * used for public sharing (ChatGPT-style).
 *
 * IMPORTANT:
 * - This is NOT a live chat
 * - This is NOT updated when the original chat continues
 * - This can be revoked by the owner
 * ---------------------------------------------------
 */

const mongoose = require("mongoose");

const SharedChatSchema = new mongoose.Schema(
  {
    // Owner of the original conversation
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Reference to original chat (logical reference only)
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    // Optional title shown in share preview
    title: {
      type: String,
      default: "Shared Conversation",
    },

    // Snapshot of messages (user + assistant only)
    messages: [
      {
        role: {
          type: String,
          enum: ["user", "assistant"],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
      },
    ],

    // Public access flag
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Revocation timestamp (for audit)
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

module.exports = mongoose.model("SharedChat", SharedChatSchema);
