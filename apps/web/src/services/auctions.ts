export type Auction = {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  startingPriceCents: string;
  currentPriceCents: string | null;
  incrementCents: string;
  startsAt: string;
  endsAt: string;
  status: "DRAFT" | "SCHEDULED" | "ACTIVE" | "FINISHED" | "CANCELED";
};

type AuctionsResponse = {
  lots: Auction[];
};

export async function getAuctions(): Promise<Auction[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3333";

  const response = await fetch(`${baseUrl}/auctions`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Não foi possível carregar os leilões.");
  }

  const data: AuctionsResponse = await response.json();

  if (!Array.isArray(data?.lots)) {
    throw new Error("Formato inesperado na resposta da API.");
  }

  return data.lots;
}

export async function getAuctionById(
  id: string
): Promise<Auction | null> {
  const auctions = await getAuctions();

  return auctions.find((auction) => auction.id === id) ?? null;
}