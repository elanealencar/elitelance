import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { formatCurrency, formatDateBR } from "@/lib/format";
import { getPublicReceipt } from "@/services/receipts";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function ReceiptContent({ params }: PageProps) {
  const { id } = await params;

  const receipt = await getPublicReceipt(id);

  if (!receipt) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="rounded-3xl border border-border bg-surface p-6 sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-widest text-primary">
              ELITELANCE
            </p>

            <h1 className="mt-3 text-3xl font-bold">
              Comprovante de arremate
            </h1>
          </div>

          <span className="rounded-full bg-primary/10 px-4 py-2 text-xs font-bold text-primary">
            ✓ Verificado
          </span>
        </div>

        <div className="mt-8 border-t border-border pt-8">
          <p className="text-sm text-muted">
            Produto arrematado
          </p>

          <h2 className="mt-2 text-xl font-bold">
            {receipt.title}
          </h2>
        </div>

        <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6">
          <p className="text-sm text-muted">
            Valor arrematado
          </p>

          <p className="mt-2 text-4xl font-bold text-primary">
            {formatCurrency(receipt.amountCents)}
          </p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted">
              Encerramento do leilão
            </p>

            <p className="mt-2 font-semibold">
              {formatDateBR(receipt.endsAt)}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted">
              Data da liquidação
            </p>

            <p className="mt-2 font-semibold">
              {formatDateBR(receipt.settledAt)}
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8">
          <p className="text-xs text-muted">
            Identificador do comprovante
          </p>

          <p className="mt-2 break-all font-mono text-xs text-white">
            {receipt.id}
          </p>

          <p className="mt-4 text-sm text-muted">
            Este comprovante confirma que o arremate foi
            liquidado e registrado no EliteLance.
          </p>
        </div>

        <Link
          href={`/auctions/${receipt.lotId}`}
          className="mt-8 inline-flex cursor-pointer font-semibold text-primary hover:underline"
        >
          Ver leilão →
        </Link>
      </div>
    </div>
  );
}

export default function ReceiptPage({ params }: PageProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={<div className="h-21" />}>
        <Header />
      </Suspense>

      <main className="flex-1">
        <Suspense
          fallback={
            <div className="mx-auto max-w-3xl px-6 py-16 text-muted">
              Carregando comprovante...
            </div>
          }
        >
          <ReceiptContent params={params} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}