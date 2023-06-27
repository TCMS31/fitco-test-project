import express from "express";
import asyncHandler from "express-async-handler";

import * as userController from "../controllers/user.controller.js";
import { validate } from "../middleware/validate.js";
import {
  createUserSchema,
  idParamSchema,
  listUsersQuerySchema,
  updateUserSchema,
} from "../validation/user.schema.js";

const router = express.Router();

router.get(
  "/",
  validate(listUsersQuerySchema, "query"),
  asyncHandler(userController.listUsers)
);

router.post(
  "/",
  validate(createUserSchema),
  asyncHandler(userController.createUser)
);

router.get(
  "/:id",
  validate(idParamSchema, "params"),
  asyncHandler(userController.getUserById)
);

router.put(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateUserSchema),
  asyncHandler(userController.updateUser)
);

router.delete(
  "/:id",
  validate(idParamSchema, "params"),
  asyncHandler(userController.deleteUser)
);

export { router as userRouter };
