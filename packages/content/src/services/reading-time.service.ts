/**
 * Server-Side Reading Time Calculation Service
 *
 * Computes reading time deterministically based on standard 200 words-per-minute rate.
 */

export interface ReadingTimeResult {
  minutes: number;
  label: string; // e.g., "08 MIN" or "08 MIN READ"
}

export function calculateReadingTime(text: string, wordsPerMinute = 200): ReadingTimeResult {
  if (!text || typeof text !== "string") {
    return { minutes: 1, label: "01 MIN READ" };
  }

  // Strip markdown symbols and punctuation
  const clean = text
    .replace(/[#*`_~[\]()<>!-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = clean.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / wordsPerMinute));
  const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;

  return {
    minutes,
    label: `${formattedMinutes} MIN READ`,
  };
}
