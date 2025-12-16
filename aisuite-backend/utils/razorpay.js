// utils/razorpay.js
const Razorpay = require('razorpay');
const log = require('./logger');

function getRazorpayInstance() {
  const env = global.SystemEnv || {};

  const key_id = env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
  const key_secret = env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    log('WARN', 'Razorpay credentials missing; payment features may be disabled.');
    return null;
  }

  return new Razorpay({
    key_id,
    key_secret
  });
}

module.exports = { getRazorpayInstance };
