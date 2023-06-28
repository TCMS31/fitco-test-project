import { resolveBaseUrl, toErrorMessage } from "../api/httpClient";

describe("resolveBaseUrl", () => {
  it("appends /api to a configured origin", () => {
    expect(resolveBaseUrl({ REACT_APP_API_URL: "http://localhost:8700" })).toBe(
      "http://localhost:8700/api"
    );
  });

  it("strips a trailing slash rather than producing a double slash", () => {
    expect(
      resolveBaseUrl({ REACT_APP_API_URL: "http://localhost:8700/" })
    ).toBe("http://localhost:8700/api");
  });

  // Regression: the original built `${process.env.REACT_APP_API_URL}/api`,
  // which became the literal string "undefined/api" with no .env present.
  it("falls back to a relative /api instead of 'undefined/api'", () => {
    expect(resolveBaseUrl({})).toBe("/api");
    expect(resolveBaseUrl({ REACT_APP_API_URL: "   " })).toBe("/api");
    expect(resolveBaseUrl({})).not.toContain("undefined");
  });
});

describe("toErrorMessage", () => {
  it("flattens field-level validation details", () => {
    const message = toErrorMessage({
      response: {
        data: {
          error: {
            message: "Request validation failed",
            details: [{ field: "email", message: "email must be valid" }],
          },
        },
      },
    });

    expect(message).toBe("email: email must be valid");
  });

  it("uses the API message when there are no details", () => {
    expect(
      toErrorMessage({ response: { data: { error: { message: "Nope" } } } })
    ).toBe("Nope");
  });

  it("explains a timeout", () => {
    expect(toErrorMessage({ code: "ECONNABORTED" })).toMatch(/timed out/i);
  });

  it("explains an unreachable API", () => {
    expect(toErrorMessage({ request: {} })).toMatch(/Could not reach the API/);
  });
});
