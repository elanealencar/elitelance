import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

const TWO_MINUTES_MS = 2 * 60 * 1000;

export class BidService {
  async create(
    lotId: string,
    bidderId: string,
    amountCents: number
  ) {
    return prisma.$transaction(
      async (tx) => {
        // Serializa as ofertas concorrentes para este lote.
        const rows = await tx.$queryRaw<
          Array<{ id: string }>
        >`
          SELECT id
          FROM "AuctionLot"
          WHERE id = ${lotId}
          FOR UPDATE
        `;

        if (rows.length === 0) {
          throw new Error("LOT_NOT_FOUND");
        }

        const lot = await tx.auctionLot.findUniqueOrThrow({
          where: { id: lotId },
        });

        const now = new Date();

        if (
          lot.status === "CANCELED" ||
          lot.status === "FINISHED" ||
          lot.status === "DRAFT" ||
          now < lot.startsAt ||
          now >= lot.endsAt
        ) {
          throw new Error("AUCTION_NOT_ACTIVE");
        }

        if (lot.auctioneerId === bidderId) {
          throw new Error("OWN_AUCTION");
        }

        // Localiza o lance que lidera atualmente.
        const leadingBid = await tx.bid.findFirst({
          where: { lotId },
          orderBy: [
            { amountCents: "desc" },
            { createdAt: "asc" },
          ],
        });

        if (leadingBid?.bidderId === bidderId) {
          throw new Error("ALREADY_LEADING");
        }

        const amount = BigInt(amountCents);

        const minimumBid = leadingBid
          ? leadingBid.amountCents + lot.incrementCents
          : lot.startingPriceCents;

        if (amount < minimumBid) {
          throw new Error("BID_TOO_LOW");
        }

        // Bloqueia as carteiras em ordem determinística.
        // Isso reduz o risco de deadlocks entre leilões.
        const walletUserIds = [
          bidderId,
          ...(leadingBid ? [leadingBid.bidderId] : []),
        ].sort();

        for (const userId of walletUserIds) {
          const walletRows = await tx.$queryRaw<
            Array<{ id: string }>
          >`
            SELECT id
            FROM "Wallet"
            WHERE "userId" = ${userId}
            FOR UPDATE
          `;

          if (walletRows.length === 0) {
            throw new Error("WALLET_NOT_FOUND");
          }
        }

        const bidderWallet = await tx.wallet.findUniqueOrThrow({
          where: { userId: bidderId },
        });

        const available =
          bidderWallet.balanceCents -
          bidderWallet.reservedCents;

        if (available < amount) {
          throw new Error("INSUFFICIENT_BALANCE");
        }

        // Libera a reserva do antigo líder.
        if (leadingBid) {
          const released = await tx.wallet.updateMany({
            where: {
              userId: leadingBid.bidderId,
              reservedCents: {
                gte: leadingBid.amountCents,
              },
            },
            data: {
              reservedCents: {
                decrement: leadingBid.amountCents,
              },
            },
          });

          if (released.count !== 1) {
            throw new Error("INVALID_WALLET_RESERVATION");
          }
        }

        // Reserva o valor do novo líder.
        await tx.wallet.update({
          where: { userId: bidderId },
          data: {
            reservedCents: {
              increment: amount,
            },
          },
        });

        const bid = await tx.bid.create({
          data: {
            lotId,
            bidderId,
            amountCents: amount,
          },
        });

        // Anti-sniping: estende o encerramento em 2 minutos
        // quando o lance chega nos últimos 2 minutos.
        const remainingMs =
          lot.endsAt.getTime() - now.getTime();

        const endsAt =
          remainingMs <= TWO_MINUTES_MS
            ? new Date(
                lot.endsAt.getTime() + TWO_MINUTES_MS
              )
            : lot.endsAt;

        await tx.auctionLot.update({
          where: { id: lotId },
          data: {
            currentPriceCents: amount,
            endsAt,
            status: "ACTIVE",
          },
        });

        return {
          id: bid.id,
          lotId: bid.lotId,
          bidderId: bid.bidderId,
          amountCents: bid.amountCents.toString(),
          createdAt: bid.createdAt,
          endsAt,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        maxWait: 5000,
        timeout: 10000,
      }
    );
  }
}

export const bidService = new BidService();