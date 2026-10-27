import { Router } from "express";
import { catalogController } from "./catalog.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/authorize.middleware";

export const catalogRoutes = Router();

catalogRoutes.get(
  "/search",
  authenticate,
  authorize("AUCTIONEER"),
  (req, res) => catalogController.search(req, res)
);