import { Header } from "@/components/layout/Header";
import { requireRole } from "@/lib/session";
import Head from "next/head";
import { Suspense } from "react";

export default async function AuctioneerPage() {
  const user = await requireRole("AUCTIONEER");

  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={<div className="h-21" />}>
        <Header />
      </Suspense>
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
      </main>
    </div>
  );
}