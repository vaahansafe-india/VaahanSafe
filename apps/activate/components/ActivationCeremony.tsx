"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";

import { ActivationHeader } from "./shell/ActivationHeader";
import { ActivationFooter } from "./shell/ActivationFooter";
import { IdentityBindingRail } from "./progress/IdentityBindingRail";
import { ActivationStageArtwork, ActivationVisualGuide } from "./ActivationVisuals";

import { RecognizeQr } from "./recognize/RecognizeQr";
import { VerifyPhysicalQr } from "./verify/VerifyPhysicalQr";
import { ActivationAuth } from "./identity/ActivationAuth";
import { VehicleSelector } from "./vehicle/VehicleSelector";
import { ActivationReview } from "./review/ActivationReview";
import { ActivationSuccess } from "./result/ActivationSuccess";

import type {
  ActivationStage,
  ActivationSessionDto,
  ActivationSessionUserDto,
  EligibleVehicleDto,
  ActivationCommitResultDto,
} from "@/lib/types";

interface ActivationCeremonyProps {
  initialPublicId?: string;
}

const STAGE_META: Record<
  ActivationStage,
  {
    step: number;
    label: string;
  }
> = {
  RECOGNIZE: {
    step: 1,
    label: "Scan QR Sticker",
  },
  VERIFY: {
    step: 2,
    label: "Scratch Security Code",
  },
  IDENTITY: {
    step: 3,
    label: "Verify Mobile Number",
  },
  VEHICLE: {
    step: 4,
    label: "Select Vehicle",
  },
  REVIEW: {
    step: 5,
    label: "Confirm Activation",
  },
  ACTIVE: {
    step: 5,
    label: "QR Active",
  },
};

export function ActivationCeremony({
  initialPublicId = "",
}: ActivationCeremonyProps) {
  const [stage, setStage] = useState<ActivationStage>("RECOGNIZE");
  const [publicId, setPublicId] = useState(initialPublicId);

  /**
   * IMPORTANT:
   * This value must only contain a safe display/reference code.
   * Never store or render the actual activation secret here.
   */
  const [visibleCode, setVisibleCode] = useState("");

  const [user, setUser] =
    useState<ActivationSessionUserDto | null>(null);

  const [selectedVehicle, setSelectedVehicle] =
    useState<EligibleVehicleDto | null>(null);

  const [activationResult, setActivationResult] =
    useState<ActivationCommitResultDto | null>(null);

  const stageHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const restoredSession = useRef(false);

  const sessionQuery = useQuery<ActivationSessionDto>({
    queryKey: ["activation", "session"],
    queryFn: async ({ signal }) => {
      const response = await fetch("/api/activate/session", {
        cache: "no-store",
        credentials: "include",
        headers: { Accept: "application/json" },
        signal,
      });
      if (!response.ok) throw new Error("ACTIVATION_SESSION_UNAVAILABLE");
      return response.json() as Promise<ActivationSessionDto>;
    },
  });
  const isInitializing = sessionQuery.isPending;
  const initializationError = sessionQuery.isError;
  const retrySession = sessionQuery.refetch;

  const stageMeta = STAGE_META[stage];

  const selectedVehicleDisplay = useMemo(() => {
    if (!selectedVehicle) return undefined;

    return [selectedVehicle.make, selectedVehicle.model]
      .filter(Boolean)
      .join(" ");
  }, [selectedVehicle]);

  /**
   * Restore only server-authoritative activation state.
   */
  useEffect(() => {
    const data = sessionQuery.data;
    if (!data || restoredSession.current) return;
    restoredSession.current = true;
    setUser(data.user);
    if (data.challenge?.valid) {
      setPublicId(data.challenge.publicId);
      setVisibleCode(data.challenge.visibleCode ?? "");
      setStage(!data.user?.phoneVerified ? "IDENTITY" : "VEHICLE");
    }
  }, [sessionQuery.data]);

  /**
   * Move keyboard/screen-reader context to the newly rendered stage.
   */
  useEffect(() => {
    if (isInitializing || initializationError) return;

    const frame = requestAnimationFrame(() => {
      stageHeadingRef.current?.focus({
        preventScroll: true,
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [stage, isInitializing, initializationError]);

  const handleRecognized = useCallback((id: string, code?: string) => {
    setPublicId(id);

    // `code` must be display-safe, never the activation secret.
    setVisibleCode(code ?? "");

    setStage("VERIFY");
  }, []);

  const handleProofVerified = useCallback(() => {
    if (user?.phoneVerified) {
      setStage("VEHICLE");
      return;
    }

    setStage("IDENTITY");
  }, [user]);

  const handleAuthenticated = useCallback(
    (authUser: ActivationSessionUserDto) => {
      setUser(authUser);

      /**
       * `ActivationAuth` should call this only after all required
       * identity/mobile verification for this stage is complete.
       */
      if (authUser.phoneVerified) {
        setStage("VEHICLE");
      } else {
        setStage("IDENTITY");
      }
    },
    [],
  );

  const handleVehicleSelected = useCallback(
    (vehicle: EligibleVehicleDto) => {
      setSelectedVehicle(vehicle);
      setStage("REVIEW");
    },
    [],
  );

  const handleActivated = useCallback(
    (result: ActivationCommitResultDto) => {
      setActivationResult(result);
      setStage("ACTIVE");
    },
    [],
  );

  const handleRetryInitialization = useCallback(() => {
    void retrySession();
  }, [retrySession]);

  function renderCurrentStage() {
    switch (stage) {
      case "RECOGNIZE":
        return (
          <RecognizeQr
            initialPublicId={publicId}
            onRecognized={handleRecognized}
          />
        );

      case "VERIFY":
        return (
          <VerifyPhysicalQr
            publicId={publicId}
            visibleCode={visibleCode}
            onProofVerified={handleProofVerified}
            onResetToRecognize={() => setStage("RECOGNIZE")}
          />
        );

      case "IDENTITY":
        return (
          <ActivationAuth
            onAuthenticated={handleAuthenticated}
          />
        );

      case "VEHICLE":
        return (
          <VehicleSelector
            onVehicleSelected={handleVehicleSelected}
          />
        );

      case "REVIEW":
        if (!selectedVehicle) {
          return (
            <StageIntegrityError
              onRecover={() => setStage("VEHICLE")}
            />
          );
        }

        return (
          <ActivationReview
            publicId={publicId}
            visibleCode={visibleCode}
            vehicle={selectedVehicle}
            onActivated={handleActivated}
            onChangeVehicle={() => setStage("VEHICLE")}
          />
        );

      case "ACTIVE":
        return (
          <ActivationSuccess
            publicId={publicId}
            visibleCode={activationResult?.visibleCode}
            vehicleReference={activationResult?.vehicleReference}
            activatedAt={activationResult?.activatedAt}
          />
        );

      default:
        return null;
    }
  }

  return (
    <div className="activation-app flex min-h-dvh flex-col text-foreground">
      <ActivationHeader user={user} />
      <main id="main-content" className="activation-main flex-1">
        <div className="activation-frame">
          {isInitializing ? (
            <ActivationInitializing />
          ) : initializationError ? (
            <ActivationInitializationError
              onRetry={handleRetryInitialization}
            />
          ) : (
            <>
              <header className="activation-hero">
                <div className="activation-hero-copy">
                  <p className="activation-kicker"><span>01 / 05</span> Retail QR activation</p>
                  <h1 className="activation-hero-title">A small sticker.<br /><em>A safer journey.</em></h1>
                  <p className="activation-hero-description">
                    Connect your physical VaahanSafe QR to a vehicle you own. Each step is verified before its safety services become available.
                  </p>
                </div>
                <figure className="activation-hero-figure">
                  <Image
                    src="/images/qr-kit-transparent.webp"
                    alt="VaahanSafe sticker kit with a QR card and separate scratch proof card"
                    width={1400}
                    height={933}
                    sizes="(max-width: 640px) 300px, (max-width: 860px) 360px, 530px"
                    className="activation-kit-image"
                    priority
                  />
                  <figcaption><span>Kit illustration · use your own sticker.</span><span>The scratch code proves possession.</span></figcaption>
                </figure>
              </header>

              <nav className="activation-progress" aria-label="Activation progress">
                <div className="activation-progress-heading">
                  <span className="activation-kicker">Your activation path</span>
                  <span className="activation-progress-current">Step {stageMeta.step} of 5 · {stageMeta.label}</span>
                </div>
                <IdentityBindingRail
                  variant="compact"
                  currentStage={stage}
                  recognizedCode={visibleCode}
                  selectedVehicleRef={selectedVehicleDisplay}
                />
              </nav>

              <div className="activation-stage-layout">
                <section className="activation-stage-content">
                  <div className="activation-section-number">{String(stageMeta.step).padStart(2, "0")} <span>/</span> 05</div>
                  <h2
                    ref={stageHeadingRef}
                    tabIndex={-1}
                    className="sr-only outline-none"
                  >
                    Activation step {stageMeta.step}: {stageMeta.label}
                  </h2>
                  <div className="activation-stage-inner">
                    {renderCurrentStage()}
                  </div>
                </section>
                <aside className="activation-stage-aside" aria-label="Activation guidance">
                  <ActivationStageArtwork stage={stage} />
                  <p className="activation-kicker">Why this matters</p>
                  <h2 className="font-serif text-3xl leading-tight">Your details stay yours.</h2>
                  <p>A scan shares only the safety view you approve. Your mobile number and activation code stay private.</p>
                  {(visibleCode || selectedVehicleDisplay) && (
                    <dl className="activation-linked-details">
                      {visibleCode && <><dt>Sticker ID</dt><dd>{visibleCode}</dd></>}
                      {selectedVehicleDisplay && <><dt>Vehicle</dt><dd>{selectedVehicleDisplay}</dd></>}
                    </dl>
                  )}
                  <div className="activation-aside-rule" />
                  <span className="activation-aside-caption">The QR identifies the sticker. The scratch proof verifies possession. Your account connects it to a vehicle.</span>
                </aside>
              </div>
              <ActivationVisualGuide />
            </>
          )}
        </div>
      </main>

      <ActivationFooter />
    </div>
  );
}

function ActivationInitializing() {
  return (
    <section
      aria-live="polite"
      aria-busy="true"
      className="
        flex min-h-[55dvh] items-center
        py-16
        sm:min-h-[58dvh]
        lg:min-h-[62dvh]
      "
    >
      <div className="w-full max-w-xl">
        <div className="mb-7 flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Session / Restore
          </span>

          <span className="h-px w-12 bg-border" />
        </div>

        <div
          aria-hidden="true"
          className="mb-8 flex max-w-sm items-center"
        >
          <span className="size-2.5 bg-foreground" />

          <span className="relative h-px flex-1 overflow-hidden bg-border">
            <span
              className="
                absolute inset-y-0 left-0 w-1/2
                bg-primary
                motion-safe:animate-[activationRail_1.8s_ease-in-out_infinite]
                motion-reduce:animate-none
              "
            />
          </span>

          <span className="size-2.5 border border-border bg-background" />
        </div>

        <h1 className="max-w-lg font-serif text-[clamp(2.5rem,7vw,5rem)] leading-[0.92] tracking-[-0.035em]">
          Restoring activation context.
        </h1>

        <p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground sm:text-[15px]">
          Checking the secure activation session before continuing.
        </p>
      </div>
    </section>
  );
}

function ActivationInitializationError({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <section
      role="alert"
      className="flex min-h-[55dvh] items-center py-16 lg:min-h-[62dvh]"
    >
      <div className="w-full max-w-2xl">
        <div className="mb-7 flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-destructive">
            Session / Interrupted
          </span>

          <span className="h-px w-12 bg-destructive/35" />
        </div>

        <div
          aria-hidden="true"
          className="mb-8 flex max-w-md items-center"
        >
          <span className="size-2.5 bg-foreground" />
          <span className="h-px flex-1 bg-border" />

          <span className="flex size-5 items-center justify-center font-mono text-sm text-destructive">
            ×
          </span>

          <span className="h-px flex-1 bg-border/45" />
          <span className="size-2.5 border border-border bg-background" />
        </div>

        <h1 className="max-w-xl font-serif text-[clamp(2.6rem,7vw,5.4rem)] leading-[0.9] tracking-[-0.04em]">
          We couldn&apos;t restore this activation.
        </h1>

        <p className="mt-6 max-w-md text-sm leading-6 text-muted-foreground sm:text-[15px]">
          Check your connection and try restoring the secure activation
          session.
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="
            mt-8 inline-flex min-h-11 items-center justify-center
            rounded-sm bg-primary px-6
            text-sm font-semibold text-primary-foreground
            transition-opacity hover:opacity-90
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-ring
            focus-visible:ring-offset-2
            focus-visible:ring-offset-background
          "
        >
          Retry
        </button>
      </div>
    </section>
  );
}

function StageIntegrityError({
  onRecover,
}: {
  onRecover: () => void;
}) {
  return (
    <section role="alert" className="max-w-xl py-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-destructive">
        Binding / Incomplete
      </p>

      <h1 className="mt-5 font-serif text-4xl leading-[0.95] tracking-tight sm:text-5xl">
        Select a vehicle before reviewing the connection.
      </h1>

      <p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground">
        The activation has not been committed. Return to vehicle selection
        to continue.
      </p>

      <button
        type="button"
        onClick={onRecover}
        className="
          mt-7 min-h-11 rounded-sm bg-primary
          px-6 text-sm font-semibold text-primary-foreground
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-ring focus-visible:ring-offset-2
        "
      >
        Select vehicle
      </button>
    </section>
  );
}
