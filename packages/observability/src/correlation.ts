/**
 * VaahanSafe Standardized Request & Correlation Identifiers
 *
 * Generates structured, trace-friendly correlation tokens across all 8 surfaces.
 */

/**
 * Generates an operational request ID with the standard prefix VSREQ-
 * Example: "VSREQ-1773700000000-a8f2k9"
 */
export function generateRequestId(prefix = "VSREQ"): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const entropy = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${entropy}`;
}

export const generateCorrelationId = generateRequestId;


/**
 * Generates a public reference error ID with standard prefix VSERR-
 * Example: "VSERR-1773700000000-3b9c1d"
 */
export function generateErrorId(prefix = "VSERR"): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const entropy = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${entropy}`;
}

export interface CorrelationContext {
  requestId: string;
  correlationId?: string;
  service?: string;
  actorId?: string;
}
