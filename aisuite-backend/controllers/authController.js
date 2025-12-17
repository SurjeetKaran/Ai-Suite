const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const log = require('../utils/logger');
const QueryHistory = require('../models/QueryHistory');

const crypto = require('crypto');
const Team = require('../models/Team');
const sendEmail = require('../utils/sendEmail');
const { getRazorpayInstance } = require("../utils/razorpay");

// ------------------- SIGNUP -------------------
exports.signup = async (req, res) => {
    const { name, email, password, subscription } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ msg: 'Name, email, and password are required' });
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ msg: 'JWT secret not configured' });
    }

    log('INFO', `Signup attempt for email: ${email}, subscription: ${subscription || 'Free'}`);

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ msg: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({ 
            name,
            email, 
            password: hashedPassword,
            subscription: subscription || 'Free'
        });
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        log('INFO', `Signup successful for email: ${email}`, { userId: user._id, subscription: user.subscription });

        res.json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                subscription: user.subscription,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    } catch (err) {
        log('ERROR', `Signup error for email: ${email}`, err.stack);
        res.status(500).json({ msg: 'Server error' });
    }
};

// ------------------- UNIFIED LOGIN -------------------
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: "Email and password required" });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ msg: "JWT secret not configured" });
  }

  log("INFO", `Unified login attempt for: ${email}`);

  try {
    // ------------------------------------------------
    // Resolve ADMIN credentials (DB first, ENV fallback)
    // ------------------------------------------------
    const ADMIN_EMAIL =
      global.SystemEnv?.ADMIN_EMAIL || process.env.ADMIN_EMAIL;

    const ADMIN_PASSWORD =
      global.SystemEnv?.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

    // ------------------------------------------
    // 1️⃣ CHECK ADMIN (Highest Priority)
    // ------------------------------------------
    if (ADMIN_EMAIL && email === ADMIN_EMAIL) {
      if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
        log("WARN", `Admin login failed (bad password): ${email}`);
        return res.status(401).json({ msg: "Invalid credentials" });
      }

      const token = jwt.sign(
        { email: ADMIN_EMAIL, role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      log("INFO", `Admin logged in: ${ADMIN_EMAIL}`);

      return res.json({
        token,
        role: "admin",
        user: {
          email: ADMIN_EMAIL,
          name: "Super Admin",
        },
      });
    }

    // ------------------------------------------
    // 2️⃣ CHECK USER (Standard Users)
    // ------------------------------------------
    const user = await User.findOne({ email });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        log("WARN", `User login failed (bad password): ${email}`);
        return res.status(401).json({ msg: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user._id, role: "user" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      log("INFO", `User logged in: ${email}`);

      return res.json({
        token,
        role: "user",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          subscription: user.subscription,
        },
      });
    }

    // ------------------------------------------
    // 3️⃣ CHECK TEAM (Team Leaders)
    // ------------------------------------------
    const team = await Team.findOne({ email });
    if (team) {
      const isMatch = await bcrypt.compare(password, team.password);
      if (!isMatch) {
        log("WARN", `Team login failed (bad password): ${email}`);
        return res.status(401).json({ msg: "Invalid credentials" });
      }

      const token = jwt.sign(
        { teamId: team._id, role: "teamAdmin" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      log("INFO", `Team Admin logged in: ${email}`);

      return res.json({
        token,
        role: "teamAdmin",
        user: {
          _id: team._id,
          name: team.name,
          email: team.email,
          isTeam: true,
        },
      });
    }

    // ------------------------------------------
    // 4️⃣ NO MATCH FOUND
    // ------------------------------------------
    log("WARN", `Login failed (user not found): ${email}`);
    return res.status(404).json({ msg: "User not found" });

  } catch (err) {
    log("ERROR", `Login error for: ${email}`, err.stack);
    return res.status(500).json({ msg: "Server error" });
  }
};


// ------------------- GET LOGGED-IN USER -------------------
exports.getMe = async (req, res) => {
    try {
    log('INFO', `GetMe requested by user ${req.user?._id || 'unknown'}`);
        const userId = req.user._id; // populated by auth middleware
        const user = await User.findById(userId).select(
            '_id name email subscription dailyQueryCount createdAt updatedAt'
        );

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json({ user });
    } catch (err) {
        log('ERROR', 'GetMe failed', err.stack, { userId: req.user?._id });
        res.status(500).json({ msg: 'Server error' });
    }
};

// ------------------- GET LOGGED-IN USER HISTORY -------------------
exports.getHistory = async (req, res) => {
    try {
    log('INFO', `GetHistory requested by user ${req.user?._id || 'unknown'}`);
        const userId = req.user._id;
        const user = await User.findById(userId).select('subscription');
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // 1. Determine limit based on subscription
        const limit = user.subscription === 'Free' ? 10 : 0; // 10 chats for free users

        // 2. Query the NEW Schema logic
        // We look for conversations, sort by 'lastUpdated', and select only list info
        let query = QueryHistory.find({ userId })
            .sort({ lastUpdated: -1 })
            .select('title moduleType lastUpdated'); 

        if (limit > 0) {
            query = query.limit(limit);
        }

        const conversations = await query.lean();

        // 3. Format the list for the Frontend Sidebar
        const formattedHistory = conversations.map((chat) => ({
            id: chat._id,               // Frontend needs ID to load the full chat later
            title: chat.title,          // "What is water?..."
            moduleType: chat.moduleType,// "StudyGPT"
            date: chat.lastUpdated      // To show "2 mins ago"
        }));

        res.json({ history: formattedHistory });

    } catch (err) {
        log('ERROR', 'GetHistory failed', err.stack, { userId: req.user?._id });
        res.status(500).json({ msg: 'Failed to fetch history' });
    }
};

// ------------------- DELETE ALL HISTORY -------------------
exports.clearAllHistory = async (req, res) => {
    try {
        const userId = req.user._id;

        // Delete all conversations belonging to this user
        const result = await QueryHistory.deleteMany({ userId });

        log('INFO', `User ${userId} cleared all history. Deleted count: ${result.deletedCount}`);

        res.json({ msg: 'History cleared successfully', deletedCount: result.deletedCount });
    } catch (err) {
        log('ERROR', 'Clear history failed', err.stack, { userId: req.user?._id });
        res.status(500).json({ msg: 'Failed to clear history' });
    }
};

// ------------------- FORGOT PASSWORD -------------------
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  log('INFO', `Forgot Password request for: ${email}`);

  try {
    let user = null;
    let team = null;
    let memberIndex = -1;
    let userType = 'user'; // 'user', 'teamLeader', 'teamMember'

    // 1. Check User
    user = await User.findOne({ email });
    
    // 2. Check Team Leader
    if (!user) {
      team = await Team.findOne({ email });
      if (team) {
        userType = 'teamLeader';
        user = team; // Treat team leader as "user" object for token saving
      }
    }

    // 3. Check Team Member (Deep Search)
    if (!user && !team) {
      // Find a team that has this email in its members array
      team = await Team.findOne({ "members.email": email });
      if (team) {
        userType = 'teamMember';
        memberIndex = team.members.findIndex(m => m.email === email);
        user = team.members[memberIndex]; // Target the specific member object
      }
    }

    if (!user) {
      log('WARN', `Forgot Password: No account found for ${email}`);
      return res.status(404).json({ msg: 'Email could not be sent' });
    }

    // 4. Generate Token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expireTime = Date.now() + 10 * 60 * 1000;

    // 5. Save Token
    if (userType === 'teamMember') {
      // We must save the PARENT team document because the member is inside it
      team.members[memberIndex].resetPasswordToken = hashedToken;
      team.members[memberIndex].resetPasswordExpire = expireTime;
      await team.save();
    } else {
      // Standard User or Team Leader
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpire = expireTime;
      await user.save();
    }

    // 6. Send Email
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
    const message = `You (or your team admin) requested a password reset. Click here: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: email, // Use the requested email
        subject: 'AiSuite Password Reset',
        message
      });
      res.json({ success: true, data: 'Email sent' });
    } catch (err) {
      // Cleanup on fail
      if (userType === 'teamMember') {
        team.members[memberIndex].resetPasswordToken = undefined;
        team.members[memberIndex].resetPasswordExpire = undefined;
        await team.save();
      } else {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
      }
      return res.status(500).json({ msg: 'Email could not be sent' });
    }

  } catch (err) {
    log('ERROR', 'Forgot Password Error', err.stack);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ------------------- RESET PASSWORD -------------------
exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    let user = null;
    let team = null;
    let memberIndex = -1;
    let userType = 'user';

    // 1. Search User
    user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    // 2. Search Team Leader
    if (!user) {
      team = await Team.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
      });
      if (team) {
        userType = 'teamLeader';
        user = team;
      }
    }

    // 3. Search Team Member
    if (!user && !team) {
      // Find team where ANY member matches the token and expiry
      team = await Team.findOne({
        members: {
          $elemMatch: {
            resetPasswordToken: resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
          }
        }
      });

      if (team) {
        userType = 'teamMember';
        memberIndex = team.members.findIndex(m => m.resetPasswordToken === resetPasswordToken);
        user = team.members[memberIndex];
      }
    }

    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired token' });
    }

    // 4. Hash New Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // 5. Save New Password
    if (userType === 'teamMember') {
      team.members[memberIndex].password = hashedPassword;
      team.members[memberIndex].resetPasswordToken = undefined;
      team.members[memberIndex].resetPasswordExpire = undefined;
      await team.save();
    } else {
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
    }

    res.json({ success: true, msg: "Password updated successfully. You can now login." });

  } catch (err) {
    log('ERROR', 'Reset Password Error', err.stack);
    res.status(500).json({ msg: 'Server error' });
  }
};


// ------------------- CREATE RAZORPAY ORDER -------------------

exports.createPaymentOrder = async (req, res) => {
  try {
    const razorpay = getRazorpayInstance();

    if (!razorpay) {
      return res.status(500).json({
        msg: "Razorpay is not configured. Contact support or add keys in admin panel."
      });
    }

    const { amount, currency, receipt } = req.body;
    if (!amount) return res.status(400).json({ msg: 'Amount is required' });

    const options = {
      amount: parseInt(amount * 100), // convert rupees to paise
      currency: currency || 'INR',
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    if (!order) return res.status(500).json({ msg: 'Failed to create Razorpay order' });

    res.json({ order });
  } catch (err) {
    log('ERROR', 'Razorpay order creation failed', err);
    res.status(500).json({ msg: 'Payment order creation failed' });
  }
};

// ------------------- VERIFY PAYMENT & UPGRADE SUBSCRIPTION -------------------
exports.verifyPayment = async (req, res) => {
  try {
    const razorpay = getRazorpayInstance();

    if (!razorpay) {
      return res.status(500).json({
        msg: "Razorpay is not configured. Contact support or add keys in admin panel."
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user._id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ msg: "Payment details missing" });
    }

    // Read secret dynamically
    const secret =
      (global.SystemEnv && global.SystemEnv.RAZORPAY_KEY_SECRET) ||
      process.env.RAZORPAY_KEY_SECRET;

    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ msg: "Invalid payment signature" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Upgrade subscription
    const now = new Date();
    const expiry = new Date(now);
    expiry.setDate(expiry.getDate() + 30);

    user.subscription = "Pro";
    user.subscribedAt = now;
    user.expiryDate = expiry;
    await user.save();

    log("INFO", "User subscription upgraded to Pro", { userId });

    res.json({
      msg: "Payment verified successfully, subscription upgraded to Pro",
      subscription: user.subscription,
      expiryDate: expiry,
    });
  } catch (err) {
    log("ERROR", "Payment verification failed", err);
    res.status(500).json({ msg: "Payment verification failed" });
  }
};

// ------------------- DELETE MY ACCOUNT -------------------
exports.deleteMe = async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    log('WARN', 'DeleteMe attempted without authenticated user');
    return res.status(401).json({ msg: 'Unauthorized' });
  }

  log('INFO', `DeleteMe requested`, { userId });

  try {
    // 1️⃣ Check user exists
    const user = await User.findById(userId);
    if (!user) {
      log('WARN', 'DeleteMe failed: user not found', { userId });
      return res.status(404).json({ msg: 'User not found' });
    }

    // 🚫 Safety check (optional but recommended)
    if (user.email === process.env.ADMIN_EMAIL) {
      log('WARN', 'Attempt to delete admin account blocked', { userId });
      return res.status(403).json({ msg: 'Admin account cannot be deleted' });
    }

    // 2️⃣ Delete all chat history
    const historyResult = await QueryHistory.deleteMany({ userId });
    log('INFO', 'User chat history deleted', {
      userId,
      deletedCount: historyResult.deletedCount
    });

    // 3️⃣ Delete user account
    await User.findByIdAndDelete(userId);
    log('INFO', 'User account deleted successfully', { userId });

    // 4️⃣ Respond
    res.json({
      success: true,
      msg: 'Your account and all associated data have been permanently deleted.'
    });

  } catch (err) {
    log('ERROR', 'DeleteMe failed', err.stack, { userId });
    res.status(500).json({ msg: 'Failed to delete account' });
  }
};






