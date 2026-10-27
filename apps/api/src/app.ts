import express from "express";
import cors from "cors";
import { authRoutes } from "./modules/auth/auth.routes";

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
