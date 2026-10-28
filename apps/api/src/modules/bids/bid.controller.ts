import type { Request, Response } from "express";
import { createBidSchema } from "./bid.schema";
import { bidService } from "./bid.service";

const errorResponses: Record<string, {
  status: number;
  message: string;
}> = {
  LOT_NOT_FOUND: {
    status: 404,
    message: "Lote não encontrado",
  },
  AUCTION_NOT_ACTIVE: {
    status: 409,
    message: "Este leilão não está ativo",
  },
  OWN_AUCTION: {
    status: 403,
    message: "Você não pode dar lances no próprio leilão",
  },
  ALREADY_LEADING: {
    status: 409,
    message: "Você já possui o maior lance",
  },
  BID_TOO_LOW: {
    status: 409,
    message: "O lance não atende ao valor mínimo",
  },
  INSUFFICIENT_BALANCE: {
    status: 409,
    message: "Saldo disponível insuficiente",
  },
  WALLET_NOT_FOUND: {
    status: 404,
    message: "Carteira não encontrada",
  },
  INVALID_WALLET_RESERVATION: {
    status: 409,
    message: "Inconsistência na reserva da carteira",
  },
};

export class BidController {
  async getMyBidStatus(req: Request, res: Response) {
    const { id: lotId } = req.params;

    if (typeof lotId !== "string" || !lotId) {
      res.status(400).json({
        message: "Identificador do lote inválido",
      });
      return;
    }

    try {
      const status = await bidService.getMyBidStatus(
        lotId,
        res.locals.user.id
      );

      res.status(200).json(status);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "LOT_NOT_FOUND"
      ) {
        res.status(404).json({
          message: "Lote não encontrado",
        });
        return;
      }

      console.error("Erro ao consultar liderança:", error);

      res.status(500).json({
        message: "Erro interno ao consultar liderança",
      });
    }
  }

  async create(req: Request, res: Response) {
    const parsed = createBidSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Dados inválidos",
        errors: parsed.error.issues,
      });
      return;
    }

    const { id: lotId } = req.params;

    if (typeof lotId !== "string" || !lotId) {
      res.status(400).json({
        message: "Identificador do lote inválido",
      });
      return;
    }

    try {
      const bid = await bidService.create(
        lotId,
        res.locals.user.id,
        parsed.data.amountCents
      );

      res.status(201).json({
        message: "Lance registrado com sucesso",
        bid,
      });
    } catch (error) {
      if (error instanceof Error) {
        const response = errorResponses[error.message];

        if (response) {
          res.status(response.status).json({
            message: response.message,
          });
          return;
        }
      }

      console.error("Erro ao registrar lance:", error);

      res.status(500).json({
        message: "Erro interno ao registrar lance",
      });
    }
  }
}

export const bidController = new BidController();