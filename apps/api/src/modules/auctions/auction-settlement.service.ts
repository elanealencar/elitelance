import { prisma } from "../../lib/prisma";

export class AuctionSettlementService {
  async settle(lotId: string) {
    return prisma.$transaction(
      async (tx) => {
        // Bloqueia o lote para evitar liquidações simultâneas.
        const lockedLots = await tx.$queryRaw<
          Array<{ id: string }>
        >`
          SELECT id
          FROM "AuctionLot"
          WHERE id = ${lotId}
          FOR UPDATE
        `;

        if (lockedLots.length === 0) {
          throw new Error("LOT_NOT_FOUND");
        }

        const lot = await tx.auctionLot.findUniqueOrThrow({
          where: { id: lotId },
        });

        // Nunca liquidar antes do encerramento.
        if (new Date() < lot.endsAt) {
          throw new Error("AUCTION_NOT_ENDED");
        }

        if (
          lot.status === "CANCELED" ||
          lot.status === "DRAFT"
        ) {
          throw new Error("INVALID_AUCTION_STATUS");
        }

        // Evita executar novamente uma liquidação concluída.
        const existingSettlement =
          await tx.auctionSettlement.findUnique({
            where: { lotId },
          });

        if (existingSettlement) {
          return {
            status: "ALREADY_SETTLED",
            settlementId: existingSettlement.id,
          };
        }

        if (lot.status === "FINISHED") {
          return { status: "ALREADY_FINISHED" };
        }

        // Identifica o maior lance registrado.
        const winningBid = await tx.bid.findFirst({
          where: { lotId },
          orderBy: [
            { amountCents: "desc" },
            { createdAt: "asc" },
          ],
        });

        // Encerramento sem vencedor.
        if (!winningBid) {
          await tx.auctionLot.update({
            where: { id: lotId },
            data: { status: "FINISHED" },
          });

          return { status: "FINISHED_WITHOUT_BIDS" };
        }

        // Bloqueia as duas carteiras em ordem determinística.
        const walletUserIds = [
          winningBid.bidderId,
          lot.auctioneerId,
        ].sort();

        for (const userId of walletUserIds) {
          const rows = await tx.$queryRaw<
            Array<{ id: string }>
          >`
            SELECT id
            FROM "Wallet"
            WHERE "userId" = ${userId}
            FOR UPDATE
          `;

          if (rows.length === 0) {
            throw new Error("WALLET_NOT_FOUND");
          }
        }

        const amount = winningBid.amountCents;

        // Debita o vencedor e libera sua reserva.
        const debit = await tx.wallet.updateMany({
          where: {
            userId: winningBid.bidderId,
            balanceCents: { gte: amount },
            reservedCents: { gte: amount },
          },
          data: {
            balanceCents: { decrement: amount },
            reservedCents: { decrement: amount },
          },
        });

        if (debit.count !== 1) {
          throw new Error("INVALID_WINNER_BALANCE");
        }

        // Credita o leiloeiro.
        await tx.wallet.update({
          where: { userId: lot.auctioneerId },
          data: {
            balanceCents: { increment: amount },
          },
        });

        // Registra a liquidação.
        const settlement = await tx.auctionSettlement.create({
          data: {
            lotId,
            winnerId: winningBid.bidderId,
            auctioneerId: lot.auctioneerId,
            amountCents: amount,
          },
        });

        // Marca o lote como definitivamente encerrado.
        await tx.auctionLot.update({
          where: { id: lotId },
          data: { status: "FINISHED" },
        });

        return {
          status: "SETTLED",
          settlementId: settlement.id,
          lotId,
          winnerId: winningBid.bidderId,
          amountCents: amount.toString(),
          settledAt: settlement.settledAt,
        };
      },
      {
        maxWait: 5000,
        timeout: 10000,
      }
    );
  }
}

export const auctionSettlementService =
  new AuctionSettlementService();