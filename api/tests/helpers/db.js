import moment from "moment";

import { sequelize } from "../../src/config/database.js";
import { User } from "../../src/models/index.js";
import { passwordHasher } from "../../src/lib/password/index.js";

// pg-mem converts Sequelize's timestamp literals through moment, which logs a
// noisy RFC2822 deprecation notice for every row inserted. The values round-trip
// correctly; only the warning is unwanted, and this is test-only setup.
moment.suppressDeprecationWarnings = true;

export const syncDatabase = () => sequelize.sync();

/**
 * Truncating between tests rather than re-syncing keeps each case isolated and
 * keeps ids predictable, without paying for a DDL round trip every time.
 */
export const resetDatabase = () =>
  User.destroy({ where: {}, truncate: true, restartIdentity: true });

export const closeDatabase = () => sequelize.close();

export const makeUser = async (overrides = {}) => {
  const suffix = Math.random().toString(36).slice(2, 8);

  return User.create({
    firstName: "Test",
    lastName: "User",
    email: `test.${suffix}@fitco.example`,
    password: await passwordHasher.hash("Passw0rd!"),
    ...overrides,
  });
};

export const makeUsers = async (count, overrides = () => ({})) => {
  const created = [];

  for (let i = 0; i < count; i += 1) {
    created.push(await makeUser(overrides(i)));
  }

  return created;
};
