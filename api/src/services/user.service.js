import { config } from "../config/env.js";
import { AppError } from "../errors/app-error.js";
import { passwordHasher } from "../lib/password/index.js";
import { userRepository } from "../repositories/user.repository.js";

const toPublicUser = (record) => {
  const { id, firstName, lastName, email, createdAt, updatedAt } = record.get({
    plain: true,
  });

  return { id, firstName, lastName, email, createdAt, updatedAt };
};

const clampLimit = (limit) =>
  Math.min(limit ?? config.pagination.defaultLimit, config.pagination.maxLimit);

/**
 * Business logic layer. Password hashing, uniqueness rules and "does it exist"
 * decisions live here rather than in the controller, which is now purely an
 * HTTP adapter.
 */
export const userService = {
  async listUsers({ page = 1, limit } = {}) {
    const effectiveLimit = clampLimit(limit);
    const offset = (page - 1) * effectiveLimit;
    const { rows, count } = await userRepository.findAndCountAll({
      limit: effectiveLimit,
      offset,
    });

    return {
      items: rows.map(toPublicUser),
      pagination: {
        page,
        limit: effectiveLimit,
        total: count,
        totalPages: Math.max(1, Math.ceil(count / effectiveLimit)),
      },
    };
  },

  async getUserById(id) {
    const user = await userRepository.findById(id);

    if (!user) {
      throw AppError.notFound(`User ${id} not found`);
    }

    return toPublicUser(user);
  },

  async createUser({ firstName, lastName, email, password }) {
    const existing = await userRepository.findByEmail(email);

    if (existing) {
      throw AppError.conflict("A user with that email already exists", {
        email,
      });
    }

    const created = await userRepository.create({
      firstName,
      lastName,
      email,
      password: await passwordHasher.hash(password),
    });

    return toPublicUser(created);
  },

  async updateUser(id, changes) {
    const existing = await userRepository.findById(id);

    if (!existing) {
      throw AppError.notFound(`User ${id} not found`);
    }

    if (changes.email && changes.email !== existing.email) {
      const clash = await userRepository.findByEmail(changes.email);

      if (clash) {
        throw AppError.conflict("A user with that email already exists", {
          email: changes.email,
        });
      }
    }

    const patch = { ...changes };

    if (patch.password) {
      patch.password = await passwordHasher.hash(patch.password);
    }

    await userRepository.updateById(id, patch);

    return this.getUserById(id);
  },

  async deleteUser(id) {
    const deleted = await userRepository.deleteById(id);

    if (deleted === 0) {
      throw AppError.notFound(`User ${id} not found`);
    }
  },
};
