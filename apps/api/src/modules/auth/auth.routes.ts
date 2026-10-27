import { Router } from "express";
import { authController } from "./auth.controller";

export const authRoutes = Router();

authRoutes.post(
  "/register",
  (req, res) => authController.register(req, res)
);