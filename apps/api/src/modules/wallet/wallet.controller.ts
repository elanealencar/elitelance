import type { Request, Response } from "express";
import { depositSchema } from "./wallet.schema";
import { walletService } from "./wallet.service";

export class WalletController {
  async get(_req: Request, res: Response) {
    try {
      const wallet = await walletService.getByUserId(
        res.locals.user.id
      );

      res.json({ wallet });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Erro ao consultar carteira",
      });
    }
  }

  async deposit(req: Request, res: Response) {
    const parsed = depositSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Valor inválido",
        errors: parsed.error.issues,
      });
      return;
    }

    try {
      const wallet = await walletService.deposit(
        res.locals.user.id,
        parsed.data.amountCents
      );

      res.json({
        message: "Depósito fictício realizado",
        wallet,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Erro ao realizar depósito",
      });
    }
  }
}

export const walletController = new WalletController();