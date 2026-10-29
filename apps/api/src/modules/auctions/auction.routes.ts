import { Router } from "express";
import { auctionController } from "./auction.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/authorize.middleware";
import { auctionReceiptController } from "./auction-receipt.controller";
import { bidHistoryController } from "../bids/bid-history.controller";
import { publicReceiptController } from "./public-receipt.controller";

export const auctionRoutes = Router();

auctionRoutes.get(
  "/",
  (req, res) => auctionController.list(req, res)
);

auctionRoutes.get(
  "/mine",
  authenticate,
  authorize("AUCTIONEER"),
  (req, res) => auctionController.listMine(req, res)
);

auctionRoutes.post(
  "/",
  authenticate,
  authorize("AUCTIONEER"),
  (req, res) => auctionController.create(req, res)
);

auctionRoutes.get(
  "/results",
  authenticate,
  authorize("AUCTIONEER"),
  (req, res) => auctionController.results(req, res)
);

auctionRoutes.get(
  "/my-wins",
  authenticate,
  authorize("BIDDER"),
  (req, res) => auctionController.myWins(req, res)
);

auctionRoutes.get(
  "/receipts/:receiptId",
  (req, res) => publicReceiptController.show(req, res)
);

auctionRoutes.get(
  "/:id/receipt",
  authenticate,
  (req, res) => auctionReceiptController.show(req, res)
);

auctionRoutes.get(
  "/:id/bids",
  (req, res) => bidHistoryController.index(req, res)
);

auctionRoutes.patch(
  "/:id/cancel",
  authenticate,
  authorize("AUCTIONEER"),
  (req, res) => auctionController.cancel(req, res)
);