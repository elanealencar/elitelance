"use client";

import { useCallback, useEffect, useState } from "react";

import { BidForm } from "./BidForm";
import { BidPositionIndicator } from "./BidPositionIndicator";

type MyBidStatus = {
  hasBid: boolean;
  isLeading: boolean;
  lastBidAmountCents: string | null;
};

type AuctionBidPanelProps = {
  auctionId: string;
  minimumBidCents: string;
};

export function AuctionBidPanel({
  auctionId,
  minimumBidCents,
}: AuctionBidPanelProps) {
  const [status, setStatus] = useState<MyBidStatus | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [statusError, setStatusError] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/auctions/${encodeURIComponent(auctionId)}/my-bid-status`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error("Falha ao consultar liderança");
      }

      const data: MyBidStatus = await response.json();

      setStatus(data);
      setStatusError(false);
    } catch {
      setStatusError(true);
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  useEffect(() => {
    void loadStatus();

    const interval = window.setInterval(() => {
      if (!document.hidden) {
        void loadStatus();
      }
    }, 3000);

    function handleVisibilityChange() {
      if (!document.hidden) {
        void loadStatus();
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      window.clearInterval(interval);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [loadStatus]);

  function handleBidSuccess() {
    // Bloqueia imediatamente após um lance aceito.
    setStatus((previous) => ({
      hasBid: true,
      isLeading: true,
      lastBidAmountCents:
        previous?.lastBidAmountCents ?? null,
    }));

    void loadStatus();
  }

  return (
    <>
      <BidPositionIndicator
        hasBid={status?.hasBid ?? false}
        isLeading={status?.isLeading ?? false}
        loading={loading}
      />

      {statusError && (
        <p role="alert" className="mt-3 text-sm text-yellow-400">
          Não foi possível verificar sua posição.
          Aguarde a atualização automática.
        </p>
      )}

      <BidForm
        auctionId={auctionId}
        minimumBidCents={minimumBidCents}
        disabled={
          loading ||
          Boolean(statusError) ||
          status?.isLeading === true
        }
        isLeading={status?.isLeading === true}
        onBidSuccess={handleBidSuccess}
      />
    </>
  );
}
