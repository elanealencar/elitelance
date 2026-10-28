
import { prisma } from "../lib/prisma";
import { generateBidHash } from "../modules/bids/bid-hash";

async function main() {
  const lotId = process.argv[2];

  if (!lotId) {
    throw new Error("Informe o ID do lote.");
  }

  const bid = await prisma.bid.findFirst({
    where: {
      lotId,
      hash: { not: null },
      sequence: { not: null },
    },
    orderBy: { sequence: "asc" },
  });

  if (!bid || !bid.hash || !bid.previousHash) {
    throw new Error("Nenhum lance auditável encontrado.");
  }

  const originalHash = generateBidHash({
    id: bid.id,
    lotId: bid.lotId,
    bidderId: bid.bidderId,
    amountCents: bid.amountCents,
    createdAt: bid.createdAt,
    previousHash: bid.previousHash,
  });

  const tamperedHash = generateBidHash({
    id: bid.id,
    lotId: bid.lotId,
    bidderId: bid.bidderId,
    amountCents: bid.amountCents + 1000n,
    createdAt: bid.createdAt,
    previousHash: bid.previousHash,
  });

  console.log({
    originalValid: originalHash === bid.hash,
    tamperedValid: tamperedHash === bid.hash,
    tamperingDetected: tamperedHash !== bid.hash,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
