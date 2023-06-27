import express from "express";

import { sequelize } from "../config/database.js";

import { userRouter } from "./user.route.js";

const router = express.Router();

router.get("/health", async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ status: "ok", database: "up" });
  } catch {
    res.status(503).json({ status: "degraded", database: "down" });
  }
});

router.use("/users", userRouter);

export { router as apiRouter };
