// routes/admin.js
const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const apiKeyController = require("../controllers/apiKeyController");
const systemConfigController = require("../controllers/systemConfigController");
const LoadBalancerConfig = require("../models/LoadBalancerConfig");
const APIKey = require("../models/APIKey");

const { 
  verifyAdminOrTeamToken, 
  verifyOwnerAdminOnly 
} = require("../middleware/authMiddleware");

const log = require("../utils/logger");

// Admin-only guard middleware
const adminOnly = (req, res, next) => {
  if (!req.admin) {
    log("WARN", "Unauthorized access attempt to admin route");
    return res.status(403).json({ msg: "Admin access only" });
  }
  next();
};

// Public routes
router.get("/plan", (req, res, next) => {
  log("INFO", "Public route accessed: GET /plan");
  next();
}, adminController.getPlans);

// Dashboard
router.get(
  "/dashboard",
  verifyAdminOrTeamToken,
  adminOnly,
  (req, res, next) => {
    log("INFO", `Admin route accessed: GET /dashboard by ${req.admin.email}`);
    next();
  },
  adminController.getAdminDashboard
);

// Update user plan
router.patch(
  "/user/:id",
  verifyAdminOrTeamToken,
  adminOnly,
  (req, res, next) => {
    log("INFO", `Admin route accessed: PATCH /user/${req.params.id} by ${req.admin.email}`);
    next();
  },
  adminController.updateUserPlan
);

// Plan management
router.post(
  "/plan",
  verifyAdminOrTeamToken,
  adminOnly,
  (req, res, next) => {
    log("INFO", `Admin route accessed: POST /plan by ${req.admin.email}`);
    next();
  },
  adminController.createPlan
);

router.delete(
  "/plan/:id",
  verifyAdminOrTeamToken,
  adminOnly,
  (req, res, next) => {
    log("INFO", `Admin route accessed: DELETE /plan/${req.params.id} by ${req.admin.email}`);
    next();
  },
  adminController.deletePlan
);

router.patch(
  "/plan/:id",
  verifyAdminOrTeamToken,
  adminOnly,
  (req, res, next) => {
    log("INFO", `Admin route accessed: PATCH /plan/${req.params.id} by ${req.admin.email}`);
    next();
  },
  adminController.updatePlan
);

// API Key management (owner only)
router.get(
  "/api-keys",
  verifyOwnerAdminOnly,
  (req, res, next) => {
    log("INFO", `Owner admin accessed: GET /api-keys`);
    next();
  },
  apiKeyController.getAllKeys
);

router.post(
  "/api-keys",
  verifyOwnerAdminOnly,
  (req, res, next) => {
    log("INFO", `Owner admin accessed: POST /api-keys`);
    next();
  },
  apiKeyController.createKey
);

router.put(
  "/api-keys/:id",
  verifyOwnerAdminOnly,
  (req, res, next) => {
    log("INFO", `Owner admin accessed: PUT /api-keys/${req.params.id}`);
    next();
  },
  apiKeyController.updateKey
);

router.delete(
  "/api-keys/:id",
  verifyOwnerAdminOnly,
  (req, res, next) => {
    log("INFO", `Owner admin accessed: DELETE /api-keys/${req.params.id}`);
    next();
  },
  apiKeyController.deleteKey
);

router.patch(
  "/api-keys/:id/toggle",
  verifyOwnerAdminOnly,
  (req, res, next) => {
    log("INFO", `Owner admin accessed: PATCH /api-keys/${req.params.id}/toggle`);
    next();
  },
  apiKeyController.toggleStatus
);

router.get(
  "/user-full-usage/:userId",
  verifyOwnerAdminOnly,
  adminController.getFullUserUsageDashboard
);


// Load balancer config (owner only)
router.get(
  "/lb-config",
  verifyOwnerAdminOnly,
  async (req, res) => {
    try {
      log("INFO", `Owner admin accessed: GET /lb-config`);
      const config = await LoadBalancerConfig.findOne();
      return res.json(config || { strategy: "weighted", retryCount: 1, cooldownMinutes: 10 });
    } catch (err) {
      log("ERROR", "Failed to fetch load balancer config", { error: err.message });
      return res.status(500).json({ msg: "Failed to load config" });
    }
  }
);

router.put(
  "/lb-config",
  verifyOwnerAdminOnly,
  async (req, res) => {
    try {
      const { strategy, retryCount, cooldownMinutes } = req.body;
      log("INFO", `Owner admin updating LB config`, { strategy, retryCount, cooldownMinutes });
      let config = await LoadBalancerConfig.findOne();
      if (!config) {
        config = await LoadBalancerConfig.create({ strategy, retryCount, cooldownMinutes });
      } else {
        if (strategy !== undefined) config.strategy = strategy;
        if (retryCount !== undefined) config.retryCount = retryCount;
        if (cooldownMinutes !== undefined) config.cooldownMinutes = cooldownMinutes;
        await config.save();
      }
      return res.json({ msg: "Load balancer config updated", config });
    } catch (err) {
      log("ERROR", "Failed to update LB config", { error: err.message });
      return res.status(500).json({ msg: "Failed to update config" });
    }
  }
);

// ---------------------------
// Provider Distribution (owner only)
// ---------------------------

// Get provider distribution config
router.get(
  "/lb-config/providers",
  verifyOwnerAdminOnly,
  async (req, res) => {
    try {
      const config = await LoadBalancerConfig.findOne();

      if (!config || !config.providers) {
        return res.json([]);
      }

      res.json(config.providers);
    } catch (err) {
      log("ERROR", "Failed to fetch provider config", { error: err.message });
      res.status(500).json({ msg: "Failed to fetch provider config" });
    }
  }
);

// Update provider distribution config
router.put(
  "/lb-config/providers",
  verifyOwnerAdminOnly,
  async (req, res) => {
    try {
      const { providers } = req.body;

      if (!Array.isArray(providers) || providers.length === 0) {
        return res.status(400).json({ msg: "Providers array is required" });
      }

      // 🔒 VALIDATIONS
      const activeProviders = providers.filter(p => p.isActive);
      if (!activeProviders.length) {
        return res.status(400).json({ msg: "At least one provider must be active" });
      }

      const totalPercentage = providers.reduce(
        (sum, p) => sum + (p.percentage || 0),
        0
      );

      if (totalPercentage !== 100) {
        return res.status(400).json({
          msg: "Total provider percentage must equal 100"
        });
      }

      let config = await LoadBalancerConfig.findOne();
      if (!config) {
        config = new LoadBalancerConfig();
      }

      config.providers = providers;
      await config.save();

      log("INFO", "Provider distribution updated", { providers });

      res.json({
        msg: "Provider distribution updated successfully",
        providers: config.providers
      });

    } catch (err) {
      log("ERROR", "Failed to update provider distribution", {
        error: err.message
      });
      res.status(500).json({ msg: "Failed to update provider distribution" });
    }
  }
);

// ---------------------------
// Provider Registry (owner only)
// ---------------------------


// ---------------------------
// Provider Registry (owner only)
// ---------------------------
router.get(
  "/providers",
  verifyOwnerAdminOnly,
  async (req, res) => {
    try {
      // Fetch only ACTIVE keys
      const keys = await APIKey.find({ isActive: true });

      // If no keys exist → no providers yet
      if (!keys.length) {
        return res.json([]);
      }

      // Build provider registry from API keys
      const providersMap = new Map();

      keys.forEach(k => {
        if (!providersMap.has(k.provider)) {
          providersMap.set(k.provider, {
            name: k.provider,
            isActive: true,
            keyCount: 1
          });
        } else {
          providersMap.get(k.provider).keyCount += 1;
        }
      });

      const providers = Array.from(providersMap.values());

      log("INFO", "Providers resolved from API keys", { providers });

      res.json(providers);
    } catch (err) {
      log("ERROR", "Failed to fetch providers from API keys", {
        error: err.message
      });
      res.status(500).json({ msg: "Failed to fetch providers" });
    }
  }
);





// ---------------------------
// System Config (dynamic .env) - owner only
// ---------------------------
router.get(
  "/system-config",
  verifyOwnerAdminOnly,
  (req, res, next) => {
    log("INFO", `Owner admin accessed: GET /system-config`);
    next();
  },
  async (req, res) => {
    const systemConfigController = require("../controllers/systemConfigController");
    return systemConfigController.getSystemConfig(req, res);
  }
);

router.post(
  "/system-config",
  verifyOwnerAdminOnly,
  (req, res, next) => {
    log("INFO", `Owner admin accessed: POST /system-config`);
    next();
  },
  async (req, res) => {
    const systemConfigController = require("../controllers/systemConfigController");
    return systemConfigController.saveSystemConfig(req, res);
  }
);

router.delete(
  "/system-config/:key",
  verifyOwnerAdminOnly,
  (req, res, next) => {
    log("INFO", `Owner admin accessed: DELETE /system-config/${req.params.key}`);
    next();
  },
  async (req, res) => {
    const systemConfigController = require("../controllers/systemConfigController");
    return systemConfigController.deleteSystemConfig(req, res);
  }
);

router.get(
  "/system/models",
  async (req, res) => {
    const systemConfigController = require("../controllers/systemConfigController");
    return systemConfigController.getAvailableModels(req, res);
  }
);


// Export router
module.exports = router;
