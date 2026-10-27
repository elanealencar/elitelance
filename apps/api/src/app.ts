import express from "express";
import cors from "cors";
import { authRoutes } from "./modules/auth/auth.routes";
import { catalogRoutes } from "./modules/catalog/catalog.routes";
import { auctionRoutes } from "./modules/auctions/auction.routes";
import { walletRoutes } from "./modules/wallet/wallet.routes";

export const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
}));

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    application: "EliteLance API",
    timestamp: new Date().toISOString(),
  });
});

app.use("/auth", authRoutes);
app.use("/catalog", catalogRoutes);
app.use("/auctions", auctionRoutes);
app.use("/wallet", walletRoutes);