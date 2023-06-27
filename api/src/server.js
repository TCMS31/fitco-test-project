import { createApp } from "./app.js";
import { config } from "./config/env.js";
import { initialiseDatabase } from "./models/index.js";
import { logger } from "./lib/logger.js";
import { seedUsers } from "./lib/seed.js";

const start = async () => {
  await initialiseDatabase({ sync: config.db.autoSync });

  if (config.seedOnBoot) {
    await seedUsers();
  }

  const server = createApp().listen(config.port, () => {
    logger.info(`API listening on http://localhost:${config.port}`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down`);
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

start().catch((error) => {
  logger.error("Failed to start API:", error);
  process.exit(1);
});
