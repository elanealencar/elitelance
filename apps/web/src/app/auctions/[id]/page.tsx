import { Suspense } from "react";
import { notFound, unstable_rethrow } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuctionDetails } from "@/components/auctions/AuctionDetails";
import { getAuctionById } from "@/services/auctions";

import { BidHistory } from "@/components/auctions/BidHistory";
import { getSessionUser } from "@/lib/session";
import { AuctionLiveUpdater } from "@/components/auctions/AuctionLiveUpdater";

type AuctionPageProps = {
  params: Promise<{ id: string }>;
};

async function AuctionContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let auction;

  try {
    auction = await getAuctionById(id);
  } catch (error) {
    unstable_rethrow(error);

    console.error("Erro ao carregar leilão:", error);

    return (
      <main className="mx-auto max-w-7xl px-6 py-20 text-center text-muted">
        Não foi possível carregar este leilão.
      </main>
    );
  }

  if (!auction) {
    notFound();
  }

  const user = await getSessionUser();

  return (
    <>
      <AuctionLiveUpdater
        auctionId={auction.id}
        currentPriceCents={
          auction.currentPriceCents ?? auction.startingPriceCents
        }
        endsAt={auction.endsAt}
        status={auction.status}
      />

      <AuctionDetails
        auction={auction}
        userRole={user?.role ?? null}
      />

      <div className="mx-auto max-w-7xl px-6 pb-16">
        <Suspense
          fallback={
            <p className="py-8 text-sm text-muted">
              Carregando histórico de lances...
            </p>
          }
        >
          <BidHistory auctionId={auction.id} />
        </Suspense>
      </div>
    </>
  );
}

export default function AuctionPage({
  params,
}: AuctionPageProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={<div className="h-21" />}>
        <Header />
      </Suspense>

      <main className="flex-1">
        <Suspense
          fallback={
            <div className="mx-auto max-w-7xl animate-pulse px-6 py-20 text-muted">
              Carregando leilão...
            </div>
          }
        >
          <AuctionContent params={params} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}