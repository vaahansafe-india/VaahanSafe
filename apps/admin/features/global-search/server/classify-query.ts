import type { QueryClassification, SearchScope } from "../search.types";

const PHONE_REGEX = /^(?:(?:\+?91)|0)?([6-9]\d{9})$/;
const VEHICLE_REGEX = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/;
const QR_CANONICAL = /^VS-[A-Z0-9]{6,12}$/i;
const BATCH_PATTERN = /^(?:VS-BAT-|BATCH-|B\d{3,}|batch_)/i;
const ORDER_PATTERN = /^(?:VS-ORD-|ORD-)/i;
const TRANSFER_PATTERN = /^(?:VS-TRF-|TRF-)/i;
const SUPPORT_PATTERN = /^(?:VS-SUP-|SUP-)/i;

export function classifySearchInput(rawQuery: string): QueryClassification {
  const query = rawQuery.trim();
  const digitsOnly = query.replace(/\D/g, "");

  // 1. Phone number recognition (must be handled with audited sensitive flow)
  if (PHONE_REGEX.test(query) || (digitsOnly.length === 10 && /^[6-9]/.test(digitsOnly))) {
    const cleanDigits = digitsOnly.slice(-10);
    return {
      rawQuery,
      normalizedQuery: `+91${cleanDigits}`,
      likelyScope: "phone",
      isSensitivePhone: true,
      isExactCandidate: true,
      hintBadge: "Sensitive Phone Lookup",
    };
  }

  // 2. Vehicle Registration normalization (e.g. "AP 05 AB 1234" -> "AP05AB1234")
  const strippedUpper = query.toUpperCase().replace(/[\s\-_.]/g, "");
  if (VEHICLE_REGEX.test(strippedUpper)) {
    return {
      rawQuery,
      normalizedQuery: strippedUpper,
      likelyScope: "vehicle",
      isSensitivePhone: false,
      isExactCandidate: true,
      hintBadge: "Likely Vehicle Registration",
    };
  }

  // 3. Batch reference
  if (BATCH_PATTERN.test(query)) {
    return {
      rawQuery,
      normalizedQuery: query.toUpperCase(),
      likelyScope: "batch",
      isSensitivePhone: false,
      isExactCandidate: true,
      hintBadge: "Likely Batch Reference",
    };
  }

  // 4. Order reference
  if (ORDER_PATTERN.test(query)) {
    return {
      rawQuery,
      normalizedQuery: query.toUpperCase(),
      likelyScope: "order",
      isSensitivePhone: false,
      isExactCandidate: true,
      hintBadge: "Likely Order Reference",
    };
  }

  // 5. Transfer reference
  if (TRANSFER_PATTERN.test(query)) {
    return {
      rawQuery,
      normalizedQuery: query.toUpperCase(),
      likelyScope: "transfer",
      isSensitivePhone: false,
      isExactCandidate: true,
      hintBadge: "Likely Transfer Reference",
    };
  }

  // 6. Support reference
  if (SUPPORT_PATTERN.test(query)) {
    return {
      rawQuery,
      normalizedQuery: query.toUpperCase(),
      likelyScope: "support",
      isSensitivePhone: false,
      isExactCandidate: true,
      hintBadge: "Likely Support Reference",
    };
  }

  // 7. QR reference (visible or public ID)
  if (QR_CANONICAL.test(query) || (query.toUpperCase().startsWith("VS-") && query.length <= 16)) {
    return {
      rawQuery,
      normalizedQuery: query.toUpperCase(),
      likelyScope: "qr",
      isSensitivePhone: false,
      isExactCandidate: true,
      hintBadge: "Likely QR Reference",
    };
  }

  return {
    rawQuery,
    normalizedQuery: query,
    likelyScope: "all",
    isSensitivePhone: false,
    isExactCandidate: false,
    hintBadge: null,
  };
}
