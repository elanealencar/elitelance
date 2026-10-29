export type AuctioneerLot = {
  id: string;
  title: string;
  imageUrl: string | null;
  status: "DRAFT" | "SCHEDULED" | "ACTIVE" | "FINISHED" | "CANCELED";
  startsAt: string;
  endsAt: string;
  startingPriceCents: string;
  currentPriceCents: string | null;
  incrementCents: string;
  bidCount: number;
};

export type MyAuctionsResponse = {
  lots: AuctioneerLot[];
};

export async function getMyAuctions(): Promise<MyAuctionsResponse> {
  const response = await fetch("/api/auctions/mine", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Não foi possível carregar seus leilões.");
  }

  return response.json();
}