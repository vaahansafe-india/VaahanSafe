import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { WhatIsVaahanSafe } from "../apps/web/components/home/WhatIsVaahanSafe";
import { QrThreeStepFlow } from "../apps/web/components/home/QrThreeStepFlow";
import { SafetyProjection } from "../apps/web/components/home/identity-primitives";
import { HOMEPAGE_DEMO_DATA } from "../apps/web/lib/demo/homepage-demo";
import { DEMO_QR_PATH, VEHICLE_BODY_PATH } from "../packages/ui/src/brand";

const render = (component: React.ComponentType) =>
  renderToStaticMarkup(React.createElement(component));
const css = fs
  .readFileSync(
    path.resolve(
      __dirname,
      "../apps/web/components/home/identity-story.module.css",
    ),
    "utf8",
  )
  .replace(/\s+/g, " ");

describe("Public physical-to-safety identity journey", () => {
  it("keeps the identity between the physical world and controlled public view", () => {
    const html = render(WhatIsVaahanSafe);
    const physical = html.indexOf(">Physical vehicle<");
    const identity = html.indexOf(">VaahanSafe identity<");
    const projection = html.indexOf(">Controlled safety view<");
    expect(physical).toBeGreaterThan(-1);
    expect(identity).toBeGreaterThan(physical);
    expect(projection).toBeGreaterThan(identity);
    expect(html).toContain("ACTIVE");
    expect(html).toContain("Demo identity");
    expect(html).toContain("The VaahanSafe QR gives the physical vehicle");
    expect(html).toContain('aria-labelledby="what-is-vaahansafe-title"');
  });
  it("explains PLACE, SCAN, CONNECT in order without making unverified placement or timing claims", () => {
    const html = render(QrThreeStepFlow);
    expect(html.indexOf("01 / PLACE")).toBeLessThan(html.indexOf("02 / SCAN"));
    expect(html.indexOf("02 / SCAN")).toBeLessThan(
      html.indexOf("03 / CONNECT"),
    );
    expect(html).toContain("following the placement guidance");
    expect(html).toContain("with their phone");
    expect(html).toContain("contact options you selected");
    expect(html).not.toMatch(
      /visor|weather.sealed|durable|zero.latency|instant|guarantee/i,
    );
    expect(html).toContain(`d="${DEMO_QR_PATH}"`);
    expect(html).toContain("Illustrative QR · demo only");
  });
  it("provides an informative safety preview without a pretend contact action or real record", () => {
    const html = render(SafetyProjection);
    expect(html).toContain(HOMEPAGE_DEMO_DATA.hero.visibleCode);
    expect(html).toContain("Demo Vehicle");
    expect(html).toContain("Safety information");
    expect(html).toContain("Contact options");
    expect(html).toContain("Owner-controlled view");
    expect(html).not.toMatch(
      /<button|<a |<input|<form|tel:|\+91|bloodGroup|O\+|Honda|DL 01/i,
    );
  });
  it.each([WhatIsVaahanSafe, QrThreeStepFlow])(
    "keeps public sections free of backend details, real QR payloads and unsupported guarantees",
    (component) => {
      const html = render(component);
      expect(html).not.toMatch(
        /Cloudflare|\bD1\b|\bR2\b|Worker|Queue|database|webhook|ledger|edge resolver|cryptographic|monorepo|100%|#1|certified|guaranteed|trusted by|data:image|https?:\/\/(?!www\.w3\.org)/i,
      );
      expect(html.match(/<h2 /g)).toHaveLength(1);
      expect(html).not.toContain("<h1");
    },
  );
  it("keeps the story understandable without client effects or scroll-triggered rendering", () => {
    for (const name of [
      "WhatIsVaahanSafe",
      "QrThreeStepFlow",
      "identity-primitives",
    ]) {
      const source = fs.readFileSync(
        path.resolve(__dirname, `../apps/web/components/home/${name}.tsx`),
        "utf8",
      );
      expect(source).not.toMatch(
        /"use client"|useEffect|IntersectionObserver|fetch\(|setInterval|setTimeout/,
      );
    }
    expect(css).toContain("journey-scan 480ms linear 650ms both");
    expect(css).not.toMatch(/infinite|blur\(|filter:/);
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });
  it("restructures both rails vertically and stacks narrow safety fields while preserving both themes", () => {
    expect(css).toContain("@media (max-width: 640px)");
    expect(css).toContain(":global(.dark) .section");
    expect(css).toContain("--story-muted: #a1a1aa");
    expect(css).toContain("--story-sheet: #18181b");
  });
});
