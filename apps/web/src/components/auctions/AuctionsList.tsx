import { unstable_rethrow } from "next/navigation";
import { getAuctions } from "@/services/auctions";
import { AuctionsExplorer } from "./AuctionsExplorer";

export async function AuctionsList() {
  let auctions;

  try {
    auctions = await getAuctions();
  } catch (error) {
    unstable_rethrow(error);

    console.error("Erro ao carregar leilões:", error);

    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-muted">
        Não foi possível carregar os leilões.
        Verifique se a API está em execução.
      </div>
    );
  }

  return <AuctionsExplorer auctions={auctions} />;
}