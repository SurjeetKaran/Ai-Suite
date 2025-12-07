
const log = require('../utils/logger');
const QueryHistory = require('../models/QueryHistory');
const { smartMix } = require('../services/smartMixService');

/**
 * POST /smartmix/process
 * Logic:
 * - Counter increments ONLY on New Chats.
 * - But if Counter >= 3, EVERYTHING is blocked (including replies).
 */
exports.processSmartMix = async (req, res) => {
    const { 
        input, 
        type, 
        conversationId, 
        activeModels = ['chatGPT', 'gemini', 'claude'] 
    } = req.body; 

    const user = req.user;
    const isNewChat = !conversationId;

    log('INFO', `[Controller] Request from: ${user.email} | New Chat: ${isNewChat}`);

    try {
        // 1️⃣ CHECK DAILY LIMIT (For New Chats)
        if (user.subscription === 'Free' && user.dailyQueryCount >= 3 && isNewChat) {
            log('WARN', `[Controller] 🛑 Free limit hit for ${user.email} (Blocked New Chat)`);
            return res.status(403).json({ 
                msg: 'Daily limit reached. You can reply to existing chats, but cannot start new ones.' 
            });
        }

        // 2️⃣ Fetch Context
        let historyDoc;
        let historyContext = []; 

        if (conversationId) {
            historyDoc = await QueryHistory.findOne({ _id: conversationId, userId: user._id });
            
            if (historyDoc) {
                // 🔴 NEW: CHECK CONVERSATION LENGTH LIMIT (For Replies)
                if (user.subscription === 'Free') {
                    const userMessageCount = historyDoc.messages.filter(m => m.role === 'user').length;
                    if (userMessageCount >= 10) {
                        log('WARN', `[Controller] 🛑 Chat length limit hit for ${user.email}`);
                        return res.status(403).json({ 
                            msg: 'Free conversation limit reached (10 messages). Upgrade to Pro to continue.' 
                        });
                    }
                }

                historyContext = historyDoc.messages.map(msg => ({
                    role: msg.role,
                    content: msg.content 
                }));
                log('INFO', `[Controller] 🔄 Continuing conversation: ${conversationId}`);
            } else {
                // Edge Case: Invalid ID sent
                if (user.subscription === 'Free' && user.dailyQueryCount >= 3) {
                     return res.status(403).json({ msg: 'Limit reached.' });
                }
            }
        }

        // 3️⃣ Call Service
        const results = await smartMix(input, type, historyContext, activeModels);

        // 4️⃣ Save to Database
        if (!historyDoc) {
            historyDoc = new QueryHistory({
                userId: user._id,
                moduleType: type,
                title: input.substring(0, 30) + "...", 
                messages: []
            });
            log('INFO', `[Controller] ✨ Created new conversation`);
        }

        const mainContent = results.gemini || Object.values(results)[0] || "No output generated";

        historyDoc.messages.push({ role: 'user', content: input });
        historyDoc.messages.push({ 
            role: 'assistant', 
            content: mainContent,      
            individualOutputs: results 
        });

        historyDoc.lastUpdated = Date.now();
        await historyDoc.save();

        // 5️⃣ Update User Stats (Only increment daily counter for NEW chats)
        if (user.subscription === 'Free' && isNewChat) {
            user.dailyQueryCount += 1;
            await user.save();
            log('INFO', `[Controller] Incremented daily count to ${user.dailyQueryCount}`);
        }

        res.json({
            conversationId: historyDoc._id,
            outputs: results 
        });

    } catch (err) {
        log('ERROR', '[Controller] 💥 Processing failed', err.message);
        res.status(500).json({ msg: 'Processing failed', error: err.message });
    }
};

exports.getConversationById = async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    log('INFO', `[Controller] Fetching conversation details...`, { conversationId: id, userId });

    try {
        const conversation = await QueryHistory.findOne({ _id: id, userId });

        if (!conversation) {
            log('WARN', `[Controller] Conversation not found or access denied`, { conversationId: id });
            return res.status(404).json({ msg: 'Conversation not found' });
        }

        log('INFO', `[Controller] Conversation retrieved successfully`, { conversationId: id });

        res.json({ conversation });
    } catch (err) {
        log('ERROR', 'Failed to fetch conversation details', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

/**
 * DELETE /smartmix/history/:id
 * Deletes a specific conversation by ID
 */
exports.deleteConversationById = async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    log('INFO', `[Controller] Attempting to delete conversation: ${id}`, { userId });

    try {
        const result = await QueryHistory.findOneAndDelete({ _id: id, userId });

        if (!result) {
            log('WARN', `[Controller] Delete failed - Chat not found`, { conversationId: id });
            return res.status(404).json({ msg: 'Conversation not found or unauthorized' });
        }

        log('INFO', `[Controller] Conversation deleted successfully`, { conversationId: id });
        res.json({ msg: 'Conversation deleted successfully', id });

    } catch (err) {
        log('ERROR', 'Failed to delete conversation', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};