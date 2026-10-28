export type Wallet = {
  balanceCents: string;
  reservedCents: string;
  availableCents: string;
};

export type WalletResponse = {
  wallet: Wallet;
};

export async function getWallet(): Promise<Wallet> {
  const response = await fetch("/api/wallet", {
    cache: "no-store",
  });

  const data: WalletResponse & {
    message?: string;
    error?: string;
  } = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ??
        data.error ??
        "Não foi possível carregar a carteira."
    );
  }

  return data.wallet;
}

export async function depositWallet(
  amountCents: number
): Promise<void> {
  const response = await fetch("/api/wallet/deposit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amountCents }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ??
        data.error ??
        "Não foi possível realizar o depósito."
    );
  }
}
