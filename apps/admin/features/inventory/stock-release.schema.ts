import { z } from "zod";
export const stockReleaseSchema = z
  .object({
    reason: z.string().trim().min(10).max(500),
    confirmed: z.literal(true),
    requestId: z.string().uuid(),
  })
  .strict();
export interface StockReleaseStatus {
  quantity: number;
  eligible: number;
  canRelease: boolean;
  release: { id: string; quantity: number; createdAt: string } | null;
}
