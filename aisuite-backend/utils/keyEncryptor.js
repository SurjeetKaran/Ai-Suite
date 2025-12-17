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
  return crypto.createHash("sha256").update(secret).digest();
}

exports.encrypt = function (text) {
  if (typeof text !== "string" || !text.trim()) {
    logger("ERROR", "Encryption failed: invalid input", {
      receivedType: typeof text,
      value: text,
    });
    return null;
  }

  try {
    const SECRET = getEncryptionSecret();
    if (!SECRET) {
      logger("ERROR", "Encryption failed: KEY_ENCRYPTION_SECRET not configured");
      return null;
    }

    const iv = crypto.randomBytes(16);
    const key = deriveKey(SECRET);

    const cipher = crypto.createCipheriv(ALGO, key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const tag = cipher.getAuthTag().toString("hex");

    return `${iv.toString("hex")}:${tag}:${encrypted}`;
  } catch (err) {
    logger("ERROR", "Encryption failed", { error: err.message });
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


