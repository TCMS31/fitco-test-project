/**
 * The single error type the HTTP layer understands. Services throw these; the
 * error middleware is the only place that turns one into a response body, so
 * status codes and payload shape stay consistent across every route.
 */
export class AppError extends Error {
  constructor(
    message,
    { status = 500, code = "internal_error", details } = {}
  ) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, details) {
    return new AppError(message, { status: 400, code: "bad_request", details });
  }

  static notFound(message = "Resource not found") {
    return new AppError(message, { status: 404, code: "not_found" });
  }

  static conflict(message, details) {
    return new AppError(message, { status: 409, code: "conflict", details });
  }

  static unprocessable(message, details) {
    return new AppError(message, {
      status: 422,
      code: "unprocessable_entity",
      details,
    });
  }
}
