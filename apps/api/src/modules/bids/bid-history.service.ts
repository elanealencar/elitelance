import { prisma } from "../../lib/prisma";
import { generateBidHash, GENESIS_HASH } from "./bid-hash";

export class BidHistoryService {
  async getHistory(lotId: string) {
    const lot = await prisma.auctionLot.findUnique({
      where: { id: lotId },
      select: {
        id: true,
        title: true,
      },
    });

    if (!lot) {
      throw new Error("LOT_NOT_FOUND");
    }

    const bids = await prisma.bid.findMany({
      where: { lotId },
      orderBy: [
        { sequence: "asc" },
        { createdAt: "asc" },
        { id: "asc" },
      ],
      select: {
        id: true,
        lotId: true,
        bidderId: true,
        amountCents: true,
        createdAt: true,
        sequence: true,
        previousHash: true,
        hash: true,
      },
    });

    
    let expectedPreviousHash = GENESIS_HASH;
    let expectedSequence = 1;

    let validCount = 0;
    let unhashedCount = 0;
    let invalidCount = 0;

    const history = bids.map((bid) => {
      if (
        !bid.hash ||
        !bid.previousHash ||
        bid.sequence === null
      ) {
        unhashedCount++;

        return {
          id: bid.id,
          sequence: bid.sequence,
          amountCents: bid.amountCents.toString(),
          createdAt: bid.createdAt,
          hash: bid.hash,
          previousHash: bid.previousHash,
          integrity: "UNVERIFIED",
        };
      }

      const calculatedHash = generateBidHash({
        id: bid.id,
        lotId: bid.lotId,
        bidderId: bid.bidderId,
        amountCents: bid.amountCents,
        createdAt: bid.createdAt,
        previousHash: bid.previousHash,
      });

      const isValid =
        calculatedHash === bid.hash &&
        bid.previousHash === expectedPreviousHash &&
        bid.sequence === expectedSequence;

      if (isValid) {
        validCount++;
      } else {
        invalidCount++;
      }

      expectedPreviousHash = bid.hash;
      expectedSequence = bid.sequence + 1;

      return {
        id: bid.id,
        sequence: bid.sequence,
        amountCents: bid.amountCents.toString(),
        createdAt: bid.createdAt,
        hash: bid.hash,
        previousHash: bid.previousHash,
        integrity: isValid ? "VALID" : "INVALID",
      };
    });


    return {
      lot: {
        id: lot.id,
        title: lot.title,
      },
      audit: {
        totalBids: bids.length,
        validCount,
        invalidCount,
        unhashedCount,
        integrity:
          invalidCount > 0
            ? "INVALID"
            : unhashedCount > 0
              ? "PARTIALLY_VERIFIED"
              : "VALID",
      },
      bids: history,
    };
  }
}

export const bidHistoryService =
  new BidHistoryService();