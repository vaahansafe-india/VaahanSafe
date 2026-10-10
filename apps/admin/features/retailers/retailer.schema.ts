import { z } from "zod";
const text = (n: number) => z.string().trim().max(n).default("");
export const retailerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter the retailer or outlet name.").max(160, "Keep the outlet name within 160 characters."),
    legal_name: text(160),
    parent_distributor_id: z.string().regex(/^[A-Za-z0-9_-]{1,100}$/),
    state_code: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
    district_code: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
    city: z.string().trim().min(2, "Enter the outlet locality or city.").max(100),
    postal_code: z
      .union([z.literal(""), z.string().regex(/^[1-9]\d{5}$/)])
      .default(""),
    address_line_1: z.string().trim().min(3, "Enter the shop, building or street address.").max(200),
    address_line_2: text(200),
    landmark: text(200),
    contact_name: z.string().trim().min(2, "Enter the owner or manager name.").max(100),
    contact_phone: z
      .string()
      .transform((v) => v.replace(/[\s()-]/g, ""))
      .transform((v) => (/^[6-9]\d{9}$/.test(v) ? `+91${v}` : v))
      .pipe(z.string().regex(/^\+91[6-9]\d{9}$/, "Enter a valid Indian mobile number.")),
    contact_email: z
      .union([z.literal(""), z.string().trim().email().max(254)])
      .default(""),
    notes: text(2000),
    stock_threshold: z.number().int().min(0).max(100000),
    territory_override: z.boolean().default(false),
    reason: z.string().trim().min(10, "Enter an operational reason of at least 10 characters.").max(500),
  })
  .strict();
