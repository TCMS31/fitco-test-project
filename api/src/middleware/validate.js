import { AppError } from "../errors/app-error.js";

const formatIssues = (error) =>
  error.issues.map((issue) => ({
    field: issue.path.join(".") || "(root)",
    message: issue.message,
  }));

/**
 * Turns a Zod schema into request middleware. Parsed (and coerced) output
 * replaces the raw input, so handlers downstream always see validated,
 * correctly typed values -- `req.params.id` is a number, not a string.
 */
export const validate =
  (schema, source = "body") =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return next(
        AppError.badRequest(
          "Request validation failed",
          formatIssues(result.error)
        )
      );
    }

    if (source === "query") {
      // Express 4 exposes req.query via a getter on some versions; assigning to a
      // dedicated field keeps this portable.
      req.validatedQuery = result.data;
    } else {
      req[source] = result.data;
    }

    return next();
  };
