import { z } from "zod";
const text = (max: number) => z.string().trim().max(max).default("");
const code = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);
export const distributorSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    legal_name: text(160),
    state_code: code,
    district_code: code,
    city: z.string().trim().min(2).max(100),
    postal_code: z.string().regex(/^[1-9]\d{5}$/),
    address_line_1: z.string().trim().min(3).max(200),
    address_line_2: text(200),
    landmark: text(200),
    contact_name: z.string().trim().min(2).max(100),
    contact_role: text(100),
    contact_phone: z
      .string()
      .transform((v) => v.replace(/[\s()-]/g, ""))
      .transform((v) => (/^[6-9]\d{9}$/.test(v) ? `+91${v}` : v))
      .pipe(z.string().regex(/^\+91[6-9]\d{9}$/)),
    contact_email: z
      .union([z.literal(""), z.string().trim().email().max(254)])
      .default(""),
    notes: text(2000),
    territories: z
      .array(z.object({ state_code: code, district_code: code }).strict())
      .min(1)
      .max(30)
      .refine(
        (a) => new Set(a.map((t) => t.district_code)).size === a.length,
        "Choose each service district only once.",
      ),
    reason: z.string().trim().min(10).max(500),
  })
  .strict();
