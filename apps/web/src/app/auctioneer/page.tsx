import { Suspense } from "react";
import { requireRole } from "@/lib/session";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MyAuctions } from "@/components/auctioneer/MyAuctions";
import { CreateAuctionForm } from "@/components/auctioneer/CreateAuctionForm";

async function AuctioneerContent() {
  const user = await requireRole("AUCTIONEER");

  return (
    <main className="mx-auto min-h-[70vh] max-w-7xl px-6 py-16">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-primary">
        Área do leiloeiro
      </p>

      <h1 className="text-4xl font-bold">
        Olá, {user.name}!
      </h1>

      <p className="mt-4 text-muted">
        Gerencie seus lotes e acompanhe os leilões.
      </p>

      <details className="group mt-10 rounded-2xl border border-border bg-surface">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 font-bold text-primary">
          + Criar novo leilão
          <span className="text-sm transition group-open:rotate-45">+</span>
        </summary>

        <div className="border-t border-border p-6">
          <CreateAuctionForm />
        </div>
      </details>
      
      <MyAuctions />
    </main>
  );
}

export default function AuctioneerPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={<div className="h-21" />}>
        <Header />
      </Suspense>

      <div className="flex-1">
        <Suspense
          fallback={
            <main className="mx-auto max-w-7xl px-6 py-16">
              <p className="animate-pulse text-muted">
                Carregando painel do leiloeiro...
              </p>
            </main>
          }
        >
          <AuctioneerContent />
        </Suspense>
      </div>

      <Footer />
    </div>
  );
}