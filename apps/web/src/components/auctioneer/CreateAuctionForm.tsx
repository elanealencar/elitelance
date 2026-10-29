"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CatalogProduct = {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
};

type CreateAuctionFormProps = {
  onCreated?: () => void;
};

function parseCurrencyToCents(value: string): number | null {
  const normalized = value.trim().replace(",", ".");

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const [integerPart, decimalPart = ""] = normalized.split(".");

  const cents =
    BigInt(integerPart) * BigInt(100) +
    BigInt(decimalPart.padEnd(2, "0"));

  if (cents <= BigInt(0) || cents > BigInt(Number.MAX_SAFE_INTEGER)) {
    return null;
  }

  return Number(cents);
}

export function CreateAuctionForm({
  onCreated,
}: CreateAuctionFormProps) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [selectedProduct, setSelectedProduct] =
    useState<CatalogProduct | null>(null);

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [startingPrice, setStartingPrice] = useState("");
  const [increment, setIncrement] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const query = search.trim();

    if (!query || selectedProduct) {
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      setSearchError("");

      try {
        const response = await fetch(
          `/api/catalog/search?q=${encodeURIComponent(query)}`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ?? "Erro ao pesquisar produtos."
          );
        }

        setProducts(data.products ?? []);
      } catch (err) {
        if (controller.signal.aborted) return;

        setSearchError(
          err instanceof Error
            ? err.message
            : "Erro ao pesquisar produtos."
        );
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false);
        }
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, selectedProduct]);

  function selectProduct(product: CatalogProduct) {
    setSelectedProduct(product);
    setSearch(product.title);
    setProducts([]);
    setSearchError("");
  }

  function changeProduct() {
    setSelectedProduct(null);
    setSearch("");
    setProducts([]);
    setSearchError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedProduct) {
      setError("Selecione um produto do catálogo.");
      return;
    }

    const startingPriceCents =
      parseCurrencyToCents(startingPrice);
    const incrementCents = parseCurrencyToCents(increment);

    if (!startingPriceCents || !incrementCents) {
      setError("Informe valores positivos e válidos.");
      return;
    }

    if (!startsAt || !endsAt) {
      setError("Informe as datas de início e encerramento.");
      return;
    }

    const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      setError("Informe datas válidas.");
      return;
    }

    if (startDate <= new Date()) {
      setError("A data de início deve estar no futuro.");
      return;
    }

    if (endDate <= startDate) {
      setError("O encerramento deve ser posterior ao início.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/auctioneer/auctions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          startingPriceCents,
          incrementCents,
          startsAt: startDate.toISOString(),
          endsAt: endDate.toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ?? "Não foi possível criar o leilão."
        );
      }

      setSuccess("Leilão criado com sucesso!");
      window.dispatchEvent(new Event("auction-created"));

      setSelectedProduct(null);
      setSearch("");
      setProducts([]);
      setStartingPrice("");
      setIncrement("");
      setStartsAt("");
      setEndsAt("");

      onCreated?.();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro inesperado ao criar o leilão."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Criar novo leilão</h2>
        <p className="mt-2 text-sm text-muted">
          Escolha um produto e configure as regras do lote.
        </p>
      </div>

      <div className="space-y-3">
        <label
          htmlFor="catalog-search"
          className="block text-sm font-semibold"
        >
          Produto do catálogo
        </label>

        {selectedProduct ? (
          <div className="flex items-center gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
            {/* Usamos img porque o catálogo retorna URLs externas dinâmicas. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedProduct.thumbnail}
              alt={selectedProduct.title}
              className="h-20 w-20 rounded-lg bg-white/5 object-contain"
            />

            <div className="min-w-0 flex-1">
              <p className="font-bold">{selectedProduct.title}</p>
              <p className="mt-1 line-clamp-2 text-xs text-muted">
                {selectedProduct.description}
              </p>
            </div>

            <button
              type="button"
              onClick={changeProduct}
              className="cursor-pointer text-xs font-semibold text-primary hover:underline"
            >
              Trocar
            </button>
          </div>
        ) : (
          <>
            <input
              id="catalog-search"
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setProducts([]);
              }}
              placeholder="Ex.: smartphone, laptop, perfume..."
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-primary"
            />

            {searchLoading && (
              <p className="text-xs text-muted">
                Pesquisando produtos...
              </p>
            )}

            {searchError && (
              <p className="text-xs text-red-400">
                {searchError}
              </p>
            )}

            {!searchLoading && products.length > 0 && (
              <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-border p-2">
                {products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => selectProduct(product)}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 text-left transition hover:bg-white/5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.thumbnail}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-lg bg-white/5 object-contain"
                    />

                    <span className="text-sm font-medium">
                      {product.title}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {!searchLoading &&
              !searchError &&
              search.trim() &&
              products.length === 0 && (
                <p className="text-xs text-muted">
                  Nenhum produto encontrado.
                </p>
              )}
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="starting-price" className="text-sm font-semibold">
            Preço inicial (R$)
          </label>
          <input
            id="starting-price"
            type="text"
            inputMode="decimal"
            placeholder="150,00"
            value={startingPrice}
            onChange={(event) => setStartingPrice(event.target.value)}
            required
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-primary"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="increment" className="text-sm font-semibold">
            Incremento mínimo (R$)
          </label>
          <input
            id="increment"
            type="text"
            inputMode="decimal"
            placeholder="10,00"
            value={increment}
            onChange={(event) => setIncrement(event.target.value)}
            required
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-primary"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="starts-at" className="text-sm font-semibold">
            Início do leilão
          </label>
          <input
            id="starts-at"
            type="datetime-local"
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
            required
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-primary"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="ends-at" className="text-sm font-semibold">
            Encerramento do leilão
          </label>
          <input
            id="ends-at"
            type="datetime-local"
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
            required
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-primary"
          />
        </div>
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
        disabled={submitting || !selectedProduct}
        className="w-full cursor-pointer rounded-xl bg-primary px-6 py-3 font-bold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "CRIANDO LEILÃO..." : "CRIAR LEILÃO"}
      </button>
    </form>
  );
}