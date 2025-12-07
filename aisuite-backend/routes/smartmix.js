const express = require('express');
const router = express.Router();
const { processSmartMix, getConversationById, deleteConversationById } = require('../controllers/smartmixController');
const { verifyToken } = require('../middleware/authMiddleware'); // JWT middleware

router.post('/process', verifyToken, processSmartMix);
// 🆕 NEW ROUTE: Get full chat details
router.get('/history/:id', verifyToken, getConversationById);
// 🆕 NEW ROUTE: Delete specific chat
router.delete('/history/:id', verifyToken, deleteConversationById);

module.exports = router;

