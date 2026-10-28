import Image from "next/image";
import Link from "next/link";

import type { Auction } from "@/services/auctions";
import { formatCurrency, formatDateBR } from "@/lib/format";
import { AuctionCountdown } from "./AuctionCountdown";
import { AuctionBidPanel } from "./AuctionBidPanel";

type AuctionDetailsProps = {
  auction: Auction;
  userRole: "BIDDER" | "AUCTIONEER" | null;
};

const statusLabels: Record<Auction["status"], string> = {
  DRAFT: "Rascunho",
  SCHEDULED: "Em breve",
  ACTIVE: "Leilão ativo",
  FINISHED: "Encerrado",
  CANCELED: "Cancelado",
};

export function AuctionDetails({
  auction,
  userRole,
}: AuctionDetailsProps) {
  const currentPrice =
    auction.currentPriceCents ??
    auction.startingPriceCents;

  const minimumBid =
    BigInt(currentPrice) +
    (auction.currentPriceCents
      ? BigInt(auction.incrementCents)
      : BigInt(0));

  const isActive = auction.status === "ACTIVE";

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <Link
        href="/#leiloes"
        className="mb-10 inline-flex items-center gap-2 text-sm text-muted transition hover:text-primary"
      >
        ← Voltar aos leilões
      </Link>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Imagem do produto */}
        <div className="relative flex min-h-95 items-center justify-center overflow-hidden rounded-3xl border border-border bg-surface">
          {auction.imageUrl ? (
            <Image
              src={auction.imageUrl}
              alt={auction.title}
              fill
              unoptimized
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain p-8"
            />
          ) : (
            <span className="text-sm text-muted">
              Imagem indisponível
            </span>
          )}
        </div>

        {/* Informações do leilão */}
        <div>
          <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary">
            {statusLabels[auction.status]}
          </span>

          <h1 className="mt-6 text-3xl font-bold tracking-tight md:text-5xl">
            {auction.title}
          </h1>

          {auction.description && (
            <p className="mt-5 leading-relaxed text-muted">
              {auction.description}
            </p>
          )}

          <div className="mt-10 rounded-2xl border border-border bg-surface p-6">
            <p className="text-sm text-muted">
              {auction.currentPriceCents
                ? "Lance atual"
                : "Lance inicial"}
            </p>

            <p className="mt-2 text-4xl font-bold text-primary">
              {formatCurrency(currentPrice)}
            </p>

            <div className="mt-8 border-t border-border pt-6">
              <p className="text-sm text-muted">
                {auction.status === "SCHEDULED"
                  ? "Início do leilão"
                  : "Encerramento"}
              </p>

              <p className="mt-2 text-lg font-semibold">
                {formatDateBR(
                  auction.status === "SCHEDULED"
                    ? auction.startsAt
                    : auction.endsAt
                )}
              </p>

              {(isActive || auction.status === "SCHEDULED") && (
                <div className="mt-4 text-2xl font-bold text-secondary">
                  <AuctionCountdown
                    endsAt={
                      auction.status === "SCHEDULED"
                        ? auction.startsAt
                        : auction.endsAt
                    }
                  />
                </div>
              )}
            </div>

            {isActive && (
              <div className="mt-8">
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs text-muted">
                    Próximo lance mínimo
                  </p>

                  <p className="mt-1 text-xl font-semibold">
                    {formatCurrency(minimumBid.toString())}
                  </p>
                </div>

                {userRole === "BIDDER" ? (
                  <AuctionBidPanel
                    auctionId={auction.id}
                    minimumBidCents={minimumBid.toString()}
                  />
                ) : userRole === "AUCTIONEER" ? (
                  <div className="mt-5 rounded-xl border border-border bg-background p-4">
                    <p className="text-center text-sm text-muted">
                      Leiloeiros não podem participar dos lances.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5">
                    <Link
                      href={`/login?next=${encodeURIComponent(
                        `/auctions/${auction.id}`
                      )}`}
                      className="flex w-full cursor-pointer items-center justify-center rounded-full bg-primary px-6 py-4 text-sm font-bold text-black transition hover:opacity-90"
                    >
                      ENTRAR PARA DAR UM LANCE
                    </Link>

                    <p className="mt-3 text-center text-xs text-muted">
                      Faça login como licitante para participar.
                    </p>
                  </div>
                )}
              </div>
            )}

            {auction.status === "SCHEDULED" && (
              <p className="mt-6 text-sm text-muted">
                Este leilão ainda não começou.
              </p>
            )}

            {auction.status === "FINISHED" && (
              <p className="mt-6 text-sm text-muted">
                Este leilão foi encerrado.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}