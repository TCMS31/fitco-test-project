import { sequelize } from "../config/database.js";
import { logger } from "../lib/logger.js";

export { User, PUBLIC_USER_ATTRIBUTES } from "./user.model.js";

/**
 * Schema creation is an explicit, awaited bootstrap step. It used to be a bare
 * `sequelize.sync()` at module scope in the model file, which meant the server
 * could start accepting requests before the table existed.
 */
export const initialiseDatabase = async ({ sync = true } = {}) => {
  await sequelize.authenticate();
  logger.info("Database connection established");

  if (sync) {
    await sequelize.sync();
    logger.info("Database schema synchronised");
  }
};
