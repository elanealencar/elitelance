import { prisma } from "../lib/prisma";

async function main() {
  const usersCount = await prisma.user.count();

  console.log("Conexão com PostgreSQL estabelecida!");
  console.log(`Usuários cadastrados: ${usersCount}`);
}

main()
  .catch((error) => {
    console.error("Erro ao conectar ao banco:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
