/**
 * sharedChatController.js
 * ---------------------------------------------------
 * Handles ChatGPT-style "Share Conversation" feature.
 *
 * Features:
 * - Create snapshot share (auth required)
 * - Fetch shared chat (public, read-only)
 * - Revoke shared chat (owner only)
 *
 * SECURITY:
 * - No system prompts exposed
 * - No provider metadata exposed
 * - No API keys or tokens exposed
 * - Snapshot is immutable
 * ---------------------------------------------------
 */

const SharedChat = require("../models/SharedChat");
const Conversation = require("../models/QueryHistory"); // 👈 actual Conversation model
const log = require("../utils/logger");

/**
 * =====================================================
 * CREATE SHARE SNAPSHOT
 * POST /chats/:conversationId/share
 * Auth required
 * =====================================================
 */
exports.createShare = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    log("INFO", "Create share requested", {
      conversationId,
      userId,
    });

    // ✅ Fetch SINGLE conversation by _id + owner
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId,
    });

    if (!conversation) {
      log("WARN", "Share failed: conversation not found", {
        conversationId,
        userId,
      });
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    // ✅ Build snapshot (user + assistant messages only)
    const messages = conversation.messages
      .filter(
        (m) => m.role === "user" || m.role === "assistant"
      )
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    if (!messages.length) {
      log("WARN", "Share failed: conversation has no shareable messages", {
        conversationId,
      });
      return res.status(400).json({
        message: "Conversation is empty",
      });
    }

    // ✅ Create immutable shared snapshot
    const sharedChat = await SharedChat.create({
      ownerUserId: userId,
      chatId: conversation._id, // logical reference
      title: conversation.title || "Shared Conversation",
      messages,
    });

    log("INFO", "Conversation shared successfully", {
      shareId: sharedChat._id,
      conversationId,
      userId,
    });

    res.status(201).json({
      shareId: sharedChat._id,
      shareUrl: `/share/${sharedChat._id}`,
    });
  } catch (err) {
    log("ERROR", "Failed to create shared chat", {
      error: err.message,
    });
    res.status(500).json({
      message: "Failed to share conversation",
    });
  }
};

/**
 * =====================================================
 * FETCH SHARED CHAT (PUBLIC)
 * GET /share/:shareId
 * No auth required
 * =====================================================
 */
exports.getSharedChat = async (req, res) => {
  try {
    const { shareId } = req.params;

    log("INFO", "Public shared chat fetch", { shareId });

    const sharedChat = await SharedChat.findOne({
      _id: shareId,
      isActive: true,
    }).select("title messages createdAt");

    if (!sharedChat) {
      log("WARN", "Shared chat not found or revoked", { shareId });
      return res.status(404).json({
        message: "Shared conversation not found",
      });
    }

    res.json({
      title: sharedChat.title,
      messages: sharedChat.messages,
      createdAt: sharedChat.createdAt,
    });
  } catch (err) {
    log("ERROR", "Failed to fetch shared chat", {
      error: err.message,
    });
    res.status(500).json({
      message: "Failed to load shared conversation",
    });
  }
};

/**
 * =====================================================
 * REVOKE SHARED CHAT
 * DELETE /share/:shareId
 * Auth required (owner only)
 * =====================================================
 */
exports.revokeShare = async (req, res) => {
  try {
    const { shareId } = req.params;
    const userId = req.user._id;

    log("INFO", "Revoke share requested", {
      shareId,
      userId,
    });

    const sharedChat = await SharedChat.findOne({
      _id: shareId,
      ownerUserId: userId,
      isActive: true,
    });

    if (!sharedChat) {
      log("WARN", "Revoke failed: not owner or not found", {
        shareId,
        userId,
      });
      return res.status(404).json({
        message: "Shared conversation not found",
      });
    }

    sharedChat.isActive = false;
    sharedChat.revokedAt = new Date();
    await sharedChat.save();

    log("INFO", "Shared chat revoked", {
      shareId,
      userId,
    });

    res.json({
      message: "Shared conversation revoked",
    });
  } catch (err) {
    log("ERROR", "Failed to revoke shared chat", {
      error: err.message,
    });
    res.status(500).json({
      message: "Failed to revoke shared conversation",
    });
  }
};
