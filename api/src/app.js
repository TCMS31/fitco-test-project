import cors from "cors";
import express from "express";

import { config } from "./config/env.js";
import { apiRouter } from "./routes/index.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";

/**
 * Builds the Express application without binding a port, so the test suite can
 * drive it in-process with supertest and `server.js` stays a thin entrypoint.
 */
export const createApp = () => {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));
  app.use(cors({ origin: config.clientUrl, credentials: true }));

  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
