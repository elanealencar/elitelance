
import { prisma } from "../../lib/prisma";

export class AuctionReceiptService {
  async getReceipt(lotId: string, userId: string) {
    const settlement =
      await prisma.auctionSettlement.findUnique({
        where: { lotId },
        include: {
          lot: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              auctioneerId: true,
            },
          },
        },
      });

    if (!settlement) {
      throw new Error("RECEIPT_NOT_FOUND");
    }

    // Apenas o vencedor ou o leiloeiro podem consultar.
    const isWinner = settlement.winnerId === userId;
    const isAuctioneer =
      settlement.auctioneerId === userId;

    if (!isWinner && !isAuctioneer) {
      throw new Error("FORBIDDEN_RECEIPT");
    }

    const users = await prisma.user.findMany({
      where: {
        id: {
          in: [
            settlement.winnerId,
            settlement.auctioneerId,
          ],
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const winner = users.find(
      (user) => user.id === settlement.winnerId
    );

    const auctioneer = users.find(
      (user) => user.id === settlement.auctioneerId
    );

    return {
      receiptId: settlement.id,
      lotId: settlement.lotId,
      product: {
        title: settlement.lot.title,
        imageUrl: settlement.lot.imageUrl,
      },
      winner: {
        id: settlement.winnerId,
        name: winner?.name ?? "Usuário",
      },
      auctioneer: {
        id: settlement.auctioneerId,
        name: auctioneer?.name ?? "Leiloeiro",
      },
      amountCents: settlement.amountCents.toString(),
      settledAt: settlement.settledAt,
      status: "SETTLED",
    };
  }
}

export const auctionReceiptService =
  new AuctionReceiptService();
