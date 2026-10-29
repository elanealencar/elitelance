
import "dotenv/config";

import { app } from "./app";
import { startAuctionFinalizationJob } from "./jobs/auction-finalization.job";

const PORT = Number(process.env.PORT) || 3333;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 EliteLance API rodando na porta ${PORT}`);

  startAuctionFinalizationJob();
});

server.on("error", (error) => {
  console.error("Erro ao iniciar a API:", error);
  process.exitCode = 1;
});