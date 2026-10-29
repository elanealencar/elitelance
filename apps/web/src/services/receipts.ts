export type PublicReceipt = {
  id: string;
  lotId: string;
  title: string;
  imageUrl: string | null;
  amountCents: string;
  endsAt: string;
  settledAt: string;
  status: "VERIFIED";
};

type PublicReceiptResponse = {
  receipt: PublicReceipt;
};

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3333";

export async function getPublicReceipt(
  receiptId: string
): Promise<PublicReceipt | null> {
  const response = await fetch(
    `${API_URL}/auctions/receipts/${encodeURIComponent(receiptId)}`,
    {
      cache: "no-store",
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Não foi possível carregar o comprovante.");
  }

  const data: PublicReceiptResponse = await response.json();

  return data.receipt;
}