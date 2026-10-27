import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma";
import type { RegisterInput } from "./auth.schema";

export class AuthService {
  async register(data: RegisterInput) {
    const email = data.email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.$transaction(async (tx) => {
      return tx.user.create({
        data: {
          name: data.name,
          email,
          passwordHash,
          role: "BIDDER",
          wallet: {
            create: {
              balanceCents: 0n,
              reservedCents: 0n,
            },
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
    });

    return user;
  }
}

export const authService = new AuthService();