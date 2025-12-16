// routes/socialAuth.js
const express = require('express');
const passport = require('passport');
const router = express.Router();
const log = require('../utils/logger');

// Redirect user to Google consent screen
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google callback
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=social` }),
  (req, res) => {
    try {
      // req.user is the object returned by our strategy (contains token, role, email, name)
      const user = req.user;
      const token = encodeURIComponent(user.token);
      const role = encodeURIComponent(user.role);
      const userStr = encodeURIComponent(JSON.stringify({
        _id: user._id, name: user.name, email: user.email, subscription: user.subscription
      }));

      // Redirect to frontend social auth handler
      const redirectUrl = `${process.env.FRONTEND_URL}/social-auth?token=${token}&role=${role}&user=${userStr}`;
      log('INFO', `Google OAuth success, redirecting to ${redirectUrl}`);
      return res.redirect(redirectUrl);
    } catch (err) {
      log('ERROR', 'Google callback handler failed', err);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=social`);
    }
  }
);

// GitHub: start auth
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

// GitHub callback
router.get('/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=social` }),
  (req, res) => {
    try {
      const user = req.user;
      const token = encodeURIComponent(user.token);
      const role = encodeURIComponent(user.role);
      const userStr = encodeURIComponent(JSON.stringify({
        _id: user._id, name: user.name, email: user.email, subscription: user.subscription
      }));

      const redirectUrl = `${process.env.FRONTEND_URL}/social-auth?token=${token}&role=${role}&user=${userStr}`;
      log('INFO', `GitHub OAuth success, redirecting to ${redirectUrl}`);
      return res.redirect(redirectUrl);
    } catch (err) {
      log('ERROR', 'GitHub callback handler failed', err);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=social`);
    }
  }
);

module.exports = router;
