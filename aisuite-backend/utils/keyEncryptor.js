const crypto = require("crypto");
const logger = require("../utils/logger");

const ALGO = "aes-256-gcm";

function getEncryptionSecret() {
  return (
    global.SystemEnv?.KEY_ENCRYPTION_SECRET ||
    process.env.KEY_ENCRYPTION_SECRET
  );
}

function deriveKey(secret) {
  // 🔥 HARD NORMALIZATION (CRITICAL)
  const normalizedSecret = String(secret);
  return crypto.createHash("sha256").update(normalizedSecret, "utf8").digest();
}


exports.encrypt = function (text) {
  try {
    // 🔥 HARD NORMALIZATION (MOST IMPORTANT FIX)
    const normalized = String(text).trim();

    if (!normalized) {
      logger("ERROR", "Encryption failed: empty input after normalization", {
        receivedType: typeof text,
        value: text,
      });
      return null;
    }

    const SECRET = getEncryptionSecret();
    if (!SECRET) {
      logger("ERROR", "Encryption failed: KEY_ENCRYPTION_SECRET not configured");
      return null;
    }

    const iv = crypto.randomBytes(16);
    const key = deriveKey(SECRET);

    const cipher = crypto.createCipheriv(ALGO, key, iv);

    let encrypted = cipher.update(normalized, "utf8", "hex");
    encrypted += cipher.final("hex");

    const tag = cipher.getAuthTag().toString("hex");

    return `${iv.toString("hex")}:${tag}:${encrypted}`;
  } catch (err) {
    logger("ERROR", "Encryption failed", {
      reason: err.message,
      inputType: typeof text,
      inputValue: text,
    });
    return null;
  }
};


exports.decrypt = function (encryptedText) {
  if (typeof encryptedText !== "string" || !encryptedText.includes(":")) {
    logger("ERROR", "Decryption failed: invalid input", {
      value: encryptedText,
    });
    return null;
  }

  try {
    const SECRET = getEncryptionSecret();
    if (!SECRET) {
      logger("ERROR", "Decryption failed: KEY_ENCRYPTION_SECRET not configured");
      return null;
    }

    const [ivHex, tagHex, encrypted] = encryptedText.split(":");
    const key = deriveKey(SECRET);

    const decipher = crypto.createDecipheriv(
      ALGO,
      key,
      Buffer.from(ivHex, "hex")
    );

    decipher.setAuthTag(Buffer.from(tagHex, "hex"));

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err) {
    logger("ERROR", "Decryption failed", { error: err.message });
    return null;
  }
};


