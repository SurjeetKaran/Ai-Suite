// Simple client-side logger
const levels = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

function log(level, message, data = null) {
  const ts = new Date().toISOString();
  const out = `[${ts}] [${level}] ${message}`;
  const method = levels[level] || 'log';
  if (data) {
    console[method](out, data);
  } else {
    console[method](out);
  }
}

export default log;
