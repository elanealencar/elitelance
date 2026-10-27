import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

export const authenticate: RequestHandler = async (
  req,
  res,
  next
) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({
      message: "Token não fornecido",
    });
    return;
  }

  const token = authorization.slice(7);

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET_NOT_CONFIGURED");
    }

    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    });

    if (
      typeof decoded === "string" ||
      !decoded.sub
    ) {
      res.status(401).json({
        message: "Token inválido",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      res.status(401).json({
        message: "Usuário não encontrado",
      });
      return;
    }

    res.locals.user = user;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        message: "Token inválido ou expirado",
      });
      return;
    }

    next(error);
  }
};