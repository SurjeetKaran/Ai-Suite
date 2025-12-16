const crypto = require("crypto");
const logger = require("../utils/logger");

const ALGO = "aes-256-gcm";
const SECRET = process.env.KEY_ENCRYPTION_SECRET || "super-secret-encryption-key";

exports.encrypt = function (text) {
    // 🚨 HARD GUARD (MOST IMPORTANT)
    if (typeof text !== "string" || !text.trim()) {
        logger("ERROR", "Encryption failed: invalid input", {
            receivedType: typeof text,
            value: text
        });
        return null;
    }

    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(
            ALGO,
            Buffer.from(SECRET.slice(0, 32)),
            iv
        );

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
            value: encryptedText
        });
        return null;
    }

    try {
        const [ivHex, tagHex, encrypted] = encryptedText.split(":");

        const decipher = crypto.createDecipheriv(
            ALGO,
            Buffer.from(SECRET.slice(0, 32)),
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

