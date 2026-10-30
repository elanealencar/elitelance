"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { formatCurrency } from "@/lib/format";

type BidFormProps = {
  auctionId: string;
  minimumBidCents: string;
  disabled?: boolean;
  isLeading?: boolean;
  onBidSuccess?: () => void;
};

export function BidForm({
  auctionId,
  minimumBidCents,
  disabled = false,
  isLeading = false,
  onBidSuccess,
}: BidFormProps) {
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || loading) return;

    setError("");
    setSuccess("");

    const normalized = amount.trim().replace(",", ".");

    if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
      setError("Informe um valor válido, com até duas casas decimais.");
      return;
    }

    const [integerPart, decimalPart = ""] = normalized.split(".");

    const amountCents =
      BigInt(integerPart) * BigInt(100) +
      BigInt(decimalPart.padEnd(2, "0"));

    if (amountCents < BigInt(minimumBidCents)) {
      setError(
        `O lance mínimo é ${formatCurrency(minimumBidCents)}.`
      );
      return;
    }

    if (amountCents > BigInt(Number.MAX_SAFE_INTEGER)) {
      setError("O valor informado é muito alto.");
      return;
    }
    setLoading(true);

    try {
      const response = await fetch(
        `/api/auctions/${encodeURIComponent(auctionId)}/bids`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amountCents: Number(amountCents),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof result.message === "string"
            ? result.message
            : typeof result.error === "string"
              ? result.error
              : "Não foi possível registrar o lance."
        );
      }

      setSuccess("Lance registrado com sucesso!");
      setAmount("");

      onBidSuccess?.();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro inesperado ao enviar o lance."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label
          htmlFor="bid-amount"
          className="mb-2 block text-sm font-medium"
        >
          Seu lance (R$)
        </label>

        <input
          id="bid-amount"
          type="text"
          inputMode="decimal"
          placeholder={
            isLeading
              ? "Você já possui o maior lance"
              : disabled
                ? "Aguarde, verificando seu lance..."
                : "Ex.: 150,00"
          }
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          disabled={loading || disabled}
          className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-[#c8ff28] disabled:cursor-not-allowed disabled:opacity-50 disabled:select-none"
        />

        <p className="mt-2 text-xs text-[#a8a8b3]">
          Lance mínimo: {formatCurrency(minimumBidCents)}
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="text-sm text-[#c8ff28]">
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || disabled}
        className="w-full cursor-pointer rounded-xl bg-[#c8ff28] px-6 py-3 font-bold text-black transition hover:bg-[#b5e825] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "REGISTRANDO LANCE..."
          : isLeading
            ? "VOCÊ JÁ POSSUI O MAIOR LANCE"
            : disabled
              ? "AGUARDE..."
              : "CONFIRMAR LANCE"}
      </button>
    </form>
  );
}