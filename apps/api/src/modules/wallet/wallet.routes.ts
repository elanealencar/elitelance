import { Router } from "express";
import { walletController } from "./wallet.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/authorize.middleware";

export const walletRoutes = Router();

walletRoutes.use(authenticate);
walletRoutes.use(authorize("BIDDER"));

walletRoutes.get("/", (req, res) =>
  walletController.get(req, res)
);

walletRoutes.post("/deposit", (req, res) =>
  walletController.deposit(req, res)
);