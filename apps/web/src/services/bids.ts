export type BidHistoryItem = {
  id: string;
  sequence: number | null;
  amountCents: string;
  createdAt: string;
  hash: string | null;
  previousHash: string | null;
  integrity: "VALID" | "INVALID" | "UNVERIFIED";
};

export type BidAudit = {
  totalBids: number;
  validCount: number;
  invalidCount: number;
  unhashedCount: number;
  integrity: "VALID" | "PARTIALLY_VERIFIED" | "INVALID";
};

export type BidHistoryResponse = {
  audit: BidAudit;
  bids: BidHistoryItem[];
};

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3333";

export async function getBidHistory(
  auctionId: string
): Promise<BidHistoryResponse> {
  const response = await fetch(
    `${API_URL}/auctions/${encodeURIComponent(auctionId)}/bids`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("Não foi possível carregar o histórico de lances.");
  }

  return response.json();
}