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
    resetPassword,
    deleteMe   // 🆕 Import
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware'); // import middleware
const router = express.Router();
const log = require('../utils/logger');

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
router.delete('/delete-me', verifyToken, deleteMe);


// ------------------- PAYMENT ROUTES -------------------
router.post('/payment/create-order', verifyToken, createPaymentOrder);
router.post('/payment/verify', verifyToken, verifyPayment);

module.exports = router;

