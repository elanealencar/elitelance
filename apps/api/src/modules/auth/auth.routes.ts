import { Router } from "express";
import { authController } from "./auth.controller";
import { authenticate } from "../../middlewares/auth.middleware";

export const authRoutes = Router();

authRoutes.post(
  "/register",
  (req, res) => authController.register(req, res)
);

authRoutes.post(
  "/login",
  (req, res) => authController.login(req, res)
);

authRoutes.get("/me", authenticate, (_req, res) => {
  res.status(200).json({
    user: res.locals.user,
  });
});