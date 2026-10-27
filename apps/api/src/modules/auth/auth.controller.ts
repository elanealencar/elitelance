import type { Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client";
import { ZodError } from "zod";
import { registerSchema, loginSchema } from "./auth.schema";
import { authService } from "./auth.service";

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const data = registerSchema.parse(req.body);

      const user = await authService.register(data);

      res.status(201).json({
        message: "Usuário cadastrado com sucesso",
        user,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: "Dados inválidos",
          errors: error.issues,
        });
        return;
      }

      if (
        error instanceof Error &&
        error.message === "EMAIL_ALREADY_EXISTS"
      ) {
        res.status(409).json({
          message: "E-mail já cadastrado",
        });
        return;
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        res.status(409).json({
          message: "E-mail já cadastrado",
        });
        return;
      }

      console.error("Erro no cadastro:", error);

      res.status(500).json({
        message: "Erro interno do servidor",
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const data = loginSchema.parse(req.body);

      const result = await authService.login(data);

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: "Dados inválidos",
          errors: error.issues,
        });
        return;
      }

      if (
        error instanceof Error &&
        error.message === "INVALID_CREDENTIALS"
      ) {
        res.status(401).json({
          message: "E-mail ou senha inválidos",
        });
        return;
      }

      console.error("Erro no login:", error);

      res.status(500).json({
        message: "Erro interno do servidor",
      });
    }
  }
}

export const authController = new AuthController();