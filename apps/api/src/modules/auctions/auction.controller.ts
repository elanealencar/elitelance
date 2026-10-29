import type { Request, Response } from "express";
import { createAuctionSchema } from "./auction.schema";
import { auctionService } from "./auction.service";

export class AuctionController {
  async create(req: Request, res: Response) {
    const parsed = createAuctionSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Dados inválidos",
        errors: parsed.error.issues,
      });
      return;
    }

    try {
      const lot = await auctionService.create(
        parsed.data,
        res.locals.user.id
      );

      res.status(201).json({ lot });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "START_DATE_MUST_BE_FUTURE"
      ) {
        res.status(400).json({
          message: "A data inicial deve estar no futuro",
        });
        return;
      }

      if (
        error instanceof Error &&
        error.message === "PRODUCT_NOT_FOUND"
      ) {
        res.status(404).json({
          message: "Produto não encontrado",
        });
        return;
      }

      console.error("Erro ao criar lote:", error);

      res.status(503).json({
        message: "Não foi possível criar o lote",
      });
    }
  }

  async list(_req: Request, res: Response) {
    const lots = await auctionService.listPublic();

    res.status(200).json({ lots });
  }

  async listMine(_req: Request, res: Response) {
    try {
      const lots = await auctionService.listMine(
        res.locals.user.id
      );

      res.status(200).json({ lots });
    } catch (error) {
      console.error("Erro ao listar leilões do usuário:", error);

      res.status(500).json({
        message: "Não foi possível carregar seus leilões",
      });
    }
  }
  
  async cancel(req: Request, res: Response) {
    const lotId = req.params.id;

    if (typeof lotId !== "string" || !lotId.trim()) {
      res.status(400).json({
        message: "Identificador do leilão inválido.",
      });
      return;
    }

    try {
      const lot = await auctionService.cancel(
        lotId,
        res.locals.user.id
      );

      res.status(200).json({
        message: "Leilão cancelado com sucesso.",
        lot,
      });
    } catch (error) {
      if (error instanceof Error) {
        const errors: Record<
          string,
          { status: number; message: string }
        > = {
          AUCTION_NOT_FOUND: {
            status: 404,
            message: "Leilão não encontrado.",
          },
          AUCTION_FORBIDDEN: {
            status: 403,
            message: "Você não pode cancelar este leilão.",
          },
          AUCTION_CANNOT_BE_CANCELED: {
            status: 409,
            message: "Este leilão não pode mais ser cancelado.",
          },
          AUCTION_HAS_BIDS: {
            status: 409,
            message: "Leilões com lances não podem ser cancelados.",
          },
        };

        const knownError = errors[error.message];

        if (knownError) {
          res.status(knownError.status).json({
            message: knownError.message,
          });
          return;
        }
      }

      console.error("Erro ao cancelar leilão:", error);

      res.status(500).json({
        message: "Não foi possível cancelar o leilão.",
      });
    }
  }

  async results(_req: Request, res: Response) {
    try {
      const data = await auctionService.getResults(
        res.locals.user.id
      );

      res.status(200).json(data);
    } catch (error) {
      console.error("Erro ao consultar resultados:", error);

      res.status(500).json({
        message: "Não foi possível carregar os resultados.",
      });
    }
  }
}

export const auctionController = new AuctionController();