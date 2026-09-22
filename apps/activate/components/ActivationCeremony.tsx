"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { ActivationHeader } from "./shell/ActivationHeader";
import { ActivationFooter } from "./shell/ActivationFooter";
import { IdentityBindingRail } from "./progress/IdentityBindingRail";
import { ActivationGrid } from "./visual-system/ActivationGrid";

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

  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState(false);

  const stageHeadingRef = useRef<HTMLHeadingElement | null>(null);

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
  const restoreSession = useCallback(async (signal?: AbortSignal) => {
    setInitializationError(false);

    try {
      const res = await fetch("/api/activate/session", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
        signal,
      });

      if (!res.ok) {
        throw new Error("ACTIVATION_SESSION_UNAVAILABLE");
      }

      const data: ActivationSessionDto = await res.json();

      if (signal?.aborted) return;

      if (data.user) {
        setUser(data.user);
      }

      if (data.challenge?.valid) {
        setPublicId(data.challenge.publicId);

        /**
         * Only safe if visibleCode is explicitly a public/display reference.
         */
        setVisibleCode(data.challenge.visibleCode ?? "");

        if (!data.user || !data.user.phoneVerified) {
          setStage("IDENTITY");
        } else {
          setStage("VEHICLE");
        }
      }
    } catch (error) {
      if (signal?.aborted) return;

      /**
       * Replace this with your existing safe observability service.
       * Never log OTPs, activation secrets or challenge payloads.
       */
      console.warn(
        "[VaahanSafe Activate] Activation session restoration failed.",
      );

      setInitializationError(true);
    } finally {
      if (!signal?.aborted) {
        setIsInitializing(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void restoreSession(controller.signal);

    return () => controller.abort();
  }, [restoreSession]);

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
    setIsInitializing(true);
    setInitializationError(false);

    void restoreSession();
  }, [restoreSession]);

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
    <div className="relative isolate flex min-h-dvh flex-col overflow-x-clip bg-background text-foreground">
      {/* Decorative, deterministic, stage-aware topology */}
      <ActivationGrid stage={stage} />

      <ActivationHeader user={user} />

      <main
        id="main-content"
        className="
          relative z-10 flex-1
          px-3.5 pb-12 pt-20
          sm:px-6 sm:pb-14 sm:pt-24
          md:px-10
          lg:px-14 lg:pb-16 lg:pt-28
          xl:px-20
          2xl:px-24
        "
      >
        <div className="mx-auto w-full max-w-[1600px]">
          {isInitializing ? (
            <ActivationInitializing />
          ) : initializationError ? (
            <ActivationInitializationError
              onRetry={handleRetryInitialization}
            />
          ) : (
            <>
              {/* Mobile / Tablet context */}
              <div className="mb-6 lg:hidden">
                <MobileStageContext
                  stage={stage}
                  step={stageMeta.step}
                  stageLabel={stageMeta.label}
                />

                <div className="mt-4">
                  <IdentityBindingRail
                    variant="compact"
                    currentStage={stage}
                    recognizedCode={visibleCode}
                    selectedVehicleRef={selectedVehicleDisplay}
                  />
                </div>
              </div>

              {/* Main activation workstation */}
              <div
                className="
                  grid min-w-0 grid-cols-1
                  lg:grid-cols-[minmax(0,1.45fr)_minmax(48px,.15fr)_minmax(300px,.75fr)]
                  xl:grid-cols-[minmax(0,1.5fr)_minmax(64px,.18fr)_minmax(340px,.72fr)]
                  2xl:grid-cols-[minmax(0,1.55fr)_80px_minmax(360px,.7fr)]
                "
              >
                {/* Primary interaction */}
                <section className="relative w-full min-w-0">
                  {/* Desktop Step Indicator */}
                  <div className="mb-6 hidden lg:flex lg:items-center lg:gap-3">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 font-mono text-xs font-semibold text-primary">
                      Step {stageMeta.step} of 5
                    </span>

                    <span
                      aria-hidden="true"
                      className="h-px w-6 bg-border"
                    />

                    <span className="text-xs font-medium text-muted-foreground">
                      {stageMeta.label}
                    </span>
                  </div>

                  {/*
                    Accessible stage anchor.
                    Individual child screens keep their own visible H1.
                  */}
                  <h2
                    ref={stageHeadingRef}
                    tabIndex={-1}
                    className="sr-only outline-none"
                  >
                    Activation step {stageMeta.step}: {stageMeta.label}
                  </h2>

                  <div className="relative w-full max-w-full lg:max-w-[760px]">
                    {renderCurrentStage()}
                  </div>
                </section>

                {/* Subtle vertical divider between form and progress rail */}
                <div
                  aria-hidden="true"
                  className="relative hidden lg:flex lg:justify-center"
                >
                  <div className="h-full w-px bg-border/40" />
                </div>

                {/* Activation progress panel */}
                <aside
                  aria-label="Activation progress"
                  className="
                    relative hidden min-w-0
                    lg:block
                    lg:sticky lg:top-24
                    lg:self-start
                  "
                >
                  <div className="mb-5 flex items-center justify-between gap-4 border-b border-border/50 pb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Activation Steps
                    </span>

                    <span className="font-mono text-xs font-semibold text-primary">
                      Step {stageMeta.step} of 5
                    </span>
                  </div>

                  <IdentityBindingRail
                    variant="rail"
                    currentStage={stage}
                    recognizedCode={visibleCode}
                    selectedVehicleRef={selectedVehicleDisplay}
                  />
                </aside>
              </div>
            </>
          )}
        </div>
      </main>

      <div className="relative z-20">
        <ActivationFooter />
      </div>
    </div>
  );
}

function MobileStageContext({
  step,
  stageLabel,
}: {
  stage: ActivationStage;
  step: number;
  stageLabel: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-primary">
        Step {step} of 5
      </span>

      <span
        aria-hidden="true"
        className="h-px min-w-4 flex-1 bg-border/60"
      />

      <span className="truncate text-xs font-medium text-muted-foreground">
        {stageLabel}
      </span>
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
            rounded-md bg-primary px-6
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
          mt-7 min-h-11 rounded-md bg-primary
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
