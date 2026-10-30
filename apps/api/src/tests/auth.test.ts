import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../app";

describe("EliteLance API - Health Check", () => {
  it("deve retornar status 200", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: "ok",
      application: "EliteLance API",
    });
    expect(response.body.timestamp).toBeDefined();
  });
});

describe("EliteLance API - Autenticação", () => {
  it("deve impedir acesso sem token", async () => {
    const response = await request(app).get("/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe(
      "Token não fornecido"
    );
  });

  it("deve rejeitar token inválido", async () => {
    const response = await request(app)
      .get("/auth/me")
      .set("Authorization", "Bearer token-invalido");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe(
      "Token inválido ou expirado"
    );
  });

  it("deve rejeitar login com e-mail inválido", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        email: "email-invalido",
        password: "12345678",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Dados inválidos"
    );
  });

  it("deve rejeitar login sem senha", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        email: "teste@exemplo.com",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Dados inválidos"
    );
  });
});