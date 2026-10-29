import { Suspense } from "react";
import { requireRole } from "@/lib/session";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WalletDashboard } from "@/components/wallet/WalletDashboard";
import { MyWins } from "@/components/bidder/MyWins";

async function BidderContent() {
  const user = await requireRole("BIDDER");

  return (
    <>
      <WalletDashboard userName={user.name} />
      <div className="mx-auto max-w-7xl px-6 py-10">
        <MyWins />
      </div>
    </>
  );
}

export default function BidderPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={<div className="h-21" />}>
        <Header />
      </Suspense>

      <main className="flex-1">
        <Suspense
          fallback={
            <div className="mx-auto max-w-7xl px-6 py-16">
              <p className="animate-pulse text-muted">
                Carregando área do licitante...
              </p>
            </div>
          }
        >
          <BidderContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}