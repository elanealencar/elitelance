"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { formatCurrency, formatDateBR } from "@/lib/format";

type AuctionResult = {
  id: string;
  title: string;
  imageUrl: string | null;
  endsAt: string;
  bidCount: number;
  winnerName: string | null;
  amountCents: string | null;
  settledAt: string | null;
  resultStatus:
    | "SETTLED"
    | "WITHOUT_BIDS"
    | "PENDING_SETTLEMENT";
};

type AuctionResultsResponse = {
  summary: {
    totalReceivedCents: string;
    settledCount: number;
    finishedCount: number;
    withoutBidsCount: number;
  };
  results: AuctionResult[];
};

const resultLabels: Record<AuctionResult["resultStatus"], string> = {
  SETTLED: "Liquidado",
  WITHOUT_BIDS: "Sem vencedor",
  PENDING_SETTLEMENT: "Aguardando liquidação",
};

export function AuctionResults() {
  const [data, setData] = useState<AuctionResultsResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadResults = useCallback(async () => {
    try {
      const response = await fetch("/api/auctioneer/results", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ?? "Não foi possível carregar os resultados."
        );
      }

      setData(result);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar resultados."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadResults();

    const interval = window.setInterval(() => {
      void loadResults();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [loadResults]);

  if (loading) {
    return (
      <p className="mt-10 text-sm text-muted">
        Carregando resultados...
      </p>
    );
  }

  if (error && !data) {
    return (
      <p role="alert" className="mt-10 text-sm text-red-400">
        {error}
      </p>
    );
  }

  if (!data) return null;

  return (
    <section className="mt-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">
          Resultados dos leilões
        </h2>

        <button
          type="button"
          onClick={() => void loadResults()}
          className="cursor-pointer text-sm font-semibold text-primary hover:underline"
        >
          Atualizar resultados
        </button>
      </div>

      {error && (
        <p role="alert" className="mb-4 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">Total recebido</p>
          <p className="mt-2 text-2xl font-bold text-primary">
            {formatCurrency(data.summary.totalReceivedCents)}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">Lotes arrematados</p>
          <p className="mt-2 text-2xl font-bold">
            {data.summary.settledCount}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">Leilões encerrados</p>
          <p className="mt-2 text-2xl font-bold">
            {data.summary.finishedCount}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">Sem lances</p>
          <p className="mt-2 text-2xl font-bold">
            {data.summary.withoutBidsCount}
          </p>
        </div>
      </div>

      {data.results.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-8">
          <p className="font-semibold">
            Nenhum leilão encerrado ainda.
          </p>
          <p className="mt-2 text-sm text-muted">
            Os resultados aparecerão aqui após o encerramento dos lotes.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {data.results.map((lot) => (
            <article
              key={lot.id}
              className="rounded-2xl border border-border bg-surface p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">
                    {lot.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted">
                    Encerrado em {formatDateBR(lot.endsAt)}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    lot.resultStatus === "SETTLED"
                      ? "bg-primary/10 text-primary"
                      : lot.resultStatus === "WITHOUT_BIDS"
                        ? "bg-white/10 text-muted"
                        : "bg-yellow-500/10 text-yellow-400"
                  }`}
                >
                  {resultLabels[lot.resultStatus]}
                </span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted">Vencedor</p>
                  <p className="mt-1 font-semibold">
                    {lot.winnerName ?? "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted">
                    Valor arrematado
                  </p>
                  <p className="mt-1 font-semibold text-primary">
                    {lot.amountCents
                      ? formatCurrency(lot.amountCents)
                      : "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted">
                    Lances recebidos
                  </p>
                  <p className="mt-1 font-semibold">
                    {lot.bidCount}
                  </p>
                </div>
              </div>

              <Link
                href={`/auctions/${lot.id}`}
                className="mt-5 inline-flex cursor-pointer text-sm font-semibold text-primary hover:underline"
              >
                Ver detalhes do leilão →
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
