import { z } from "zod";

export const createBidSchema = z.object({
  amountCents: z.number()
    .int()
    .positive()
    .safe(),
}).strict();

export type CreateBidInput =
  z.infer<typeof createBidSchema>;