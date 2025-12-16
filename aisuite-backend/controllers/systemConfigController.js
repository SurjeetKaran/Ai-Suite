// controllers/systemConfigController.js
const SystemConfig = require("../models/SystemConfig");
const log = require("../utils/logger");


/**
 * Get all dynamic system configurations
 */
exports.getSystemConfig = async (req, res) => {
  try {
    log("INFO", `System config requested by ${req.admin?.email || req.user?.email || 'unknown'}`);
    const configs = await SystemConfig.find().sort({ key: 1 });
    res.json(configs);
  } catch (error) {
    log("ERROR", "Failed to fetch system configuration", { error: error.message });
    res.status(500).json({ msg: "Failed to fetch system configuration" });
  }
};


/**
 * Create or update a system configuration
 * Body: { key: "SMTP_EMAIL", value: "example@gmail.com" }
 */
exports.saveSystemConfig = async (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key) return res.status(400).json({ msg: "Key is required" });

    const updatedConfig = await SystemConfig.findOneAndUpdate(
      { key },
      { value },
      { new: true, upsert: true }
    );

    // Update runtime memory cache
    global.SystemEnv[key] = value;

    log("INFO", "System configuration updated", { key, value });

    res.json({
      msg: "Configuration updated successfully",
      config: updatedConfig
    });

  } catch (error) {
    log("ERROR", "Failed to update system configuration", { error: error.message });
    res.status(500).json({ msg: "Failed to update configuration" });
  }
};


/**
 * Delete a configuration key
 */
exports.deleteSystemConfig = async (req, res) => {
  try {
    const { key } = req.params;

    const deleted = await SystemConfig.findOneAndDelete({ key });

    if (!deleted) {
      return res.status(404).json({ msg: "Configuration key not found" });
    }

    // Remove from memory cache
    delete global.SystemEnv[key];

    log("INFO", "Configuration deleted", { key });

    res.json({ msg: "Configuration deleted successfully" });

  } catch (error) {
    log("ERROR", "Failed to delete system configuration", { error: error.message });
    res.status(500).json({ msg: "Failed to delete configuration" });
  }
};

exports.getAvailableModels = async (req, res) => {
  const cfg = await SystemConfig.findOne({ key: "AVAILABLE_MODELS" });
  res.json(cfg?.value || []);
};
