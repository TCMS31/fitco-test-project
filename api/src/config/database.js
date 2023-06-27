import { Sequelize } from "sequelize";

import { logger } from "../lib/logger.js";

import { config } from "./env.js";

const common = {
  logging: config.logLevel === "debug" ? (msg) => logger.debug(msg) : false,
  pool: { max: config.db.poolMax, min: config.db.poolMin, idle: 10_000 },
};

/**
 * The `memory` dialect swaps pg's driver for pg-mem, an in-process
 * implementation of the Postgres wire protocol and query engine. Tests
 * therefore exercise the same SQL that production does -- unique constraints,
 * LIMIT/OFFSET and affected-row counts all behave like Postgres -- without
 * needing a database server or a native build in CI.
 */
const buildSequelize = async () => {
  if (config.db.dialect === "memory") {
    // pg-mem is a devDependency on purpose: it is only reachable through the
    // `memory` dialect, which production never selects, so it is not shipped.
    // eslint-disable-next-line import/no-extraneous-dependencies
    const { newDb } = await import("pg-mem");

    return new Sequelize("postgres://test:test@localhost:5432/test", {
      dialect: "postgres",
      dialectModule: newDb().adapters.createPg(),
      ...common,
    });
  }

  return new Sequelize(config.db.url, { dialect: "postgres", ...common });
};

export const sequelize = await buildSequelize();
