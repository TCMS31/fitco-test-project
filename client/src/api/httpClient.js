import axios from "axios";

/**
 * Resolving the base URL in one place means a missing REACT_APP_API_URL fails
 * with a readable message instead of firing every request at the literal
 * string "undefined/api", which is what the original client did.
 */
export const resolveBaseUrl = (env = process.env) => {
  const raw = env.REACT_APP_API_URL;

  if (!raw || !raw.trim()) {
    return "/api";
  }

  return `${raw.trim().replace(/\/+$/, "")}/api`;
};

export const httpClient = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

/**
 * The API reports failures as { success: false, error: { message, details } }.
 * Collapsing that -- plus network and timeout failures -- into one readable
 * string here keeps every component free of error-shape knowledge.
 */
export const toErrorMessage = (error) => {
  const payload = error?.response?.data?.error;

  if (payload?.details?.length) {
    return payload.details.map((d) => `${d.field}: ${d.message}`).join(", ");
  }

  if (payload?.message) {
    return payload.message;
  }

  if (error?.code === "ECONNABORTED") {
    return "The request timed out. Is the API running?";
  }

  if (error?.request && !error?.response) {
    return "Could not reach the API. Check that it is running and that CLIENT_URL allows this origin.";
  }

  return error?.message ?? "Something went wrong";
};
