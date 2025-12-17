/**
 * sharedChat.js
 * ---------------------------------------------------
 * Routes for ChatGPT-style shared conversations.
 *
 * Public:
 * - GET /share/:shareId
 *
 * Auth required:
 * - POST /chats/:chatId/share
 * - DELETE /share/:shareId
 * ---------------------------------------------------
 */

const express = require("express");
const router = express.Router();

const {
  createShare,
  getSharedChat,
  revokeShare,
} = require("../controllers/sharedChatController");

const { verifyToken } = require("../middleware/authMiddleware");

// Create share (authenticated)
router.post("/chats/:conversationId/share", verifyToken, createShare);

// Public shared chat view (no auth)
router.get("/share/:shareId", getSharedChat);

// Revoke share (owner only)
router.delete("/share/:shareId", verifyToken, revokeShare);

module.exports = router;
