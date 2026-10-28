"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type AuctionLiveUpdaterProps = {
  auctionId: string;
  currentPriceCents: string;
  endsAt: string;
  status: string;
};

export function AuctionLiveUpdater({
  auctionId,
  currentPriceCents,
  endsAt,
  status,
}: AuctionLiveUpdaterProps) {
  const router = useRouter();

  const lastSnapshot = useRef<string | null>(null);

  useEffect(() => {
    lastSnapshot.current = null;

    let active = true;
    let checking = false;

    async function checkForUpdates() {
      if (!active || checking || document.hidden) {
        return;
      }

      checking = true;

      try {
        const [auctionResponse, bidsResponse] = await Promise.all([
          fetch(`/api/auctions/${encodeURIComponent(auctionId)}`, {
            cache: "no-store",
          }),
          fetch(`/api/auctions/${encodeURIComponent(auctionId)}/bids`, {
            cache: "no-store",
          }),
        ]);

        if (!auctionResponse.ok || !bidsResponse.ok) {
          return;
        }

        const auctionData = await auctionResponse.json();
        const bidsData = await bidsResponse.json();

        const auction = auctionData.auction;

        if (!auction || !bidsData.audit) {
          return;
        }

        const nextSnapshot = [
          auction.currentPriceCents ?? auction.startingPriceCents,
          auction.endsAt,
          auction.status,
          bidsData.audit.totalBids,
        ].join("|");

        if (lastSnapshot.current === null) {
          const initialPrice =
            currentPriceCents;

          const initialSnapshot = [
            initialPrice,
            endsAt,
            status,
            bidsData.audit.totalBids,
          ].join("|");

          lastSnapshot.current = initialSnapshot;
        }

        if (nextSnapshot !== lastSnapshot.current) {
          lastSnapshot.current = nextSnapshot;
          router.refresh();
        }
      } catch {
        // Uma falha temporária não deve interromper a página.
      } finally {
        checking = false;
      }
    }

    void checkForUpdates();

    const interval = window.setInterval(checkForUpdates, 3000);

    function handleVisibilityChange() {
      if (!document.hidden) {
        void checkForUpdates();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [auctionId, currentPriceCents, endsAt, status, router]);

  return null;
}