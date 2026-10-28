import Link from "next/link";
import { Suspense } from "react";
import { AuctionsList } from "@/components/auctions/AuctionsList";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const statusLabels: Record<string, string> = {
  ACTIVE: "Em andamento",
  SCHEDULED: "Em breve",
  FINISHED: "Encerrado",
  CANCELED: "Cancelado",
  DRAFT: "Rascunho",
};

export default async function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Suspense fallback={<div className="h-21" />}>
        <Header />
      </Suspense>

      <main>
        <section className="relative overflow-hidden border-b border-border">
          <div className="pointer-events-none absolute -right-40 top-0 h-96 w-96 rounded-full bg-primary/15 blur-[110px]" />
          <div className="pointer-events-none absolute left-1/3 top-20 h-80 w-80 rounded-full bg-secondary/15 blur-[110px]" />

          <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-24">
            <div className="max-w-4xl">
              <p className="mb-7 text-xs font-bold uppercase tracking-[0.3em] text-primary">
                Uma nova experiência em leilões
              </p>

              <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
                GRANDES
                <br />
                OPORTUNIDADES.
                <br />
                <span className="text-secondary">
                  LANCES EM TEMPO REAL.
                </span>
              </h1>

              <p className="mt-8 max-w-2xl text-lg leading-8 text-muted">
                Descubra produtos, acompanhe as disputas e
                participe de leilões online com transparência
                e segurança.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/#leiloes"
                  className="rounded-full bg-primary px-7 py-4 text-sm font-bold text-black transition hover:bg-primary-hover"
                >
                  EXPLORAR LEILÕES ↗
                </Link>

                <Link
                  href="/login"
                  className="rounded-full border border-white/40 px-7 py-4 text-sm font-bold transition hover:border-secondary hover:text-secondary"
                >
                  PARTICIPAR AGORA
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section
          id="leiloes"
          className="mx-auto max-w-7xl px-6 py-20"
        >
          <div className="mb-12">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-primary">
              Explore oportunidades
            </p>

            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Leilões <span className="text-secondary">disponíveis</span>
            </h2>

            <p className="mt-4 text-muted">
              Acompanhe os lotes e descubra sua próxima oportunidade.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-96 animate-pulse rounded-2xl border border-border bg-surface"
                  />
                ))}
              </div>
            }
          >
            <AuctionsList />
          </Suspense>
        </section>
      </main>

      
      <Footer />

    </div>
  );
}
