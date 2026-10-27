import { prisma } from "../../lib/prisma";

function serializeWallet(wallet: {
  balanceCents: bigint;
  reservedCents: bigint;
}) {
  return {
    balanceCents: wallet.balanceCents.toString(),
    reservedCents: wallet.reservedCents.toString(),
    availableCents: (
      wallet.balanceCents - wallet.reservedCents
    ).toString(),
  };
}

export class WalletService {
  async getByUserId(userId: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new Error("WALLET_NOT_FOUND");
    }

    return serializeWallet(wallet);
  }

  async deposit(userId: string, amountCents: number) {
    const wallet = await prisma.wallet.update({
      where: { userId },
      data: {
        balanceCents: {
          increment: BigInt(amountCents),
        },
      },
    });

    return serializeWallet(wallet);
  }
}

export const walletService = new WalletService();