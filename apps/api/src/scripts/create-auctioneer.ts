import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";

async function main() {
  const email = process.env.AUCTIONEER_EMAIL;
  const password = process.env.AUCTIONEER_PASSWORD;

  if (!email || !password || password.length < 8) {
    throw new Error("Configure credenciais válidas do leiloeiro.");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new Error("Este e-mail já está cadastrado.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name: "Leiloeiro EliteLance",
      email: email.toLowerCase(),
      passwordHash,
      role: "AUCTIONEER",
      wallet: {
        create: {
          balanceCents: 0n,
          reservedCents: 0n,
        },
      },
    },
  });

  console.log(`Leiloeiro criado: ${user.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());