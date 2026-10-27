
import type { AuctionStatus } from "../../generated/prisma/client";

type AuctionSchedule = {
  startsAt: Date;
  endsAt: Date;
  status: AuctionStatus;
};

export function getAuctionStatus(
  auction: AuctionSchedule,
  now = new Date()
): AuctionStatus {
  if (
    auction.status === "CANCELED" ||
    auction.status === "FINISHED" ||
    auction.status === "DRAFT"
  ) {
    return auction.status;
  }

  if (now >= auction.endsAt) {
    return "FINISHED";
  }

  if (now >= auction.startsAt) {
    return "ACTIVE";
  }

  return "SCHEDULED";
}
