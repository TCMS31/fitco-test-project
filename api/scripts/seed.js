import { initialiseDatabase } from "../src/models/index.js";
import { seedUsers } from "../src/lib/seed.js";
import { logger } from "../src/lib/logger.js";

const run = async () => {
  await initialiseDatabase({ sync: true });
  await seedUsers();
  process.exit(0);
};

run().catch((error) => {
  logger.error("Seeding failed:", error);
  process.exit(1);
});
