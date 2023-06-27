import { config } from "../config/env.js";

const LEVELS = { silent: 0, error: 1, warn: 2, info: 3, debug: 4 };

const enabled = (level) =>
  LEVELS[level] <= (LEVELS[config.logLevel] ?? LEVELS.info);

const emit = (level, stream, args) => {
  if (!enabled(level)) return;
  stream(`[${new Date().toISOString()}] ${level.toUpperCase()}`, ...args);
};

/**
 * A deliberately tiny level-aware console wrapper. A take-home does not need a
 * structured logging stack, but it does need tests that are not drowned in
 * output -- hence LOG_LEVEL, which defaults to `silent` under NODE_ENV=test.
 */
export const logger = {
  error: (...args) => emit("error", console.error, args),
  warn: (...args) => emit("warn", console.warn, args),
  info: (...args) => emit("info", console.log, args),
  debug: (...args) => emit("debug", console.log, args),
};
