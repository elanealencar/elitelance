import "dotenv/config";

import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não configurada.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({ adapter });

const DEMO_LOT_ID = "c5b4acaa-8bb3-47cc-bf54-274d32d12345";

async function main() {
  const password = process.env.DEMO_PASSWORD;

  if (!password || password.length < 12) {
    throw new Error(
      "Configure DEMO_PASSWORD com pelo menos 12 caracteres."
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  console.log("Iniciando seed do EliteLance...");

  const auctioneer = await prisma.user.upsert({
    where: {
      email: "auctioneer@elitelance.demo",
    },
    update: {},
    create: {
      name: "Leiloeiro Demo",
      email: "auctioneer@elitelance.demo",
      passwordHash,
      role: "AUCTIONEER",
    },
  });

  const bidder1 = await prisma.user.upsert({
    where: {
      email: "bidder1@elitelance.demo",
    },
    update: {},
    create: {
      name: "Licitante Demo 1",
      email: "bidder1@elitelance.demo",
      passwordHash,
      role: "BIDDER",
    },
  });

  const bidder2 = await prisma.user.upsert({
    where: {
      email: "bidder2@elitelance.demo",
    },
    update: {},
    create: {
      name: "Licitante Demo 2",
      email: "bidder2@elitelance.demo",
      passwordHash,
      role: "BIDDER",
    },
  });

  const wallets = [
    {
      userId: auctioneer.id,
      balanceCents: BigInt(0),
    },
    {
      userId: bidder1.id,
      balanceCents: BigInt(500000),
    },
    {
      userId: bidder2.id,
      balanceCents: BigInt(500000),
    },
  ];

  for (const wallet of wallets) {
    await prisma.wallet.upsert({
      where: {
        userId: wallet.userId,
      },
      update: {},
      create: {
        userId: wallet.userId,
        balanceCents: wallet.balanceCents,
        reservedCents: BigInt(0),
      },
    });
  }

  const existingLot = await prisma.auctionLot.findUnique({
    where: {
      id: DEMO_LOT_ID,
    },
  });

  if (!existingLot) {
    const now = Date.now();

    const startsAt = new Date(now - 5 * 60 * 1000);
    const endsAt = new Date(now + 7 * 24 * 60 * 60 * 1000);

    await prisma.auctionLot.create({
      data: {
        id: DEMO_LOT_ID,
        title: "Smartphone Premium - Leilão Demo",
        description:
          "Lote demonstrativo do EliteLance para avaliação dos fluxos de lances, carteira e arremate.",
        startingPriceCents: BigInt(15000),
        incrementCents: BigInt(1000),
        startsAt,
        endsAt,
        status: "ACTIVE",
        auctioneerId: auctioneer.id,
      },
    });

    console.log("Lote demonstrativo criado.");
  } else {
    console.log("Lote demonstrativo já existe. Preservando dados.");
  }

  console.log("Seed concluído com sucesso.");
  console.log("Usuários de demonstração preparados.");
}

main()
  .catch((error) => {
    console.error("Erro no seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });