/**
 * Minimal structured logger that wraps console with log-level control.
 * Swap out for Winston/Pino by replacing the implementations below.
 */
const isProd = process.env.NODE_ENV === 'production';

function format(level, message, meta) {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${level.toUpperCase()}] ${message}`;
  return meta ? `${base} ${JSON.stringify(meta)}` : base;
}

const logger = {
  info(message, meta) {
    console.log(format('info', message, meta));
  },
  warn(message, meta) {
    console.warn(format('warn', message, meta));
  },
  error(message, meta) {
    console.error(format('error', message, meta));
  },
  /** Only emitted outside production */
  debug(message, meta) {
    if (!isProd) {
      console.debug(format('debug', message, meta));
    }
  },
};

module.exports = logger;
