import * as React from "react";

import { VaahanIcon } from "@vaahansafe/icons";
import { VaahanSafeMark } from "@vaahansafe/ui/brand";

import {
  DemoScan,
  IdentityLabel,
  IdentityPoint,
  SafetyProjection,
  SectionIndex,
} from "./identity-primitives";

import styles from "./identity-story.module.css";

const steps = [
  {
    number: "01",
    verb: "PLACE",
    title: "Give VaahanSafe a visible place.",
    description:
      "Place the VaahanSafe QR on your vehicle in an appropriate position, following the placement guidance.",
    micro: "Physical vehicle",
  },
  {
    number: "02",
    verb: "SCAN",
    title: "A scan opens the vehicle identity.",
    description:
      "Someone scans the QR with their phone to open the vehicle’s VaahanSafe safety view.",
    micro: "QR identity",
  },
  {
    number: "03",
    verb: "CONNECT",
    title: "The useful information comes forward.",
    description:
      "The supported safety information and contact options you selected can help someone take the next step.",
    micro: "Controlled safety view",
  },
] as const;

export function QrThreeStepFlow() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className={[styles.section, styles.howJourney].join(" ")}
    >
      {/* ============================================================ */}
      {/* AMBIENT IDENTITY GEOMETRY                                    */}
      {/* ============================================================ */}

      <div className={styles.journeyAtmosphere} aria-hidden="true">
        <span className={styles.journeyOrbitLarge} />
        <span className={styles.journeyOrbitSmall} />

        <span
          className={[
            styles.journeyCoordinate,
            styles.journeyCoordinateLeft,
          ].join(" ")}
        >
          PHYSICAL / DIGITAL
        </span>

        <span
          className={[
            styles.journeyCoordinate,
            styles.journeyCoordinateRight,
          ].join(" ")}
        >
          SCAN / CONNECT
        </span>

        <span
          className={[
            styles.journeyAmbientPoint,
            styles.journeyAmbientPointOne,
          ].join(" ")}
        />

        <span
          className={[
            styles.journeyAmbientPoint,
            styles.journeyAmbientPointTwo,
          ].join(" ")}
        />
      </div>

      <div className={styles.container}>
        {/* ========================================================== */}
        {/* HEADER                                                     */}
        {/* ========================================================== */}

        <header className={styles.journeyHeader}>
          <div className={styles.journeyHeaderMeta}>
            <SectionIndex number="03">How it works</SectionIndex>

            <p className={styles.journeyMeta}>
              Vehicle → Identity → Safety View
            </p>
          </div>

          <div className={styles.journeyHeaderContent}>
            <h2 id="how-it-works-title" className={styles.journeyHeading}>
              One QR.
              <br />

              <span>One simple journey.</span>
            </h2>

            <div className={styles.journeyIntroBlock}>
              <p className={styles.journeyIntro}>
                VaahanSafe connects something physical on your vehicle
                to a safety view that you control.
              </p>

              <div className={styles.journeySequence} aria-hidden="true">
                <span>PLACE</span>
                <i />
                <span>SCAN</span>
                <i />
                <span>CONNECT</span>
              </div>
            </div>
          </div>
        </header>

        {/* ========================================================== */}
        {/* JOURNEY STAGE                                              */}
        {/* ========================================================== */}

        <div className={styles.journeyStage}>
          {/* continuous desktop rail */}

          <div className={styles.journeyRail} aria-hidden="true">
            <span className={styles.journeyRailBase} />

            <span
              className={[
                styles.journeyRailPoint,
                styles.journeyRailPointOne,
              ].join(" ")}
            />

            <span
              className={[
                styles.journeyRailPoint,
                styles.journeyRailPointTwo,
              ].join(" ")}
            />

            <span
              className={[
                styles.journeyRailPoint,
                styles.journeyRailPointThree,
              ].join(" ")}
            />
          </div>

          <div className={styles.journeyGrid}>
            {steps.map((step, index) => (
              <React.Fragment key={step.verb}>
                <article
                  className={[
                    styles.journeyStep,
                    index === 1 ? styles.journeyStepPrimary : "",
                  ].join(" ")}
                  aria-labelledby={`journey-step-${index}`}
                >
                  {/* step metadata */}

                  <div className={styles.journeyStepMeta}>
                    <span className={styles.journeyNumber}>
                      {step.number}
                    </span>

                    <div className={styles.journeyStepIdentity}>
                      <IdentityPoint />

                      <IdentityLabel>
                        {step.number} / {step.verb}
                      </IdentityLabel>
                    </div>
                  </div>

                  {/* copy */}

                  <div className={styles.journeyStepCopy}>
                    <p className={styles.journeyMicro}>{step.micro}</p>

                    <h3
                      id={`journey-step-${index}`}
                      className={styles.journeyStageTitle}
                    >
                      {step.title}
                    </h3>

                    <p className={styles.journeyStageCopy}>
                      {step.description}
                    </p>
                  </div>

                  {/* visual */}

                  <div className={styles.journeyVisual}>
                    {index === 0 && <PlacementArtifact />}

                    {index === 1 && <ScanArtifact />}

                    {index === 2 && <ConnectionArtifact />}
                  </div>
                </article>

                {index < steps.length - 1 && (
                  <MobileJourneyConnector
                    index={index}
                    next={steps[index + 1]?.verb ?? ""}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ========================================================== */}
        {/* TRANSFORMATION STRIP                                       */}
        {/* ========================================================== */}

        <div className={styles.transformationStrip}>
          <TransformationState
            number="01"
            icon="car"
            label="Vehicle"
            value="Physical world"
          />

          <TransformationConnector />

          <TransformationState
            number="02"
            icon="qr"
            label="VaahanSafe"
            value="Vehicle identity"
            accent
          />

          <TransformationConnector />

          <TransformationState
            number="03"
            icon="shield"
            label="Safety view"
            value="Owner controlled"
          />
        </div>

        {/* ========================================================== */}
        {/* CLOSING                                                    */}
        {/* ========================================================== */}

        <footer className={styles.journeyClosing}>
          <div>
            <IdentityLabel>The connection behind the QR</IdentityLabel>

            <p className={styles.journeyClosingStatement}>
              The QR is the starting point.
              <span>
                {" "}
                The vehicle identity behind it is what makes it useful.
              </span>
            </p>
          </div>

          <div className={styles.journeyClosingMeta} aria-hidden="true">
            <span />
            <p>PLACE / SCAN / CONNECT</p>
          </div>
        </footer>
      </div>
    </section>
  );
}

/* ================================================================== */
/* STEP 01 — PLACEMENT                                                */
/* ================================================================== */

function PlacementArtifact() {
  return (
    <div className={styles.placementArtifact}>
      <div className={styles.placementField} aria-hidden="true">
        <span className={styles.placementContour} />
        <span className={styles.placementLine} />
      </div>

      <div className={styles.placementMark}>
        <div className={styles.placementMarkInner}>
          <VaahanSafeMark
            size={74}
            variant="brand"
            aria-hidden="true"
          />
        </div>

        <span
          className={styles.placementTarget}
          aria-hidden="true"
        />
      </div>

      <div className={styles.placementInfo}>
        <span className={styles.placementIndex}>01</span>

        <div>
          <p>VaahanSafe QR</p>
          <span>Placed where it can be found and scanned</span>
        </div>
      </div>

      <div className={styles.placementStatus}>
        <IdentityPoint />
        <IdentityLabel>Vehicle / QR placed</IdentityLabel>
      </div>
    </div>
  );
}

/* ================================================================== */
/* STEP 02 — SCAN                                                     */
/* ================================================================== */

function ScanArtifact() {
  return (
    <div className={styles.scanArtifact}>
      <div className={styles.scanTop}>
        <span>
          <IdentityPoint />
          <IdentityLabel>QR identity</IdentityLabel>
        </span>

        <span className={styles.scanDemoLabel}>DEMO</span>
      </div>

      <div className={styles.scanObject}>
        <div className={styles.scanOrbit} aria-hidden="true" />

        <DemoScan animate />
      </div>

      <div className={styles.scanResolve}>
        <span className={styles.scanResolveLine} aria-hidden="true" />

        <div className={styles.scanResolveNode}>
          <VaahanIcon
            name="arrow-right"
            size={12}
            aria-hidden="true"
          />
        </div>

        <span>Open safety view</span>
      </div>
    </div>
  );
}

/* ================================================================== */
/* STEP 03 — CONNECTION                                               */
/* ================================================================== */

function ConnectionArtifact() {
  return (
    <div className={styles.connectionArtifact}>
      <div className={styles.connectionHeader}>
        <span>
          <IdentityPoint />
          <IdentityLabel>Selected information</IdentityLabel>
        </span>

        <VaahanIcon
          name="shield"
          size={14}
          aria-hidden="true"
        />
      </div>

      <SafetyProjection />

      <div className={styles.connectionAction}>
        <div className={styles.connectionActionIcon}>
          <VaahanIcon
            name="phone"
            size={12}
            aria-hidden="true"
          />
        </div>

        <div>
          <span>Next action</span>
          <p>Use an available contact option</p>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* TRANSFORMATION STATE                                               */
/* ================================================================== */

function TransformationState({
  number,
  icon,
  label,
  value,
  accent = false,
}: {
  number: string;
  icon: string;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={styles.transformationState}>
      <span className={styles.transformationNumber}>{number}</span>

      <div
        className={[
          styles.transformationIcon,
          accent ? styles.transformationIconAccent : "",
        ].join(" ")}
      >
        <VaahanIcon
          name={icon as any}
          size={13}
          aria-hidden="true"
        />
      </div>

      <div>
        <p>{label}</p>
        <span>{value}</span>
      </div>
    </div>
  );
}

/* ================================================================== */
/* TRANSFORMATION CONNECTOR                                           */
/* ================================================================== */

function TransformationConnector() {
  return (
    <div
      className={styles.transformationConnector}
      aria-hidden="true"
    >
      <span />

      <VaahanIcon name="arrow-right" size={10} />
    </div>
  );
}

/* ================================================================== */
/* MOBILE CONNECTOR                                                   */
/* ================================================================== */

function MobileJourneyConnector({
  index,
  next,
}: {
  index: number;
  next: string;
}) {
  return (
    <div
      className={styles.mobileJourneyConnector}
      aria-hidden="true"
    >
      <span className={styles.mobileConnectorLine} />

      <div className={styles.mobileConnectorNode}>
        <VaahanIcon name="arrow-right" size={10} />
      </div>

      <span className={styles.mobileConnectorLabel}>
        {String(index + 2).padStart(2, "0")} / {next}
      </span>
    </div>
  );
}