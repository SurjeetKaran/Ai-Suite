// config/passport.js

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const log = require("../utils/logger");

/* =====================================================
   Helpers: Dynamic Config Resolution
   - Prefer SystemConfig (DB, runtime)
   - Fallback to process.env (safe recovery)
===================================================== */

/**
 * Fetch config value dynamically
 */
function getCfg(key) {
  return global.SystemEnv?.[key] || process.env[key];
}

/**
 * Fetch JWT secret dynamically
 */
function getJwtSecret() {
  return global.SystemEnv?.JWT_SECRET || process.env.JWT_SECRET;
}

/* =====================================================
   Social User Handler
   - Finds existing user OR creates a new one
   - Password is RANDOM + HASHED (security)
   - JWT signed using dynamic secret
===================================================== */
async function findOrCreateSocialUser({ email, name }) {
  let user = await User.findOne({ email });

  // --------------------------
  // Create user if not exists
  // --------------------------
  if (!user) {
    const randomPwd = Math.random().toString(36).slice(-12);
    const hashedPwd = await bcrypt.hash(randomPwd, 10);

    user = await User.create({
      name,
      email,
      password: hashedPwd,
      subscription: "Free",
    });

    log("INFO", `Created new social user: ${email}`);
  }

  // --------------------------
  // Sign JWT dynamically
  // --------------------------
  const JWT_SECRET = getJwtSecret();
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET not configured for OAuth login");
  }

  const token = jwt.sign(
    { id: user._id, role: "user" },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    subscription: user.subscription,
    token,
    role: "user",
  };
}

/* =====================================================
   GOOGLE OAUTH STRATEGY
===================================================== */

const GOOGLE_CLIENT_ID = getCfg("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = getCfg("GOOGLE_CLIENT_SECRET");

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName;

          if (!email) {
            return done(new Error("Google did not return an email"), null);
          }

          const userObj = await findOrCreateSocialUser({ email, name });
          return done(null, userObj);
        } catch (err) {
          log("ERROR", "Google OAuth strategy failed", err);
          return done(err, null);
        }
      }
    )
  );
} else {
  log("WARN", "Google OAuth disabled - credentials not configured");
}

/* =====================================================
   GITHUB OAUTH STRATEGY
===================================================== */

const GITHUB_CLIENT_ID = getCfg("GITHUB_CLIENT_ID");
const GITHUB_CLIENT_SECRET = getCfg("GITHUB_CLIENT_SECRET");

if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: GITHUB_CLIENT_ID,
        clientSecret: GITHUB_CLIENT_SECRET,
        callbackURL: "/auth/github/callback",
        scope: ["user:email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // GitHub may not return email → generate fallback
          const email =
            profile.emails?.[0]?.value ||
            `${profile.username}@github.local`;

          const name = profile.displayName || profile.username;

          const userObj = await findOrCreateSocialUser({ email, name });
          return done(null, userObj);
        } catch (err) {
          log("ERROR", "GitHub OAuth strategy failed", err);
          return done(err, null);
        }
      }
    )
  );
} else {
  log("WARN", "GitHub OAuth disabled - credentials not configured");
}

/* =====================================================
   Passport Session Handling
   - Sessions are NOT used (JWT-based auth)
===================================================== */

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser((id, done) => done(null, id));

module.exports = passport;
