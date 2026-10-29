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

}

export const auctionController = new AuctionController();