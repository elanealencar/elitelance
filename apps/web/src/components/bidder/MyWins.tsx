"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { formatCurrency, formatDateBR } from "@/lib/format";

type MyWin = {
  id: string;
  lotId: string;
  title: string;
  imageUrl: string | null;
  endsAt: string;
  settledAt: string;
  amountCents: string;
  status: "SETTLED";
};

type MyWinsResponse = {
  summary: {
    winsCount: number;
    totalSpentCents: string;
  };
  wins: MyWin[];
};

export function MyWins() {
  const [data, setData] = useState<MyWinsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadWins = useCallback(async () => {
    try {
      const response = await fetch("/api/bidder/my-wins", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ?? "Não foi possível carregar seus arremates."
        );
      }

      setData(result);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar seus arremates."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWins();
  }, [loadWins]);

  if (loading) {
    return (
      <p className="mt-10 text-sm text-muted">
        Carregando seus arremates...
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
          Meus arremates
        </h2>

        <button
          type="button"
          onClick={() => void loadWins()}
          className="cursor-pointer text-sm font-semibold text-primary hover:underline"
        >
          Atualizar
        </button>
      </div>

      {error && (
        <p role="alert" className="mb-4 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">
            Leilões vencidos
          </p>
          <p className="mt-2 text-2xl font-bold">
            {data.summary.winsCount}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">
            Total arrematado
          </p>
          <p className="mt-2 text-2xl font-bold text-primary">
            {formatCurrency(data.summary.totalSpentCents)}
          </p>
        </div>
      </div>

      {data.wins.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-8">
          <p className="font-semibold">
            Você ainda não possui arremates.
          </p>
          <p className="mt-2 text-sm text-muted">
            Quando vencer um leilão e a liquidação for concluída,
            ele aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {data.wins.map((win) => (
            <article
              key={win.id}
              className="rounded-2xl border border-border bg-surface p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold">{win.title}</h3>
                <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Arrematado
                </span>
              </div>

              <p className="mt-4 text-2xl font-bold text-primary">
                {formatCurrency(win.amountCents)}
              </p>

              <p className="mt-3 text-xs text-muted">
                Liquidado em {formatDateBR(win.settledAt)}
              </p>
              
              <div className="mt-5 flex flex-wrap items-center gap-5">
                <Link
                  href={`/auctions/${win.lotId}`}
                  className="inline-flex cursor-pointer text-sm font-semibold text-primary hover:underline"
                >
                  Ver leilão →
                </Link>

                <Link
                  href={`/receipts/${win.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex cursor-pointer text-sm font-semibold text-secondary hover:underline"
                >
                  Ver comprovante ↗
                </Link>
              </div>

            </article>
          ))}
        </div>
      )}
    </section>
  );
}