import { Suspense } from "react";
import { requireRole } from "@/lib/session";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

async function BidderContent() {
  const user = await requireRole("BIDDER");

  return (
    <main className="mx-auto min-h-[70vh] max-w-7xl px-6 py-16">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-primary">
        Área do licitante
      </p>

      <h1 className="text-4xl font-bold">
        Olá, {user.name}!
      </h1>

      <p className="mt-4 text-muted">
        Consulte sua carteira e participe dos leilões.
      </p>
    </main>
  );
}

export default function BidderPage() {
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
                Carregando área do licitante...
              </p>
            </main>
          }
        >
          <BidderContent />
        </Suspense>
      </div>

      <Footer />
    </div>
  );
}