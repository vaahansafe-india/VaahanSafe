import { z } from "zod";
const codes = z.array(z.string().regex(/^VS-[A-Z0-9-]{4,64}$/)).max(5000);
export const reconciliationCommandSchema = z
  .object({
    action: z.enum([
      "create",
      "save",
      "complete",
      "investigate",
      "recount",
      "resolve",
      "approve",
      "adjust",
      "close",
      "cancel",
    ]),
    revision: z.number().int().min(0).optional(),
    reason: z.string().trim().min(10).max(500),
    requestId: z.string().uuid(),
    values: z.record(z.unknown()),
  })
  .strict()
  .superRefine((b, c) => {
    const shapes = {
      create: z
        .object({
          partner: z.string().regex(/^[A-Za-z0-9_-]{1,100}$/),
          batches: z.array(z.string().regex(/^[A-Za-z0-9_-]{1,100}$/)).max(20),
          expected: z.number().int().min(0).max(100000),
        })
        .strict(),
      save: z.object({ counted: z.number().int().min(0).max(100000) }).strict(),
      complete: z
        .object({ counted: z.number().int().min(0).max(100000) })
        .strict(),
      resolve: z
        .object({
          missing: z.number().int().min(0).max(100000),
          extra: z.number().int().min(0).max(100000),
          damaged: z.number().int().min(0).max(100000),
        })
        .strict(),
      adjust: z.object({ missingCodes: codes, damagedCodes: codes }).strict(),
    };
    const shape =
      shapes[b.action as keyof typeof shapes] || z.object({}).strict();
    if (!shape.safeParse(b.values).success)
      c.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Review the fields for this action.",
      });
    if (b.action !== "create" && b.revision === undefined)
      c.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Refresh the latest record.",
      });
  });
