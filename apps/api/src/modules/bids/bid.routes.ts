import { Router } from "express";
import { bidController } from "./bid.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/authorize.middleware";

export const bidRoutes = Router();

bidRoutes.post(
  "/:id/bids",
  authenticate,
  authorize("BIDDER"),
  (req, res) => bidController.create(req, res)
);
