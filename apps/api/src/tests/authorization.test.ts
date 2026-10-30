
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

vi.mock("../lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { app } from "../app";
import { prisma } from "../lib/prisma";

const mockedFindUnique = vi.mocked(prisma.user.findUnique);

const JWT_SECRET = "elitelance-test-secret-not-for-production";

function createToken(userId: string) {
  return jwt.sign({}, JWT_SECRET, {
    subject: userId,
    algorithm: "HS256",
    expiresIn: "1h",
  });
}

describe("EliteLance API - Autorização por perfil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve impedir que BIDDER crie um lote", async () => {
    mockedFindUnique.mockResolvedValue({
        id: "bidder-test-id",
        name: "Licitante Teste",
        email: "bidder@teste.com",
        passwordHash: "hash-ficticio",
        role: "BIDDER",
        createdAt: new Date("2026-01-01"),
    });

    expect(process.env.JWT_SECRET).toBeDefined();
    expect(process.env.JWT_SECRET).toBe(JWT_SECRET);

    const token = createToken("bidder-test-id");

    const response = await request(app)
      .post("/auctions")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      "Acesso não autorizado"
    );

    expect(mockedFindUnique).toHaveBeenCalledOnce();
  });

  it("deve impedir que AUCTIONEER registre um lance", async () => {
    mockedFindUnique.mockResolvedValue({
        id: "auctioneer-test-id",
        name: "Leiloeiro Teste",
        email: "auctioneer@teste.com",
        passwordHash: "hash-ficticio",
        role: "AUCTIONEER",
        createdAt: new Date("2026-01-01"),
    });

    const token = createToken("auctioneer-test-id");

    const response = await request(app)
      .post("/auctions/lot-test-id/bids")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 10000,
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      "Acesso não autorizado"
    );

    expect(mockedFindUnique).toHaveBeenCalledOnce();
  });
});
