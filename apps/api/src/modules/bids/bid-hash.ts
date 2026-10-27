import { createHash } from "node:crypto";

export const GENESIS_HASH = "GENESIS";

type BidHashInput = {
  id: string;
  lotId: string;
  bidderId: string;
  amountCents: bigint;
  createdAt: Date;
  previousHash: string;
};

export function generateBidHash(input: BidHashInput): string {
  const payload = JSON.stringify([
    input.id,
    input.lotId,
    input.bidderId,
    input.amountCents.toString(),
    input.createdAt.toISOString(),
    input.previousHash,
  ]);

  return createHash("sha256")
    .update(payload, "utf8")
    .digest("hex");
}
