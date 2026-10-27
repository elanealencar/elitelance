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
}

export const auctionService = new AuctionService();