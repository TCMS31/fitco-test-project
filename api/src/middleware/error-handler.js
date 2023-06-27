import { ValidationError, UniqueConstraintError } from "sequelize";

import { AppError } from "../errors/app-error.js";
import { logger } from "../lib/logger.js";

const normalise = (error) => {
  if (error instanceof AppError) return error;

  if (error instanceof UniqueConstraintError) {
    return AppError.conflict("A record with those details already exists");
  }

  // Errors raised by body-parser before any handler runs.
  if (error?.type === "entity.parse.failed") {
    return AppError.badRequest("Request body is not valid JSON");
  }

  if (error?.type === "entity.too.large") {
    return new AppError("Request body is too large", {
      status: 413,
      code: "payload_too_large",
    });
  }

  if (error instanceof ValidationError) {
    return AppError.unprocessable(
      "Database validation failed",
      error.errors.map((e) => ({ field: e.path, message: e.message }))
    );
  }

  return new AppError("An unexpected error occurred", { status: 500 });
};

/**
 * The single place an error becomes a response. Previously there was no error
 * middleware at all: any rejected promise reached Express's default handler and
 * returned an HTML stack trace with a 500.
 */
// eslint-disable-next-line no-unused-vars -- Express identifies this by arity.
export const errorHandler = (error, req, res, next) => {
  const appError = normalise(error);

  if (appError.status >= 500) {
    logger.error(`${req.method} ${req.originalUrl}`, error);
  }

  res.status(appError.status).json({
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.details ? { details: appError.details } : {}),
    },
  });
};
