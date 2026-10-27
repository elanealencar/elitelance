import { Router } from "express";
import { walletController } from "./wallet.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/authorize.middleware";

export const walletRoutes = Router();

// Todas as rotas exigem autenticação.
walletRoutes.use(authenticate);

// Licitantes e leiloeiros podem consultar a própria carteira.
walletRoutes.get(
  "/",
  (req, res) => walletController.get(req, res)
);

// Apenas licitantes podem realizar depósitos fictícios.
walletRoutes.post(
  "/deposit",
  authorize("BIDDER"),
  (req, res) => walletController.deposit(req, res)
);
