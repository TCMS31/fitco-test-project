import { config } from "../../config/env.js";

import { createBcryptHasher } from "./bcrypt-hasher.js";

/**
 * Extensibility seam.
 *
 * Password hashing is the one dependency in this service most likely to be
 * swapped (argon2id is the current OWASP first choice, and a managed identity
 * provider would replace it outright). Everything above this module depends on
 * the { name, hash, verify } contract rather than on bcryptjs, so adding a new
 * algorithm means registering a factory here and setting PASSWORD_HASHER --
 * no service, controller or test needs to change.
 */
const registry = new Map();

export const registerPasswordHasher = (name, factory) => {
  registry.set(name, factory);
};

registerPasswordHasher("bcrypt", createBcryptHasher);

export const createPasswordHasher = (
  name = config.password.hasher,
  options = { rounds: config.password.bcryptRounds }
) => {
  const factory = registry.get(name);

  if (!factory) {
    throw new Error(
      `Unknown password hasher '${name}'. Registered: ${[...registry.keys()].join(", ")}`
    );
  }

  return factory(options);
};

export const passwordHasher = createPasswordHasher();
