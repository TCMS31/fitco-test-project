import dotenv from "dotenv";

dotenv.config();

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const nodeEnv = process.env.NODE_ENV ?? "development";
const dialect = process.env.DB_DIALECT ?? "postgres";

if (dialect === "postgres" && !process.env.DB_URL) {
  throw new Error(
    "DB_URL is required when DB_DIALECT is 'postgres'. Copy .env.sample to .env and fill it in."
  );
}

if (!["postgres", "memory"].includes(dialect)) {
  throw new Error(
    `Unsupported DB_DIALECT '${dialect}'. Use 'postgres' or 'memory'.`
  );
}

/**
 * Single source of truth for configuration. Nothing else in the codebase reads
 * `process.env` directly, so the full configuration surface is visible here and
 * a missing value fails fast at boot rather than as an undefined at request time.
 */
export const config = Object.freeze({
  nodeEnv,
  isTest: nodeEnv === "test",
  port: toInt(process.env.PORT, 8700),
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:3000",
  logLevel: process.env.LOG_LEVEL ?? (nodeEnv === "test" ? "silent" : "info"),
  // Populates a throwaway database with demo rows at boot. Never for production.
  seedOnBoot: process.env.SEED_ON_BOOT === "true",
  db: Object.freeze({
    dialect,
    url: process.env.DB_URL ?? null,
    poolMax: toInt(process.env.DB_POOL_MAX, 10),
    poolMin: toInt(process.env.DB_POOL_MIN, 0),
    autoSync: (process.env.DB_AUTO_SYNC ?? "true") === "true",
  }),
  password: Object.freeze({
    hasher: process.env.PASSWORD_HASHER ?? "bcrypt",
    bcryptRounds: toInt(process.env.BCRYPT_ROUNDS, 10),
  }),
  pagination: Object.freeze({
    defaultLimit: toInt(process.env.PAGE_DEFAULT_LIMIT, 25),
    maxLimit: toInt(process.env.PAGE_MAX_LIMIT, 100),
  }),
});
