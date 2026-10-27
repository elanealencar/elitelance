import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(3, "Nome deve ter ao menos 3 caracteres"),
  email: z.email("E-mail inválido"),
  password: z.string()
    .min(8, "Senha deve ter ao menos 8 caracteres")
    .max(72, "Senha muito longa"),
}).strict();

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
}).strict();

export type LoginInput = z.infer<typeof loginSchema>;
