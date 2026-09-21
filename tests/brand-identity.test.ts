import { describe, it, expect } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs";
import path from "node:path";
import * as Brand from "../packages/ui/src/brand";
import * as Ui from "../packages/ui/src";

const render = (component: React.ElementType, props = {}) =>
  renderToStaticMarkup(React.createElement(component, props));
const css = fs
  .readFileSync(
    path.resolve(__dirname, "../packages/ui/src/brand/brand-motion.css"),
    "utf8",
  )
  .replace(/\s+/g, " ");
const states = [
  "idle",
  "detecting",
  "scanning",
  "resolving",
  "identified",
  "error",
] as const;

describe("VaahanSafe SVG identity", () => {
  it("exports reusable components from both public entry points", () => {
    for (const name of [
      "VaahanSafeMark",
      "VaahanSafeLogo",
      "VaahanSafeAppIcon",
      "AnimatedVaahanSafeMark",
      "AnimatedVaahanSafeLogo",
      "VaahanSafeQrScanner",
      "VaahanSafeLoader",
      "VaahanSafeMicroLoader",
      "VaahanSafeIdentityPulse",
    ] as const) {
      expect(Brand[name]).toBeTypeOf("function");
      expect(Ui[name]).toBe(Brand[name]);
    }
  });
  it("renders four filled paths from canonical geometry with transparent cutouts", () => {
    const svg = render(Brand.VaahanSafeMark);
    expect(svg).toContain('viewBox="0 0 32 32"');
    expect(svg.match(/<path /g)).toHaveLength(4);
    for (const d of [
      Brand.ALL_CORNERS_PATH,
      Brand.VEHICLE_BODY_PATH,
      Brand.QR_FINDERS_PATH,
      Brand.QR_DATA_PATH,
    ])
      expect(svg).toContain(`d="${d}"`);
    expect(svg).toContain('fill-rule="evenodd"');
    expect(svg).not.toContain("stroke=");
  });
  it.each([16, 20, 24, 32, 48, 64, 128, 512])(
    "supports %ipx dimensions and uses solid identity cells at small sizes",
    (size) => {
      const svg = render(Brand.VaahanSafeMark, { size });
      expect(svg).toContain(`width="${size}" height="${size}"`);
      expect(svg).toContain(
        `d="${size <= 24 ? Brand.QR_COMPACT_PATH : Brand.QR_FINDERS_PATH}"`,
      );
    },
  );
  it("supports explicit favicon geometry independent of output size", () => {
    expect(
      render(Brand.VaahanSafeMark, { size: 128, isFavicon: true }),
    ).toContain(`d="${Brand.QR_COMPACT_PATH}"`);
  });
  it.each(["brand", "dark", "light", "mono"])(
    "renders the %s variant without changing geometry",
    (variant) => {
      const svg = render(Brand.VaahanSafeMark, { variant });
      expect(svg).toContain(`d="${Brand.VEHICLE_BODY_PATH}"`);
      const colors = Brand.markColors(variant as Brand.VaahanSafeMarkVariant);
      expect(svg).toContain(`fill="${colors.symbol}"`);
      expect(svg).toContain(`fill="${colors.frame}"`);
      if (variant === "mono") expect(svg).not.toMatch(/fill="#/);
    },
  );
  it("labels meaningful graphics and forwards className/custom accessible labels", () => {
    const svg = render(Brand.VaahanSafeMark, {
      title: "Vehicle safety",
      "aria-label": "VaahanSafe identity",
      className: "custom-brand",
    });
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label="VaahanSafe identity"');
    expect(svg).toContain("<title>Vehicle safety</title>");
    expect(svg).toContain("custom-brand");
  });
  it.each([true, "true"])(
    "hides decorative marks from assistive technology (%s)",
    (hidden) => {
      const svg = render(Brand.VaahanSafeMark, {
        "aria-hidden": hidden,
        "aria-label": "unused",
      });
      expect(svg).toContain('aria-hidden="true"');
      expect(svg).not.toContain("<title>");
      expect(svg).not.toContain("aria-label=");
      expect(svg).not.toContain("role=");
    },
  );
  it.each(["dark", "light"])(
    "uses canonical geometry inside the %s app icon",
    (variant) => {
      const html = render(Brand.VaahanSafeAppIcon, { variant, size: 64 });
      expect(html).toContain(`d="${Brand.VEHICLE_BODY_PATH}"`);
      expect(html).toContain(
        variant === "dark"
          ? Brand.BRAND_COLORS.dark
          : Brand.BRAND_COLORS.canvas,
      );
      expect(html.match(/role="img"/g)).toHaveLength(1);
      expect(html).toContain('aria-hidden="true"');
    },
  );
  it("spells VaahanSafe correctly as HTML and supports md, theme and stacked lockups", () => {
    const html = render(Brand.VaahanSafeLogo, {
      size: "md",
      theme: "dark",
      orientation: "stacked",
      showTagline: true,
      href: "/",
      className: "custom",
    });
    expect(html).toContain("Vaahan<span");
    expect(html).toContain(">Safe</span>");
    expect(html).toContain("vs-logo-stacked");
    expect(html).toContain("Vehicle safety identity");
    expect(html).toContain('href="/"');
    expect(html).toContain(Brand.BRAND_COLORS.canvas);
    expect(html).not.toContain("<text");
    expect(html).not.toContain("showTagline=");
  });
  it.each(["VaahanSafeMark", "VaahanSafeAppIcon", "VaahanSafeLogo"] as const)(
    "supports decorative %s",
    (name) => {
      expect(render(Brand[name], { "aria-hidden": true })).not.toContain(
        'role="img"',
      );
    },
  );
});

describe("Brand motion and state semantics", () => {
  it.each(["brand", "dark", "light", "mono"])(
    "renders the exact static %s mark when motion is disabled",
    (variant) => {
      const props = {
        size: 64,
        variant,
        className: "example",
        "aria-hidden": true,
      };
      const expected = render(Brand.VaahanSafeMark, props);
      expect(
        render(Brand.AnimatedVaahanSafeMark, { ...props, autoPlay: false }),
      ).toBe(expected);
      expect(
        render(Brand.AnimatedVaahanSafeMark, { ...props, reducedMotion: true }),
      ).toBe(expected);
    },
  );
  it("renders the exact static lockup for reduced motion or static playback", () => {
    const props = {
      size: "md",
      theme: "dark",
      showTagline: true,
      href: "/",
      orientation: "stacked",
    };
    const expected = render(Brand.VaahanSafeLogo, props);
    expect(
      render(Brand.AnimatedVaahanSafeLogo, { ...props, reducedMotion: true }),
    ).toBe(expected);
    expect(
      render(Brand.AnimatedVaahanSafeLogo, { ...props, autoPlay: false }),
    ).toBe(expected);
  });
  it("supports duration scaling without leaking implementation props onto SVG", () => {
    const html = render(Brand.AnimatedVaahanSafeMark, {
      size: 64,
      durationMs: 2200,
      isFavicon: true,
    });
    expect(html).toContain("--vs-reveal:2200ms");
    expect(html).not.toContain("isFavicon=");
    expect(html).not.toContain("durationMs=");
  });
  it.each(states)(
    "has concise accessible text and a synthetic target in scanner state %s",
    (state) => {
      const html = render(Brand.VaahanSafeQrScanner, {
        state,
        vehicleLabel: "Synthetic vehicle",
        errorMessage: "Try again",
      });
      expect(html).toContain(`data-state="${state}"`);
      expect(html).toContain(
        'role="status" aria-live="polite" aria-atomic="true"',
      );
      expect(html).toContain("Synthetic preview");
      expect(html).toContain(`d="${Brand.DEMO_QR_PATH}"`);
      if (state === "identified")
        expect(html).toContain("Vehicle identity recognized");
      if (state === "error") {
        expect(html).toContain("Try again");
        expect(html).toContain("! Identity unavailable");
      }
      expect(html.includes("vs-scanner-sweep")).toBe(state === "scanning");
    },
  );
  it("keeps scanning, resolving and confirmed identity separate", () => {
    expect(
      render(Brand.VaahanSafeQrScanner, { state: "scanning" }),
    ).not.toContain("Vehicle identity recognized");
    expect(render(Brand.VaahanSafeQrScanner, { state: "resolving" })).toContain(
      "Resolving VaahanSafe identity",
    );
    expect(css).toContain("vs-scan 480ms linear both");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain(
      '.vs-scanner[data-state="resolving"] .vs-scanner-qr { display: none; }',
    );
  });
  it("provides four-cell micro loading and quiet geometric pulse, without rotation or radar", () => {
    const micro = render(Brand.VaahanSafeMicroLoader, { size: 14 });
    expect(micro.match(/<path /g)).toHaveLength(4);
    expect(micro).toContain('aria-label="Loading"');
    for (const component of [
      Brand.VaahanSafeLoader,
      Brand.VaahanSafeMicroLoader,
      Brand.VaahanSafeIdentityPulse,
    ]) {
      const html = render(component, { reducedMotion: true });
      expect(html).toContain('data-reduced-motion="true"');
      expect(html).not.toMatch(/<circle|animate-spin|animate-ping/);
    }
    expect(css).not.toMatch(/rotate\(|scale\(1\.[1-9]|filter:|box-shadow:/);
  });
  it("uses one-shot reveal animations and reveals wordmark after the mark settles", () => {
    expect(css).toContain(
      "vs-wordmark var(--vs-wordmark) var(--vs-enter) var(--vs-reveal) both",
    );
    expect(Brand.BRAND_MOTION.reveal + Brand.BRAND_MOTION.wordmark).toBe(2120);
    expect(css.slice(0, css.indexOf(".vs-loader {"))).not.toContain("infinite");
  });
});

describe("Brand asset and data boundaries", () => {
  it("generated assets use canonical geometry and are current", async () => {
    const { assetSvg } =
      await import("../tooling/scripts/generate-brand-assets.mjs");
    for (const [file, props] of [
      ["vaahansafe-mark.svg", {}],
      ["vaahansafe-mark-mono.svg", { mono: true }],
      ["vaahansafe-app-icon.svg", { icon: true }],
      ["vaahansafe-app-icon-light.svg", { icon: true, light: true }],
      ["vaahansafe-favicon.svg", { icon: true, compact: true }],
    ] as const)
      expect(
        fs.readFileSync(
          path.resolve(__dirname, `../apps/web/public/brand/${file}`),
          "utf8",
        ),
      ).toBe(assetSvg(props));
  });
  it("contains no raster/external SVG resources, icon libraries, customer credentials or provider calls", () => {
    const dir = path.resolve(__dirname, "../packages/ui/src/brand");
    const sources = fs
      .readdirSync(dir)
      .filter((file) => /\.(tsx?|css)$/.test(file))
      .map((file) => fs.readFileSync(path.join(dir, file), "utf8"))
      .join("\n");
    expect(sources).not.toMatch(
      /<image|<foreignObject|<use\b|data:image|https?:\/\/(?!www\.w3\.org)|from ["'](?:lucide|@heroicons|framer-motion|gsap|lottie|@vaahansafe\/qr-core)/,
    );
    expect(sources).not.toMatch(
      /fetch\(|Cashfree|MSG91|activationSecret|scratchSecret|publicId|queryD1/,
    );
    expect(sources).not.toContain("Honda City");
  });
});

describe("Existing homepage dark theme parity", () => {
  for (const file of [
    "PhysicalStickerAnatomy",
    "EmergencyScanPreview",
    "RetailActivationPreview",
    "PlanPreview",
    "PrivacyProjection",
    "PlacementGalleryPreview",
    "TrustSecurityAvailability",
    "ResourceStation",
    "HomepageFaq",
  ]) {
    it(`${file} retains dark surface, border and text tokens`, () => {
      const source = fs.readFileSync(
        path.resolve(__dirname, `../apps/web/components/home/${file}.tsx`),
        "utf8",
      );
      expect(source).toContain("dark:");
    });
  }
});
