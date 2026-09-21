"use client";
import * as React from "react";
import {
  VaahanSafeMark,
  VaahanSafeLogo,
  VaahanSafeAppIcon,
  AnimatedVaahanSafeMark,
  AnimatedVaahanSafeLogo,
  VaahanSafeQrScanner,
  VaahanSafeLoader,
  VaahanSafeMicroLoader,
  VaahanSafeIdentityPulse,
  BRAND_COLORS,
  ALL_CORNERS_PATH,
  QR_FINDERS_PATH,
  QR_DATA_PATH,
  VEHICLE_BODY_PATH,
  type VaahanSafeQrScannerState,
} from "@vaahansafe/ui/brand";
import { Button } from "@vaahansafe/ui/components";

const stages = [
  "Identity begins",
  "Frame connects",
  "QR builds",
  "Identity scanned",
  "Vehicle recognized",
  "VaahanSafe",
];
const scannerStates: VaahanSafeQrScannerState[] = [
  "idle",
  "detecting",
  "scanning",
  "resolving",
  "identified",
  "error",
];

/** Developer showcase. Synthetic examples never grant or imply production activation. */
export function BrandShowcase() {
  const [replay, setReplay] = React.useState(0);
  const [staticMode, setStaticMode] = React.useState(false);
  const [reduced, setReduced] = React.useState(false);
  const [dark, setDark] = React.useState(true);
  const [scanner, setScanner] =
    React.useState<VaahanSafeQrScannerState>("idle");
  const [demoRun, setDemoRun] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  React.useEffect(() => {
    if (!running) return;
    setScanner("idle");
    const timers = [
      setTimeout(() => setScanner("detecting"), 200),
      setTimeout(() => setScanner("scanning"), 520),
      setTimeout(() => setScanner("resolving"), 1000),
      setTimeout(() => {
        setScanner("identified");
        setRunning(false);
      }, 1480),
    ];
    return () => timers.forEach(clearTimeout);
  }, [running, demoRun]);

  return (
    <div className="space-y-10" data-reduced-motion={reduced || undefined}>
      <section className="grid gap-8 rounded-3xl border border-border bg-background p-6 sm:p-10 lg:grid-cols-[1fr_1.6fr]">
        <div className="flex items-center justify-center rounded-3xl bg-muted p-8">
          <VaahanSafeAppIcon size={220} variant="dark" bordered={false} />
        </div>
        <div className="flex flex-col justify-center gap-6">
          <span className="text-xs uppercase tracking-[.22em] text-muted-foreground">
            Vehicle · Identity · Safety
          </span>
          <VaahanSafeLogo size="xl" showTagline />
          <p className="max-w-md text-lg leading-relaxed text-muted-foreground">
            Your vehicle has an identity.
            <br />
            Make it useful when it matters.
          </p>
          <div className="flex flex-wrap gap-4">
            {(
              ["coral", "ink", "canvas", "surface", "amber", "teal"] as const
            ).map((name) => (
              <div key={name} className="space-y-2 text-center text-[10px]">
                <span
                  className="mx-auto block h-9 w-9 rounded-full border border-border"
                  style={{ background: BRAND_COLORS[name] }}
                />
                <span className="block capitalize">{name}</span>
                <span className="block font-mono text-muted-foreground">
                  {BRAND_COLORS[name]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        aria-label="Identity reveal storyboard"
        className="grid grid-cols-2 gap-3 rounded-3xl bg-[#09090b] p-5 text-[#fafafa] sm:grid-cols-3 lg:grid-cols-6"
      >
        {stages.map((label, index) => (
          <div key={label} className="space-y-3 text-center">
            <div className="flex aspect-square items-center justify-center rounded-2xl border border-[#3f3f46] bg-[#09090b] p-4">
              <svg
                viewBox="0 0 32 32"
                className="w-full max-w-[100px]"
                aria-hidden="true"
              >
                {index === 0 ? (
                  <rect
                    x="15"
                    y="15"
                    width="2"
                    height="2"
                    rx=".5"
                    fill={BRAND_COLORS.coral}
                  />
                ) : (
                  <>
                    <path d={ALL_CORNERS_PATH} fill={BRAND_COLORS.coral} />
                    {index >= 4 && (
                      <path
                        d={VEHICLE_BODY_PATH}
                        fill={BRAND_COLORS.canvas}
                        fillRule="evenodd"
                      />
                    )}
                    {index >= 2 && (
                      <g
                        transform={index < 4 ? "translate(0 -6)" : undefined}
                        fill={BRAND_COLORS.canvas}
                        fillRule="evenodd"
                      >
                        <path d={QR_FINDERS_PATH} />
                        <path d={QR_DATA_PATH} />
                      </g>
                    )}
                    {index === 3 && (
                      <rect
                        x="8"
                        y="16"
                        width="16"
                        height=".6"
                        fill={BRAND_COLORS.coral}
                      />
                    )}
                  </>
                )}
              </svg>
            </div>
            <span className="block font-mono text-[10px] text-[#a1a1aa]">
              0{index + 1}
            </span>
            <span className="block text-[11px] uppercase tracking-wider">
              {label}
            </span>
          </div>
        ))}
      </section>

      <section className="space-y-5" aria-labelledby="motion-title">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="motion-title" className="text-2xl font-semibold">
              Identity, revealed.
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              One calm sequence. A single scan. The exact static mark.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStaticMode(false);
                setReplay((k) => k + 1);
              }}
            >
              Replay
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-pressed={staticMode}
              onClick={() => setStaticMode((s) => !s)}
            >
              Static
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-pressed={reduced}
              onClick={() => setReduced((s) => !s)}
            >
              Reduced Motion
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-pressed={!dark}
              onClick={() => setDark((s) => !s)}
            >
              {dark ? "Light Background" : "Dark Background"}
            </Button>
          </div>
        </div>
        <div
          data-testid="brand-motion-player"
          className="grid min-h-[240px] items-center gap-8 rounded-3xl border border-border p-8 sm:grid-cols-2"
          style={{
            background: dark ? BRAND_COLORS.dark : BRAND_COLORS.canvas,
            color: dark ? BRAND_COLORS.canvas : BRAND_COLORS.ink,
          }}
        >
          <div className="flex justify-center">
            <AnimatedVaahanSafeMark
              key={`mark-${replay}`}
              size={128}
              variant={dark ? "dark" : "light"}
              autoPlay={!staticMode}
              reducedMotion={reduced}
            />
          </div>
          <div className="flex justify-center">
            <AnimatedVaahanSafeLogo
              key={`logo-${replay}`}
              size="lg"
              orientation="stacked"
              theme={dark ? "dark" : "light"}
              autoPlay={!staticMode}
              reducedMotion={reduced}
            />
          </div>
        </div>
      </section>

      <section className="grid items-start gap-6 lg:grid-cols-2">
        <div className="space-y-5 rounded-3xl border border-border bg-background p-6">
          <div>
            <h2 className="text-xl font-semibold">QR → vehicle identity</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A synthetic visual preview. Product state comes from your
              application.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {scannerStates.map((state) => (
              <Button
                key={state}
                variant="outline"
                size="sm"
                aria-pressed={scanner === state}
                onClick={() => {
                  setRunning(false);
                  setScanner(state);
                }}
              >
                {state}
              </Button>
            ))}
          </div>
          <div className="flex justify-center">
            <VaahanSafeQrScanner
              key={demoRun}
              state={scanner}
              vehicleLabel="Demo vehicle · synthetic identity"
              reducedMotion={reduced}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setDemoRun((k) => k + 1);
              setRunning(true);
            }}
          >
            Play QR → vehicle demo
          </Button>
        </div>
        <div className="space-y-6 rounded-3xl border border-border bg-background p-6">
          <h2 className="text-xl font-semibold">Quiet, useful motion</h2>
          <div className="flex min-h-[120px] justify-center rounded-2xl bg-card p-6">
            <VaahanSafeLoader reducedMotion={reduced} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card p-5">
            <span className="text-sm">Saving identity</span>
            <VaahanSafeMicroLoader size={16} reducedMotion={reduced} />
          </div>
          <div className="flex flex-wrap items-center gap-5">
            {(["idle", "resolving", "active"] as const).map((status) => (
              <span key={status} className="flex items-center gap-2 text-xs">
                <VaahanSafeIdentityPulse
                  status={status}
                  reducedMotion={reduced}
                />
                {status}
              </span>
            ))}
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Reduced motion shows discrete states immediately. Emergency
            information never waits for brand animation.
          </p>
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="scale-title">
        <h2 id="scale-title" className="text-xl font-semibold">
          Every scale. Every surface.
        </h2>
        <div className="flex flex-wrap items-end gap-6 rounded-3xl border border-border bg-background p-6">
          {[16, 20, 24, 32, 48, 64, 128].map((size) => (
            <div key={size} className="space-y-3 text-center">
              <VaahanSafeMark size={size} />
              <span className="block font-mono text-[10px] text-muted-foreground">
                {size}px
              </span>
            </div>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="flex min-h-[140px] items-center justify-center rounded-2xl border border-border bg-background text-foreground">
            <VaahanSafeMark
              size={64}
              variant="mono"
              aria-label="Black monochrome mark"
            />
          </div>
          <div className="flex min-h-[140px] items-center justify-center rounded-2xl bg-[#09090b] text-[#fafafa]">
            <VaahanSafeMark
              size={64}
              variant="mono"
              aria-label="White monochrome mark"
            />
          </div>
          <div className="flex min-h-[140px] items-center justify-center rounded-2xl bg-card">
            <VaahanSafeAppIcon size={80} variant="light" />
          </div>
          <div className="flex min-h-[140px] items-center justify-center rounded-2xl bg-card">
            <VaahanSafeAppIcon size={80} variant="dark" />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-background p-6 text-sm">
          <span className="mr-6 inline-block align-middle">
            <VaahanSafeMark
              size={48}
              style={{ width: "12mm", height: "12mm" }}
            />
          </span>
          12 mm print proof · Keep brand artwork outside the functional QR quiet
          zone.
        </div>
      </section>
    </div>
  );
}
