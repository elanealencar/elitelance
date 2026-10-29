import { prisma } from "../../lib/prisma";
import { catalogService } from "../catalog/catalog.service";
import type { CreateAuctionInput } from "./auction.schema";
import { getAuctionStatus } from "./auction-status";

export class AuctionService {
  async create(data: CreateAuctionInput, auctioneerId: string) {
    const startsAt = new Date(data.startsAt);
    const endsAt = new Date(data.endsAt);

    if (startsAt <= new Date()) {
      throw new Error("START_DATE_MUST_BE_FUTURE");
    }

    const product = await catalogService.getById(data.productId);

    return prisma.auctionLot.create({
      data: {
        title: product.title,
        description: product.description,
        imageUrl: product.thumbnail,
        externalProductId: String(product.id),
        startingPriceCents: BigInt(data.startingPriceCents),
        incrementCents: BigInt(data.incrementCents),
        startsAt,
        endsAt,
        status: "SCHEDULED",
        auctioneerId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        status: true,
        startsAt: true,
        endsAt: true,
        createdAt: true,
      },
    });
  }
  
  async listMine(auctioneerId: string) {
    const lots = await prisma.auctionLot.findMany({
      where: { auctioneerId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        status: true,
        startsAt: true,
        endsAt: true,
        startingPriceCents: true,
        currentPriceCents: true,
        incrementCents: true,
        createdAt: true,
        _count: {
          select: { bids: true },
        },
      },
    });

    return lots.map((lot) => ({
      id: lot.id,
      title: lot.title,
      imageUrl: lot.imageUrl,
      status:
        lot.status === "CANCELED" || lot.status === "DRAFT"
          ? lot.status
          : getAuctionStatus(lot),
      startsAt: lot.startsAt,
      endsAt: lot.endsAt,
      startingPriceCents: lot.startingPriceCents.toString(),
      currentPriceCents:
        lot.currentPriceCents?.toString() ?? null,
      incrementCents: lot.incrementCents.toString(),
      bidCount: lot._count.bids,
    }));
  }
  
  async cancel(lotId: string, auctioneerId: string) {
    return prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id
        FROM "AuctionLot"
        WHERE id = ${lotId}
        FOR UPDATE
      `;

      if (rows.length === 0) {
        throw new Error("AUCTION_NOT_FOUND");
      }

      const lot = await tx.auctionLot.findUnique({
        where: { id: lotId },
        select: {
          id: true,
          auctioneerId: true,
          status: true,
          startsAt: true,
          endsAt: true,
        },
      });

      if (!lot) {
        throw new Error("AUCTION_NOT_FOUND");
      }

      if (lot.auctioneerId !== auctioneerId) {
        throw new Error("AUCTION_FORBIDDEN");
      }

      const status = getAuctionStatus(lot);

      if (status === "FINISHED" || status === "CANCELED") {
        throw new Error("AUCTION_CANNOT_BE_CANCELED");
      }

      const bidCount = await tx.bid.count({
        where: { lotId },
      });

      if (bidCount > 0) {
        throw new Error("AUCTION_HAS_BIDS");
      }

      return tx.auctionLot.update({
        where: { id: lotId },
        data: { status: "CANCELED" },
        select: {
          id: true,
          title: true,
          status: true,
        },
      });
    });
  }

  async listPublic() {
    const lots = await prisma.auctionLot.findMany({
      where: {
        status: {
          in: ["SCHEDULED", "ACTIVE", "FINISHED"],
        },
      },
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        status: true,
        startsAt: true,
        endsAt: true,
        startingPriceCents: true,
        currentPriceCents: true,
        incrementCents: true,
      },
    });

    return lots.map((lot) => ({
      ...lot,
      status: getAuctionStatus(lot),
      startingPriceCents:
        lot.startingPriceCents.toString(),
      currentPriceCents:
        lot.currentPriceCents?.toString() ?? null,
      incrementCents:
        lot.incrementCents.toString(),
    }));
  }

  async getResults(auctioneerId: string) {
    const lots = await prisma.auctionLot.findMany({
      where: {
        auctioneerId,
        status: {
          notIn: ["CANCELED", "DRAFT"],
        },
      },
      orderBy: {
        endsAt: "desc",
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        status: true,
        startsAt: true,
        endsAt: true,
        settlement: {
          select: {
            winnerId: true,
            amountCents: true,
            settledAt: true,
          },
        },
        _count: {
          select: {
            bids: true,
          },
        },
      },
    });

    const winnerIds = [
      ...new Set(
        lots
          .map((lot) => lot.settlement?.winnerId)
          .filter((id): id is string => Boolean(id))
      ),
    ];

    const winners = await prisma.user.findMany({
      where: {
        id: { in: winnerIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const winnerNames = new Map(
      winners.map((winner) => [winner.id, winner.name])
    );

    const now = new Date();

    const finishedLots = lots.filter(
      (lot) => getAuctionStatus(lot, now) === "FINISHED"
    );

    const results = finishedLots.map((lot) => {
      const settlement = lot.settlement;

      return {
        id: lot.id,
        title: lot.title,
        imageUrl: lot.imageUrl,
        endsAt: lot.endsAt,
        bidCount: lot._count.bids,
        winnerName: settlement
          ? winnerNames.get(settlement.winnerId) ?? "Licitante"
          : null,
        amountCents: settlement
          ? settlement.amountCents.toString()
          : null,
        settledAt: settlement?.settledAt ?? null,
        resultStatus: settlement
          ? "SETTLED"
          : lot._count.bids === 0
            ? "WITHOUT_BIDS"
            : "PENDING_SETTLEMENT",
      };
    });

    const settledLots = results.filter(
      (lot) => lot.resultStatus === "SETTLED"
    );

    const totalReceivedCents = settledLots.reduce(
      (total, lot) =>
        total + BigInt(lot.amountCents ?? "0"),
      BigInt(0)
    );

    return {
      summary: {
        totalReceivedCents: totalReceivedCents.toString(),
        settledCount: settledLots.length,
        finishedCount: results.length,
        withoutBidsCount: results.filter(
          (lot) => lot.resultStatus === "WITHOUT_BIDS"
        ).length,
      },
      results,
    };
  }

}

export const auctionService = new AuctionService();