import type { RequestHandler } from "express";
import type { UserRole } from "../generated/prisma/client";

export function authorize(
  ...allowedRoles: UserRole[]
): RequestHandler {
  return (_req, res, next) => {
    const user = res.locals.user;

    if (!user) {
      res.status(401).json({
        message: "Não autenticado",
      });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        message: "Acesso não autorizado",
      });
      return;
    }

    next();
  };
}