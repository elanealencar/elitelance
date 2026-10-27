import "dotenv/config";
import { app } from "./app";
import { startAuctionFinalizationJob } from "./jobs/auction-finalization.job";

const PORT = Number(process.env.PORT) || 3333;

app.listen(PORT, () => {
  console.log(`🚀 EliteLance API rodando na porta ${PORT}`);
});

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);

  startAuctionFinalizationJob();
});