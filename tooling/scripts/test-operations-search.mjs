import { classifySearchInput } from "../../apps/admin/features/global-search/server/classify-query.ts";

console.log("=== Testing Query Classifier ===");

const cases = [
  { input: "VS-BF42R86V", expectedScope: "qr", expectedExact: true },
  { input: "VS-12345678", expectedScope: "qr", expectedExact: true },
  { input: "AP05AB1234", expectedScope: "vehicle", expectedExact: true },
  { input: "ap 05 ab 1234", expectedScope: "vehicle", expectedExact: true },
  { input: "DL 1C AA 1111", expectedScope: "vehicle", expectedExact: true },
  { input: "VS-ORD-2026-0042", expectedScope: "order", expectedExact: true },
  { input: "ORD-9999", expectedScope: "order", expectedExact: true },
  { input: "VS-BAT-0048", expectedScope: "batch", expectedExact: true },
  { input: "BATCH-ONLINE-DIRECT", expectedScope: "batch", expectedExact: true },
  { input: "B001", expectedScope: "batch", expectedExact: true },
  { input: "VS-TRF-0042", expectedScope: "transfer", expectedExact: true },
  { input: "VS-SUP-0012", expectedScope: "support", expectedExact: true },
  { input: "9876543210", expectedScope: "phone", expectedSensitive: true },
  { input: "+919876543210", expectedScope: "phone", expectedSensitive: true },
  { input: "Random Query Text", expectedScope: "all", expectedExact: false },
];

let failed = 0;
for (const tc of cases) {
  const result = classifySearchInput(tc.input);
  const scopeMatches = result.likelyScope === tc.expectedScope;
  const exactMatches = tc.expectedExact !== undefined ? result.isExactCandidate === tc.expectedExact : true;
  const sensitiveMatches = tc.expectedSensitive !== undefined ? result.isSensitivePhone === tc.expectedSensitive : true;

  if (scopeMatches && exactMatches && sensitiveMatches) {
    console.log(`✓ "${tc.input}" -> scope=${result.likelyScope}, normalized="${result.normalizedQuery}", hint="${result.hintBadge}"`);
  } else {
    console.error(`✗ FAIL: "${tc.input}" -> got scope=${result.likelyScope}, exact=${result.isExactCandidate}, sensitive=${result.isSensitivePhone}`);
    failed++;
  }
}

if (failed > 0) {
  process.exit(1);
} else {
  console.log("\nAll classification tests passed!");
}
