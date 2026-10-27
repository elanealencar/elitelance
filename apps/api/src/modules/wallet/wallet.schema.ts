import { z } from "zod";

export const depositSchema = z.object({
  amountCents: z.number()
    .int()
    .positive()
    .safe()
    .max(100000000),
}).strict();

export type DepositInput = z.infer<typeof depositSchema>;