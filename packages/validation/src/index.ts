import { z } from "zod";

// ==========================================
// PRIMITIVE & FORMAT SCHEMAS
// ==========================================

/**
 * Standard Indian 10-digit mobile number, allowing optional +91 or 0 prefix
 */
export const phoneSchema = z
  .string()
  .trim()
  .transform((val) => val.replace(/[\s\-()]/g, ""))
  .refine((val) => /^(\+91|0)?[6-9]\d{9}$/.test(val), {
    message: "Enter a valid 10-digit Indian mobile number starting with 6-9",
  })
  .transform((val) => {
    // Normalize to 10 digits
    if (val.startsWith("+91")) return val.slice(3);
    if (val.startsWith("0")) return val.slice(1);
    return val;
  });

/**
 * Standard Indian vehicle registration number (e.g. MH12AB1234, DL3CAA1234, 22BH1234AA)
 */
export const vehicleRegistrationSchema = z
  .string()
  .trim()
  .toUpperCase()
  .transform((val) => val.replace(/[\s\-]/g, ""))
  .refine(
    (val) =>
      /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/.test(val) ||
      /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/.test(val),
    {
      message: "Enter a valid Indian vehicle registration number (e.g. MH12AB1234)",
    }
  );

/**
 * QR Public Identifier: safe alphanumeric characters used in permanent URLs
 */
export const qrPublicIdSchema = z
  .string()
  .trim()
  .min(6, "QR Public ID must be at least 6 characters")
  .max(32, "QR Public ID cannot exceed 32 characters")
  .regex(/^[a-zA-Z0-9_-]+$/, "QR Public ID contains invalid characters");

/**
 * Scratch code for retail activation (6 to 10 uppercase alphanumeric chars)
 */
export const scratchCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(6, "Scratch code must be at least 6 characters")
  .max(10, "Scratch code cannot exceed 10 characters")
  .regex(/^[A-Z0-9]+$/, "Scratch code must be alphanumeric");

export const emailSchema = z.string().trim().email("Enter a valid email address");

export const pincodeSchema = z
  .string()
  .trim()
  .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit Indian PIN code");

// ==========================================
// PAGINATION & QUERY SCHEMAS
// ==========================================
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

// ==========================================
// VEHICLE & EMERGENCY SCHEMAS
// ==========================================
export const vehicleTypeSchema = z.enum([
  "CAR",
  "MOTORCYCLE",
  "SCOOTER",
  "TRUCK",
  "BUS",
  "COMMERCIAL",
  "OTHER",
]);

export const createVehicleSchema = z.object({
  registrationNumber: vehicleRegistrationSchema,
  make: z.string().min(1, "Vehicle make is required"),
  model: z.string().min(1, "Vehicle model is required"),
  year: z.number().int().min(1980).max(new Date().getFullYear() + 1).optional(),
  type: vehicleTypeSchema.default("CAR"),
  primaryColor: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  insuranceExpiryDate: z.string().optional(),
  emergencyMessage: z.string().max(200, "Emergency message cannot exceed 200 characters").optional(),
});

export const createEmergencyContactSchema = z.object({
  vehicleId: z.string().optional(),
  name: z.string().min(2, "Contact name must be at least 2 characters"),
  relationship: z.string().min(2, "Relationship is required"),
  phone: phoneSchema,
  alternatePhone: phoneSchema.optional(),
  isPriority: z.boolean().default(false),
  notifyOnScan: z.boolean().default(true),
});

// ==========================================
// ACTIVATION SCHEMAS
// ==========================================
export const qrActivationSchema = z.object({
  publicId: qrPublicIdSchema,
  scratchCode: scratchCodeSchema,
  mobile: phoneSchema,
});
