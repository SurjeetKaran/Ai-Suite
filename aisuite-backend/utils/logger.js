// utils/logger.js

/**
 * Global logging helper
 * Usage: log('INFO', 'message', optionalData)
 */

const log = (level, message, data = null) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (data) {
        console.log(logMessage, data);
    } else {
        console.log(logMessage);
    }
};

module.exports = log;
