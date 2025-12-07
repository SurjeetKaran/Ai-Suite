const express = require('express');
const {
    signup,
    login,
    getMe,
    getHistory,
    createPaymentOrder,
    verifyPayment,
    clearAllHistory,
    forgotPassword, // 🆕 Import
    resetPassword   // 🆕 Import
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware'); // import middleware
const router = express.Router();

// ------------------- AUTH ROUTES -------------------
router.post('/signup', signup);
router.post('/login', login);

// 🆕 Password Reset Routes
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// ✅ Protected routes
router.get('/getme', verifyToken, getMe);
router.get('/getHistory', verifyToken, getHistory);
router.delete('/history/clear', verifyToken, clearAllHistory);

// ------------------- PAYMENT ROUTES -------------------
router.post('/payment/create-order', verifyToken, createPaymentOrder);
router.post('/payment/verify', verifyToken, verifyPayment);

module.exports = router;

