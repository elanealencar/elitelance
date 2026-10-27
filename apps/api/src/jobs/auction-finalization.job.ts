import { auctionFinalizationService } from "../modules/auctions/auction-finalization.service";

const INTERVAL_MS = 15_000;

export function startAuctionFinalizationJob() {
  console.log(
    "[Auction Finalization] Monitoramento iniciado."
  );

  // Executa imediatamente ao iniciar a API.
  void auctionFinalizationService.finalizeExpiredAuctions();

  // Continua verificando a cada 15 segundos.
  const interval = setInterval(() => {
    void auctionFinalizationService.finalizeExpiredAuctions();
  }, INTERVAL_MS);

  return interval;
}