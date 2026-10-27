import { z } from "zod";

export const createAuctionSchema = z.object({
  productId: z.number().int().positive(),
  startingPriceCents: z.number().int().positive().safe(),
  incrementCents: z.number().int().positive().safe(),
  startsAt: z.iso.datetime({ offset: true }),
  endsAt: z.iso.datetime({ offset: true }),
}).strict().refine(
  (data) => new Date(data.endsAt) > new Date(data.startsAt),
  {
    message: "Encerramento deve ser posterior ao início",
    path: ["endsAt"],
  }
);

export type CreateAuctionInput =
  z.infer<typeof createAuctionSchema>;