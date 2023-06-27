import { z } from "zod";

const name = (label) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(1, `${label} must not be empty`)
    .max(80, `${label} must be at most 80 characters`);

const email = z
  .string({ required_error: "email is required" })
  .trim()
  .toLowerCase()
  .email("email must be a valid email address")
  .max(254);

const password = z
  .string({ required_error: "password is required" })
  .min(8, "password must be at least 8 characters")
  .max(72, "password must be at most 72 characters");

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive("id must be a positive integer"),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const createUserSchema = z.object({
  firstName: name("firstName"),
  lastName: name("lastName"),
  email,
  password,
});

export const updateUserSchema = z
  .object({
    firstName: name("firstName").optional(),
    lastName: name("lastName").optional(),
    email: email.optional(),
    password: password.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });
