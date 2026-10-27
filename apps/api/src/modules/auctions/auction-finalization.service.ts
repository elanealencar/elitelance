import { prisma } from "../../lib/prisma";
import { auctionSettlementService } from "./auction-settlement.service";

export class AuctionFinalizationService {
  private isRunning = false;

  async finalizeExpiredAuctions() {
    // Impede execuções sobrepostas no mesmo processo.
    if (this.isRunning) return;

    this.isRunning = true;

    try {
      const expiredLots = await prisma.auctionLot.findMany({
        where: {
          status: {
            in: ["SCHEDULED", "ACTIVE"],
          },
          endsAt: {
            lte: new Date(),
          },
        },
        select: {
          id: true,
        },
        take: 50,
        orderBy: {
          endsAt: "asc",
        },
      });

      for (const lot of expiredLots) {
        try {
          const result =
            await auctionSettlementService.settle(lot.id);

          console.log(
            `[Auction Finalization] ${lot.id}: ${result.status}`
          );
        } catch (error) {
          console.error(
            `[Auction Finalization] Erro no lote ${lot.id}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error(
        "[Auction Finalization] Erro na busca:",
        error
      );
    } finally {
      this.isRunning = false;
    }
  }
}

export const auctionFinalizationService =
  new AuctionFinalizationService();