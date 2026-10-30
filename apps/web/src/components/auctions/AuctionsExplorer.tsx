"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatCurrency, formatDateBR } from "@/lib/format";
import { AuctionCountdown } from "./AuctionCountdown";
import type { Auction } from "@/services/auctions";

type AuctionsExplorerProps = {
  auctions: Auction[];
};

type StatusFilter = "ALL" | "ACTIVE" | "SCHEDULED" | "FINISHED";

type SortOption = "default" | "price-asc" | "price-desc" | "ending-soon";

const statusLabels: Record<string, string> = {
  ACTIVE: "Em andamento",
  SCHEDULED: "Em breve",
  FINISHED: "Encerrado",
};

const statusPriority: Record<string, number> = {
  ACTIVE: 0,
  SCHEDULED: 1,
  FINISHED: 2,
};

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "ACTIVE", label: "Em andamento" },
  { value: "SCHEDULED", label: "Em breve" },
  { value: "FINISHED", label: "Encerrados" },
];

export function AuctionsExplorer({ auctions }: AuctionsExplorerProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [sort, setSort] = useState<SortOption>("default");

  const filteredAuctions = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");

    return auctions
      .filter((auction) => {
        // Lotes cancelados e rascunhos não aparecem na vitrine.
        if (!["ACTIVE", "SCHEDULED", "FINISHED"].includes(auction.status)) {
          return false;
        }

        const matchesSearch = auction.title
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch);

        const matchesStatus =
          status === "ALL" || auction.status === status;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const priceA = Number(
          a.currentPriceCents ?? a.startingPriceCents
        );

        const priceB = Number(
          b.currentPriceCents ?? b.startingPriceCents
        );

        if (sort === "price-asc") return priceA - priceB;
        if (sort === "price-desc") return priceB - priceA;

        if (sort === "ending-soon") {
          return new Date(a.endsAt).getTime() -
            new Date(b.endsAt).getTime();
        }

        const priorityA = statusPriority[a.status] ?? 99;
        const priorityB = statusPriority[b.status] ?? 99;

        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        return new Date(a.endsAt).getTime() -
          new Date(b.endsAt).getTime();
      });
  }, [auctions, search, status, sort]);

  function clearFilters() {
    setSearch("");
    setStatus("ALL");
    setSort("default");
  }

  return (
    <div>
      {/* Barra de busca e filtros */}
      <div className="mb-8 rounded-2xl border border-border bg-surface p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar leilão pelo nome..."
              aria-label="Buscar leilão pelo nome"
              className="w-full rounded-xl border border-border bg-background py-3 pl-12 pr-4 text-sm text-foreground outline-none transition focus:border-primary"
            />
          </div>

          <select
            value={sort}
            onChange={(event) =>
              setSort(event.target.value as SortOption)
            }
            aria-label="Ordenar leilões"
            className="cursor-pointer rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary lg:min-w-56"
          >
            <option value="default">Ordenação padrão</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
            <option value="ending-soon">Encerramento mais próximo</option>
          </select>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatus(option.value)}
              aria-pressed={status === option.value}
              className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition ${
                status === option.value
                  ? "border-primary bg-primary text-black"
                  : "border-border text-muted hover:border-primary hover:text-primary"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-sm text-muted" aria-live="polite">
            {filteredAuctions.length}{" "}
            {filteredAuctions.length === 1
              ? "leilão encontrado"
              : "leilões encontrados"}
          </p>

          {(search || status !== "ALL" || sort !== "default") && (
            <button
              type="button"
              onClick={clearFilters}
              className="cursor-pointer text-sm font-medium text-primary transition hover:opacity-75"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Resultado da busca */}
      {filteredAuctions.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-10 text-center">
          <p className="text-lg font-semibold">
            Nenhum leilão encontrado
          </p>
          <p className="mt-2 text-sm text-muted">
            Tente outro nome ou altere os filtros selecionados.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-5 cursor-pointer rounded-full border border-primary px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary hover:text-black"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAuctions.map((auction) => (
            <article
              key={auction.id}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition hover:border-secondary/60"
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

              <div className="flex flex-1 flex-col p-6">
                <h3 className="line-clamp-2 min-h-14 text-xl font-semibold">
                  {auction.title}
                </h3>

                <p className="mt-5 text-xs uppercase tracking-wider text-muted">
                  {auction.currentPriceCents != null
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

                  <p className="text-xs text-muted">Encerramento</p>

                  <p className="mt-1 text-sm font-medium">
                    {formatDateBR(auction.endsAt)} · Brasília
                  </p>
                </div>

                <div className="mt-auto pt-6">
                  <Link
                    href={`/auctions/${auction.id}`}
                    className="block rounded-full border border-primary py-3 text-center text-sm font-bold text-primary transition hover:bg-primary hover:text-black"
                  >
                    VER DETALHES ↗
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
