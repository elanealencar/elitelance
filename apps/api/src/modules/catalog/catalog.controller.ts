import type { Request, Response } from "express";
import { z } from "zod";
import { catalogService } from "./catalog.service";

const searchSchema = z.object({
  q: z.string().trim().max(100).default(""),
});

export class CatalogController {
  async search(req: Request, res: Response) {
    const parsed = searchSchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        message: "Parâmetros inválidos",
        errors: parsed.error.issues,
      });
      return;
    }

    try {
      const products = await catalogService.search(parsed.data.q);

      res.json({ products });
    } catch (error) {
      console.error("Erro no catálogo:", error);

      res.status(503).json({
        message: "Catálogo externo temporariamente indisponível",
      });
    }
  }
}

export const catalogController = new CatalogController();