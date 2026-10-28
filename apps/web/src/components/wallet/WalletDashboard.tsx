"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";

import {
  depositWallet,
  getWallet,
  type Wallet,
} from "@/services/wallet";
import { formatCurrency } from "@/lib/format";

type WalletDashboardProps = {
  userName: string;
};

export function WalletDashboard({
  userName,
}: WalletDashboardProps) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [depositing, setDepositing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadWallet = useCallback(async () => {
    try {
      const data = await getWallet();
      setWallet(data);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao consultar carteira."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  async function handleDeposit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const normalized = amount.trim().replace(",", ".");

    if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
      setError("Informe um valor válido.");
      return;
    }

    const [integerPart, decimalPart = ""] = normalized.split(".");

    const cents =
      BigInt(integerPart) * BigInt(100) +
      BigInt(decimalPart.padEnd(2, "0"));

    if (cents <= BigInt(0) || cents > BigInt(Number.MAX_SAFE_INTEGER)) {
      setError("Informe um valor positivo dentro do limite permitido.");
      return;
    }

    setDepositing(true);

    try {
      await depositWallet(Number(cents));
      setAmount("");
      setSuccess("Depósito fictício realizado com sucesso!");
      await loadWallet();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível realizar o depósito."
      );
    } finally {
      setDepositing(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Área do licitante
        </p>

        <h1 className="text-3xl font-bold md:text-4xl">
          Olá, {userName}!
        </h1>

        <p className="mt-3 text-muted">
          Gerencie seu saldo e participe dos leilões.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-sm text-muted">Saldo total</p>
          <p className="mt-3 text-3xl font-bold">
            {loading || !wallet
              ? "—"
              : formatCurrency(wallet.balanceCents)}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-sm text-muted">Saldo comprometido</p>
          <p className="mt-3 text-3xl font-bold text-secondary">
            {loading || !wallet
              ? "—"
              : formatCurrency(wallet.reservedCents)}
          </p>
        </div>

        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
          <p className="text-sm text-muted">Saldo disponível</p>
          <p className="mt-3 text-3xl font-bold text-primary">
            {loading || !wallet
              ? "—"
              : formatCurrency(wallet.availableCents)}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-xl font-bold">Adicionar saldo</h2>

          <p className="mt-2 text-sm text-muted">
            Faça um depósito fictício para participar dos leilões.
          </p>

          <form onSubmit={handleDeposit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="deposit-amount"
                className="mb-2 block text-sm font-medium"
              >
                Valor do depósito (R$)
              </label>

              <input
                id="deposit-amount"
                type="text"
                inputMode="decimal"
                placeholder="Ex.: 100,00"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                disabled={depositing}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-400">
                {error}
              </p>
            )}

            {success && (
              <p role="status" className="text-sm text-primary">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={depositing}
              className="w-full cursor-pointer rounded-full bg-primary px-6 py-4 text-sm font-bold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {depositing ? "PROCESSANDO..." : "ADICIONAR SALDO"}
            </button>
          </form>
        </section>

        <section className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6">
          <div>
            <h2 className="text-xl font-bold">Participar dos leilões</h2>

            <p className="mt-3 text-sm leading-relaxed text-muted">
              Explore os lotes disponíveis e utilize seu saldo
              para realizar lances. O valor do maior lance
              ficará reservado enquanto você estiver liderando.
            </p>
          </div>

          <Link
            href="/#leiloes"
            className="mt-8 inline-flex cursor-pointer items-center justify-center rounded-full border border-primary px-6 py-4 text-sm font-bold text-primary transition hover:bg-primary/10"
          >
            EXPLORAR LEILÕES
          </Link>
        </section>
      </div>
    </div>
  );
}