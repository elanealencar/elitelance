import { Router } from "express";
import { auctionController } from "./auction.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/authorize.middleware";

export const auctionRoutes = Router();

auctionRoutes.get(
  "/",
  (req, res) => auctionController.list(req, res)
);

auctionRoutes.post(
  "/",
  authenticate,
  authorize("AUCTIONEER"),
  (req, res) => auctionController.create(req, res)
);