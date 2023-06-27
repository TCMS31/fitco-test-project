import { User, PUBLIC_USER_ATTRIBUTES } from "../models/index.js";

/**
 * Data-access layer. Sequelize lives behind this module: nothing above it
 * imports a model, so swapping the ORM touches one file per aggregate.
 */
export const userRepository = {
  findAndCountAll: ({ limit, offset }) =>
    User.findAndCountAll({
      attributes: PUBLIC_USER_ATTRIBUTES,
      order: [["id", "ASC"]],
      limit,
      offset,
    }),

  findById: (id) => User.findByPk(id, { attributes: PUBLIC_USER_ATTRIBUTES }),

  findByEmail: (email) => User.findOne({ where: { email } }),

  create: (data) => User.create(data),

  /** Returns the number of rows affected, so callers can distinguish 404. */
  updateById: async (id, data) => {
    const [affected] = await User.update(data, { where: { id } });
    return affected;
  },

  deleteById: (id) => User.destroy({ where: { id } }),
};
