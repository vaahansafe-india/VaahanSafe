import { z } from "zod";

export const normalizeSaleCode = (value: string) =>
  value
    .normalize("NFKC")
    .trim()
    .toUpperCase()
    .replace(/[\u2010-\u2015\u2212]/g, "-");
export const retailSaleSchema = z
  .object({
    requestId: z.string().uuid(),
    codes: z
      .array(
        z
          .string()
          .transform(normalizeSaleCode)
          .pipe(z.string().regex(/^VS-[A-Z0-9-]{4,90}$/)),
      )
      .min(1)
      .max(100),
    receipt: z
      .string()
      .trim()
      .min(3)
      .max(80)
      .transform((s) => s.toUpperCase()),
    reason: z.string().trim().min(10).max(500),
  })
  .strict()
  .superRefine((data, context) => {
    if (new Set(data.codes).size !== data.codes.length)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["codes"],
        message: "Each sticker can appear once.",
      });
  });
export type RetailSaleInput = z.infer<typeof retailSaleSchema>;
export type SaleOption = {
  id: string;
  visible_code: string;
  batch_reference: string;
  created_at: string;
};
export type RetailSale = {
  id: string;
  reference_code: string;
  receipt_reference: string;
  quantity: number;
  reason: string;
  created_at: string;
  actor_name: string;
  visible_codes: string[];
};
