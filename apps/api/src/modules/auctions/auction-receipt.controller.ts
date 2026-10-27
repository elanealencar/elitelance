import type { Request, Response } from "express";
import { auctionReceiptService } from "./auction-receipt.service";

export class AuctionReceiptController {
  async show(req: Request, res: Response) {
    try {
      const lotId = String(req.params.id);

      // Utiliza o usuário autenticado pelo middleware JWT.
      const userId = res.locals.user?.id;

      if (!userId) {
        return res.status(401).json({
          message: "Usuário não autenticado.",
        });
      }

      const receipt =
        await auctionReceiptService.getReceipt(
          lotId,
          userId
        );

      return res.status(200).json(receipt);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "RECEIPT_NOT_FOUND") {
          return res.status(404).json({
            message: "Recibo não encontrado.",
          });
        }

        if (error.message === "FORBIDDEN_RECEIPT") {
          return res.status(403).json({
            message: "Você não tem acesso a este recibo.",
          });
        }
      }

      console.error(error);

      return res.status(500).json({
        message: "Erro ao consultar recibo.",
      });
    }
  }
}

export const auctionReceiptController =
  new AuctionReceiptController();