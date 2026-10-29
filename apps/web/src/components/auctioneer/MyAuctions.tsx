"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { formatCurrency, formatDateBR } from "@/lib/format";
import {
  getMyAuctions,
  type AuctioneerLot,
} from "@/services/auctioneer";

const statusLabels: Record<AuctioneerLot["status"], string> = {
  DRAFT: "Rascunho",
  SCHEDULED: "Agendado",
  ACTIVE: "Em andamento",
  FINISHED: "Encerrado",
  CANCELED: "Cancelado",
};

const statusColors: Record<AuctioneerLot["status"], string> = {
  DRAFT: "text-muted",
  SCHEDULED: "text-secondary",
  ACTIVE: "text-primary",
  FINISHED: "text-white",
  CANCELED: "text-red-400",
};

export function MyAuctions() {
  const [lots, setLots] = useState<AuctioneerLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    let active = true;

    async function loadAuctions() {
      try {
        const data = await getMyAuctions();

        if (active) {
          setLots(data.lots);
          setError("");
        }
      } catch {
        if (active) {
          setError("Não foi possível carregar seus leilões.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadAuctions();
    window.addEventListener("auction-created", loadAuctions);

    return () => {
      active = false;
      window.removeEventListener("auction-created", loadAuctions);
    };
  }, []);

  const filteredLots = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLocaleLowerCase("pt-BR");

    return lots
      .filter((lot) => {
        const matchesSearch = lot.title
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch);

        const matchesStatus =
          statusFilter === "ALL" ||
          lot.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "oldest") {
          return (
            new Date(a.startsAt).getTime() -
            new Date(b.startsAt).getTime()
          );
        }

        if (sortBy === "highest") {
          const priceA = BigInt(
            a.currentPriceCents ?? a.startingPriceCents
          );
          const priceB = BigInt(
            b.currentPriceCents ?? b.startingPriceCents
          );

          return priceA === priceB
            ? 0
            : priceA > priceB
              ? -1
              : 1;
        }

        if (sortBy === "ending") {
          return (
            new Date(a.endsAt).getTime() -
            new Date(b.endsAt).getTime()
          );
        }

        return (
          new Date(b.startsAt).getTime() -
          new Date(a.startsAt).getTime()
        );
      });
  }, [lots, search, statusFilter, sortBy]);


  if (loading) {
    return (
      <p className="mt-10 text-sm text-muted">
        Carregando seus leilões...
      </p>
    );
  }

  if (error) {
    return (
      <p role="alert" className="mt-10 text-sm text-red-400">
        {error}
      </p>
    );
  }

  if (lots.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-border bg-surface p-8">
        <p className="font-semibold">
          Você ainda não criou nenhum leilão.
        </p>
        <p className="mt-2 text-sm text-muted">
          Seus lotes aparecerão aqui quando forem cadastrados.
        </p>
      </div>
    );
  }

  return (
    <section className="mt-12">
      <div className="mb-6 space-y-4 rounded-2xl border border-border bg-surface p-5">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar leilão pelo nome..."
          aria-label="Buscar leilões"
          className="w-full rounded-xl border border-white/15 bg-background px-4 py-3 text-sm text-white outline-none transition focus:border-primary"
        />

        <div className="flex flex-wrap gap-2">
          {[
            { value: "ALL", label: "Todos" },
            { value: "ACTIVE", label: "Ativos" },
            { value: "SCHEDULED", label: "Agendados" },
            { value: "FINISHED", label: "Encerrados" },
            { value: "CANCELED", label: "Cancelados" },
            { value: "DRAFT", label: "Rascunhos" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatusFilter(option.value)}
              aria-pressed={statusFilter === option.value}
              className={`cursor-pointer rounded-full px-4 py-2 text-xs font-semibold transition ${
                statusFilter === option.value
                  ? "bg-primary text-black"
                  : "border border-border bg-background text-muted hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted">
            {filteredLots.length} de {lots.length} leilões
          </p>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            aria-label="Ordenar leilões"
            className="cursor-pointer rounded-xl border border-border bg-background px-4 py-2 text-sm text-white outline-none focus:border-primary"
          >
            <option value="recent">Início mais recente</option>
            <option value="oldest">Início mais antigo</option>
            <option value="highest">Maior valor atual</option>
            <option value="ending">Encerramento mais próximo</option>
          </select>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Meus leilões</h2>

        <span className="text-sm text-muted">
          {filteredLots.length} {filteredLots.length === 1 ? "lote" : "lotes"}
        </span>
      </div>

      {filteredLots.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="font-semibold">
            Nenhum leilão encontrado.
          </p>
          <p className="mt-2 text-sm text-muted">
            Experimente alterar a busca ou os filtros.
          </p>
        </div>
      )}  

      <div className="grid gap-4 md:grid-cols-2">
        {filteredLots.map((lot) => (
          <article
            key={lot.id}
            className="rounded-2xl border border-border bg-surface p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-bold">{lot.title}</h3>

              <span
                className={`shrink-0 text-xs font-semibold ${statusColors[lot.status]}`}
              >
                {statusLabels[lot.status]}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted">Preço atual</p>
                <p className="mt-1 font-bold text-primary">
                  {formatCurrency(
                    lot.currentPriceCents ??
                      lot.startingPriceCents
                  )}
                </p>
              </div>

              <div>
                <p className="text-muted">Lances recebidos</p>
                <p className="mt-1 font-bold">
                  {lot.bidCount}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2 text-xs text-muted">
              <p>Início: {formatDateBR(lot.startsAt)}</p>
              <p>Encerramento: {formatDateBR(lot.endsAt)}</p>
            </div>

            <Link
              href={`/auctions/${lot.id}`}
              className="mt-6 inline-flex cursor-pointer font-semibold text-primary hover:underline"
            >
              Ver leilão →
            </Link>
          </article>
        ))}
        
      </div>
    </section>
  );
}