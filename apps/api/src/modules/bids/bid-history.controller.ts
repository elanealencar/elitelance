import type { Request, Response } from "express";
import { bidHistoryService } from "./bid-history.service";

export class BidHistoryController {
  async index(req: Request, res: Response) {
    try {
      const lotId = String(req.params.id);

      const history = await bidHistoryService.getHistory(lotId);

      return res.status(200).json(history);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "LOT_NOT_FOUND"
      ) {
        return res.status(404).json({
          message: "Leilão não encontrado.",
        });
      }

      console.error(error);

      return res.status(500).json({
        message: "Erro ao consultar histórico de lances.",
      });
    }
  }
}

export const bidHistoryController =
  new BidHistoryController();