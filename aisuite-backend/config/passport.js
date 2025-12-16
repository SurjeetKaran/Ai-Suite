// // config/passport.js
// const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const GitHubStrategy = require('passport-github2').Strategy;
// const User = require('../models/User');
// const jwt = require('jsonwebtoken');
// const log = require('../utils/logger');

// if (!process.env.JWT_SECRET) {
//   throw new Error('JWT_SECRET must be set in env');
// }

// /**
//  * Helper: create/find user and attach token + role
//  * Returns a plain object (not Mongoose doc) with token and role
//  */
// async function findOrCreateSocialUser({ email, name, provider }) {
//   // 1) Try find by email
//   let user = await User.findOne({ email });

//   // 2) If not found, create a user with a random password (they'll use social login)
//   if (!user) {
//     // create a short random password so schema's required password is satisfied
//     const randomPwd = Math.random().toString(36).slice(-12);
//     user = new User({
//       name: name || email.split('@')[0],
//       email,
//       password: randomPwd, // not used but required by schema
//       subscription: 'Free'
//     });
//     await user.save();
//     log('INFO', `Created new social user: ${email} (${provider})`);
//   } else {
//     log('INFO', `Found existing user for social login: ${email}`);
//   }

//   // Generate JWT consistent with your existing login: { id, role: 'user' } with 7d expiry
//   const token = jwt.sign({ id: user._id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '7d' });

//   // Return plain object
//   return {
//     _id: user._id,
//     name: user.name,
//     email: user.email,
//     subscription: user.subscription,
//     token,
//     role: 'user'
//   };
// }

// // ----------------- Google Strategy -----------------
// passport.use(new GoogleStrategy({
//   clientID: process.env.GOOGLE_CLIENT_ID,
//   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//   callbackURL: '/auth/google/callback'
// },
// async (accessToken, refreshToken, profile, done) => {
//   try {
//     const email = profile.emails?.[0]?.value;
//     const name = profile.displayName || profile.name?.givenName;

//     if (!email) {
//       log('ERROR', 'Google profile did not return email', { profile });
//       return done(new Error('No email from Google'), null);
//     }

//     const userObj = await findOrCreateSocialUser({ email, name, provider: 'google' });
//     return done(null, userObj);
//   } catch (err) {
//     log('ERROR', 'GoogleStrategy error', err);
//     return done(err, null);
//   }
// }));

// // ----------------- GitHub Strategy -----------------
// passport.use(new GitHubStrategy({
//   clientID: process.env.GITHUB_CLIENT_ID,
//   clientSecret: process.env.GITHUB_CLIENT_SECRET,
//   callbackURL: '/auth/github/callback',
//   scope: ['user:email']
// },
// async (accessToken, refreshToken, profile, done) => {
//   try {
//     // GitHub sometimes hides primary email — try profile.emails first, otherwise fallback
//     let email = profile.emails && profile.emails[0] && profile.emails[0].value;
//     if (!email) {
//       // fallback synthetic email so we can create a user record if no email provided
//       email = `${profile.username}@github-user.local`;
//     }
//     const name = profile.displayName || profile.username;

//     const userObj = await findOrCreateSocialUser({ email, name, provider: 'github' });
//     return done(null, userObj);
//   } catch (err) {
//     log('ERROR', 'GitHubStrategy error', err);
//     return done(err, null);
//   }
// }));

// // We don't use sessions; serialize/deserialize are noop
// passport.serializeUser((user, done) => done(null, user._id));
// passport.deserializeUser((id, done) => done(null, id));

// module.exports = passport;


// config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const log = require('../utils/logger');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in env');
}

// Helper to fetch config dynamically
function getCfg(key) {
  return (global.SystemEnv && global.SystemEnv[key]) || process.env[key];
}

async function findOrCreateSocialUser({ email, name }) {
  let user = await User.findOne({ email });

  if (!user) {
    const randomPwd = Math.random().toString(36).slice(-12);
    user = await User.create({
      name,
      email,
      password: randomPwd,
      subscription: "Free"
    });
    log("INFO", `Created new social user: ${email}`);
  }

  const token = jwt.sign({ id: user._id, role: 'user' }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    subscription: user.subscription,
    token,
    role: "user"
  };
}

/* ===============================
    GOOGLE STRATEGY
================================*/
const GOOGLE_CLIENT_ID = getCfg("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = getCfg("GOOGLE_CLIENT_SECRET");

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;

        if (!email) return done(new Error("Google did not return an email"), null);

        const userObj = await findOrCreateSocialUser({ email, name });
        return done(null, userObj);
      } catch (err) {
        log("ERROR", "Google strategy failed", err);
        return done(err, null);
      }
    }
  ));
} else {
  log("WARN", "Google OAuth disabled - no credentials set");
}

/* ===============================
    GITHUB STRATEGY
================================*/
const GITHUB_CLIENT_ID = getCfg("GITHUB_CLIENT_ID");
const GITHUB_CLIENT_SECRET = getCfg("GITHUB_CLIENT_SECRET");

if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy(
    {
      clientID: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callbackURL: "/auth/github/callback",
      scope: ["user:email"]
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let email = profile.emails?.[0]?.value || `${profile.username}@github.local`;
        const name = profile.displayName || profile.username;

        const userObj = await findOrCreateSocialUser({ email, name });
        return done(null, userObj);
      } catch (err) {
        log("ERROR", "GitHub strategy error", err);
        return done(err, null);
      }
    }
  ));
} else {
  log("WARN", "GitHub OAuth disabled - credentials missing");
}

// No sessions used
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser((id, done) => done(null, id));

module.exports = passport;

