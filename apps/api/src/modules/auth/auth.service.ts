import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma";
import type { RegisterInput } from "./auth.schema";
import jwt from "jsonwebtoken";
import type { LoginInput } from "./auth.schema";

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

  
  async login(data: LoginInput) {
    const email = data.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const passwordMatches = await bcrypt.compare(
      data.password,
      user.passwordHash
    );

    if (!passwordMatches) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET_NOT_CONFIGURED");
    }

    const token = jwt.sign(
      {},
      secret,
      {
        subject: user.id,
        expiresIn: "1h",
        algorithm: "HS256",
      }
    );

    return {
      accessToken: token,
      tokenType: "Bearer",
      expiresIn: 3600,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}

export const authService = new AuthService();