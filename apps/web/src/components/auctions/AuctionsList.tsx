import Link from "next/link";
import { getAuctions } from "@/services/auctions";
import { formatCurrency, formatDateBR } from "@/lib/format";
import { AuctionCountdown } from "./AuctionCountdown";
import { unstable_rethrow } from "next/navigation";

const statusLabels: Record<string, string> = {
  ACTIVE: "Em andamento",
  SCHEDULED: "Em breve",
  FINISHED: "Encerrado",
  CANCELED: "Cancelado",
  DRAFT: "Rascunho",
};

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


  if (auctions.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-10 text-center">
        Nenhum leilão disponível no momento.
      </div>
    );
  }

  const statusPriority: Record<string, number> = {
    ACTIVE: 0,
    SCHEDULED: 1,
    FINISHED: 2,
    CANCELED: 3,
    DRAFT: 4,
  };

  const sortedAuctions = [...auctions].sort((a, b) => {
    const priorityA = statusPriority[a.status] ?? 99;
    const priorityB = statusPriority[b.status] ?? 99;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    return new Date(a.endsAt).getTime() -
      new Date(b.endsAt).getTime();
  });

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {sortedAuctions.map((auction) => (
        <article
          key={auction.id}
          className="group overflow-hidden rounded-2xl border border-border bg-surface transition hover:border-secondary/60"
        >
          <div className="relative flex h-56 items-center justify-center overflow-hidden bg-[#20222b]">
            {auction.imageUrl ? (
              <img
                src={auction.imageUrl}
                alt={auction.title}
                className="h-full w-full object-contain p-5"
              />
            ) : (
              <span className="text-5xl text-white/20">◇</span>
            )}

            <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/75 px-3 py-1.5 text-xs font-semibold">
              {statusLabels[auction.status] ?? auction.status}
            </span>
          </div>

          <div className="p-6">
            <h3 className="line-clamp-2 min-h-14 text-xl font-semibold">
              {auction.title}
            </h3>

            <p className="mt-5 text-xs uppercase tracking-wider text-muted">
              {auction.currentPriceCents
                ? "Lance atual"
                : "Lance inicial"}
            </p>

            <p className="mt-2 text-3xl font-bold text-primary">
              {formatCurrency(
                auction.currentPriceCents ??
                  auction.startingPriceCents
              )}
            </p>
            
          <div className="mt-6 border-t border-border pt-5">
            {auction.status === "ACTIVE" && (
              <div className="mb-4">
                <p className="mb-2 text-xs uppercase tracking-wider text-muted">
                  Tempo restante
                </p>
                <AuctionCountdown endsAt={auction.endsAt} />
              </div>
            )}

            <p className="text-xs text-muted">
              Encerramento
            </p>

            <p className="mt-1 text-sm font-medium">
              {formatDateBR(auction.endsAt)} · Brasília
            </p>
          </div>


            <Link
              href={`/auctions/${auction.id}`}
              className="mt-6 block rounded-full border border-primary py-3 text-center text-sm font-bold text-primary transition hover:bg-primary hover:text-black"
            >
              VER DETALHES ↗
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}