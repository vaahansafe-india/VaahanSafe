import { readFileSync } from "node:fs";

// Only the public widget key is compared; credentials and rendered profile are never printed.
const localEnv = readFileSync("apps/qr/.env.local", "utf8");
const publicKey = (
  localEnv.match(/^NEXT_PUBLIC_TURNSTILE_SITE_KEY=(.*)$/m)?.[1] || ""
)
  .trim()
  .replace(/^["']|["']$/g, "");
const response = await fetch("https://qr.vaahansafe.com/AWGMZACQ", {
  headers: {
    "User-Agent": "VaahanSafe-Reporting-Readiness-Bot",
    purpose: "prefetch",
  },
  signal: AbortSignal.timeout(20000),
});
const html = await response.text();
const checks = {
  httpStatus: response.status,
  expectedPublicWidgetKeyPresent: Boolean(
    publicKey && html.includes(publicKey),
  ),
  legacyUnavailableMessagePresent: html.includes(
    "Reporting is temporarily unavailable",
  ),
  redesignedVehicleHeroPresent: html.includes("QR verified"),
  redesignedReportEntryPresent: html.includes("Report a vehicle issue"),
};
console.log(JSON.stringify(checks, null, 2));
if (
  !response.ok ||
  !checks.expectedPublicWidgetKeyPresent ||
  checks.legacyUnavailableMessagePresent
)
  process.exitCode = 1;
