import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { RouteHero } from "../apps/web/components/home/RouteHero";
import { VaahanSafeIdentityObject } from "../apps/web/components/home/VaahanSafeIdentityObject";
import { SiteHeader } from "../apps/web/components/marketing/site-header";
import { HOMEPAGE_DEMO_DATA } from "../apps/web/lib/demo/homepage-demo";
import { getActivateUrl, getCustomerUrl } from "@vaahansafe/config";
import { DEMO_QR_PATH, VEHICLE_BODY_PATH } from "../packages/ui/src/brand";

const source = (name: string) =>
  fs.readFileSync(path.resolve(__dirname, `../apps/web/${name}`), "utf8");
const heroCss = source("components/home/identity-hero.module.css").replace(/\s+/g, " ");

describe("Centered public identity hero", () => {
  it("server-renders one clear headline, synthetic artifact and the three acquisition routes", () => {
    const html = renderToStaticMarkup(React.createElement(RouteHero));
    expect(html.match(/<h1 /g)).toHaveLength(1);
    expect(html).toContain("Your vehicle has an identity.");
    expect(html).toContain("Make it useful when it matters.");
    expect(html).toContain(`href="${getCustomerUrl()}"`);
    expect(html).toContain(`href="${getActivateUrl()}"`);
    expect(html).toContain('href="/how-it-works"');
    expect(html).toContain("Get VaahanSafe");
    expect(html).toContain("Activate it");
    expect(html).toContain("Demo Vehicle");
    expect(html).toContain("Privacy Controlled");
    expect(html).toContain("Illustrative preview");
    expect(html).toContain(HOMEPAGE_DEMO_DATA.hero.visibleCode);
  });
  it("keeps hero, identity field and plaque on the server with zero event/timer code", () => {
    for (const component of [
      "RouteHero",
      "IdentityField",
      "VaahanSafeIdentityObject",
    ]) {
      const text = source(`components/home/${component}.tsx`);
      expect(text).not.toContain('"use client"');
      expect(text).not.toMatch(
        /useEffect|setTimeout|setInterval|onMouseMove|onPointerMove|fetch\(/,
      );
    }
    expect(source("app/page.tsx")).not.toContain('"use client"');
  });
  it("does not expose backend/provider details, unsupported guarantees or actual customer details", () => {
    const html = renderToStaticMarkup(React.createElement(RouteHero));
    expect(html).not.toMatch(
      /Cloudflare|\bD1\b|\bR2\b|Worker|Queue|monorepo|database|\bAPI\b|Cashfree|MSG91|webhook|schema|hashing|inventory|ledger|admin|100%|military-grade|bank-grade|guarantee|#1|world.s first|Honda|\+91|@/i,
    );
    expect(html).not.toMatch(
      /DL 01|bloodGroup|scratchSecret|activationSecret|data:image|<image/,
    );
  });
  it("shares the canonical brand geometry and a non-functional QR motif", () => {
    const html = renderToStaticMarkup(
      React.createElement(VaahanSafeIdentityObject),
    );
    expect(html).toContain(`d="${DEMO_QR_PATH}"`);
    expect(html).toContain(`d="${VEHICLE_BODY_PATH}"`);
    expect(html).toContain(
      'aria-label="Illustrative VaahanSafe vehicle identity"',
    );
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toMatch(/<text|<foreignObject|href=.*qr\./);
  });
  it("runs one scan at 1000ms, resolves by 1750ms and never loops", () => {
    expect(heroCss).toContain("plaqueScanSweep 4.2s ease-out 350ms 1 both");
    expect(heroCss).toContain("plaqueVehicleResolve 4.2s ease-out 350ms 1 both");
    expect(heroCss).not.toMatch(/infinite|blur\(/);
  });
  it("shows the final vehicle immediately for reduced motion", () => {
    expect(heroCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(heroCss).toContain("animation: none");
    expect(heroCss).toContain(".scanSweep { display: none; }");
    expect(heroCss).toContain(
      ".recognizedVehicle { animation: none; opacity: 1; }",
    );
  });
  it("provides intentional mobile composition, readable labels and visible keyboard focus", () => {
    expect(heroCss).toContain("@media (max-width: 390px)");
    expect(heroCss).toContain("@media (max-width: 767px)");
    expect(heroCss).toContain("min-height: 44px");
    expect(heroCss).toContain(":focus-visible");
    expect(heroCss).toContain("text-align: center");
  });
  it("public navigation contains only product destinations, without a design-system/admin/provider link", () => {
    const html = renderToStaticMarkup(React.createElement(SiteHeader));
    expect(html).toContain('aria-label="Primary site navigation"');
    expect(html).not.toMatch(
      /design-system|Cloudflare|SLA|Resolver|admin|qr\.vaahansafe\.com/,
    );
    expect(html).toContain('href="/how-it-works"');
    expect(source("components/marketing/mobile-navigation.tsx")).toContain(
      "SheetDescription",
    );
    expect(source("components/marketing/mobile-navigation.tsx")).toContain(
      "onClick={() => setOpen(false)}",
    );
  });
  it("keeps the existing product stations in place and provides working navigation targets", () => {
    for (const [component, id] of [
      ["QrThreeStepFlow", "how-it-works"],
      ["PlanPreview", "pricing"],
      ["ResourceStation", "resources"],
      ["TrustSecurityAvailability", "safety"],
    ]) {
      expect(source(`components/home/${component}.tsx`)).toContain(
        `id="${id}"`,
      );
    }
    expect(source("app/how-it-works/page.tsx")).toContain(
      "export default function HowItWorksPage",
    );
    expect(source("app/page.tsx")).toContain("overflow-x-clip");
  });
});
