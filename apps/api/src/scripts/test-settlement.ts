import "dotenv/config";
import { prisma } from "../lib/prisma";
import { auctionSettlementService } from "../modules/auctions/auction-settlement.service";

async function main() {
  const lotId = process.argv[2];

  if (!lotId) {
    throw new Error("Informe o ID do lote.");
  }

  const result = await auctionSettlementService.settle(lotId);

  console.log("Resultado da liquidação:");
  console.log(result);
}

main()
  .catch((error) => {
    console.error("Erro:", error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());