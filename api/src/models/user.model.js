import { DataTypes } from "sequelize";

import { sequelize } from "../config/database.js";

/** Columns that are safe to return over HTTP. `password` is never among them. */
export const PUBLIC_USER_ATTRIBUTES = Object.freeze([
  "id",
  "firstName",
  "lastName",
  "email",
  "createdAt",
  "updatedAt",
]);

export const User = sequelize.define(
  "User",
  {
    firstName: {
      type: DataTypes.STRING(80),
      allowNull: false,
      validate: { notEmpty: true },
    },
    lastName: {
      type: DataTypes.STRING(80),
      allowNull: false,
      validate: { notEmpty: true },
    },
    email: {
      type: DataTypes.STRING(254),
      allowNull: false,
      // Uniqueness is declared once, via the named index below. Declaring it
      // here as well makes Postgres build two unique indexes on one column.
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
  },
  {
    tableName: "Users",
    // The default scope excludes `password` so that forgetting an explicit
    // `attributes` list can never leak a hash -- the create endpoint used to do
    // exactly that.
    defaultScope: { attributes: PUBLIC_USER_ATTRIBUTES },
    scopes: { withPassword: { attributes: { include: ["password"] } } },
    indexes: [{ unique: true, fields: ["email"], name: "users_email_unique" }],
  }
);
