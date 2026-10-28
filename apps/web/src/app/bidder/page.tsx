import { Header } from "@/components/layout/Header";
import { requireRole } from "@/lib/session";
import { Suspense } from "react";

export default async function BidderPage() {
  const user = await requireRole("BIDDER");

  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={<div className="h-21" />}>
        <Header />
      </Suspense>
      <main className="mx-auto min-h-[70vh] max-w-7xl px-6 py-16">
        <Header />
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
    </div>
  );
}