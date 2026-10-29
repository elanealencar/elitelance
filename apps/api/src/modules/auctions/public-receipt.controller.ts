import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma";

export class PublicReceiptController {
  async show(req: Request, res: Response) {
    const receiptId = req.params.receiptId;

    if (typeof receiptId !== "string" || !receiptId.trim()) {
      res.status(400).json({
        message: "Identificador do comprovante inválido.",
      });
      return;
    }

    try {
      const settlement = await prisma.auctionSettlement.findUnique({
        where: {
          id: receiptId,
        },
        select: {
          id: true,
          lotId: true,
          amountCents: true,
          settledAt: true,
          lot: {
            select: {
              title: true,
              imageUrl: true,
              endsAt: true,
              status: true,
            },
          },
        },
      });

      if (!settlement || settlement.lot.status !== "FINISHED") {
        res.status(404).json({
          message: "Comprovante não encontrado.",
        });
        return;
      }

      res.status(200).json({
        receipt: {
          id: settlement.id,
          lotId: settlement.lotId,
          title: settlement.lot.title,
          imageUrl: settlement.lot.imageUrl,
          amountCents: settlement.amountCents.toString(),
          endsAt: settlement.lot.endsAt,
          settledAt: settlement.settledAt,
          status: "VERIFIED",
        },
      });
    } catch (error) {
      console.error("Erro ao consultar comprovante:", error);

      res.status(500).json({
        message: "Não foi possível consultar o comprovante.",
      });
    }
  }
}

export const publicReceiptController =
  new PublicReceiptController();
