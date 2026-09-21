import * as React from "react";

import { VaahanIcon } from "@vaahansafe/icons";
import {
  ALL_CORNERS_PATH,
  DEMO_QR_PATH,
} from "@vaahansafe/ui/brand";

import { HOMEPAGE_DEMO_DATA } from "../../lib/demo/homepage-demo";
import styles from "./identity-story.module.css";

/* ================================================================== */
/* TYPES                                                              */
/* ================================================================== */

type IdentityTone =
  | "coral"
  | "teal"
  | "success"
  | "amber"
  | "muted";

type IdentityLabelProps = {
  children: React.ReactNode;
  className?: string;
};

type IdentityRailProps = {
  className?: string;
  direction?: "horizontal" | "vertical";
  tone?: IdentityTone;
};

type SectionIndexProps = {
  number: string;
  children: React.ReactNode;
  tone?: IdentityTone;
  className?: string;
};

type ScanFrameProps = {
  children?: React.ReactNode;
  className?: string;
};

type ProjectionBoundaryProps = {
  children: React.ReactNode;
  className?: string;
};

type StatusSignalProps = {
  children: React.ReactNode;
  tone?: IdentityTone;
  className?: string;
};

type DemoScanProps = {
  animate?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
};

/* ================================================================== */
/* IDENTITY POINT                                                     */
/* ================================================================== */

export function IdentityPoint({
  tone = "coral",
  className = "",
}: {
  tone?: IdentityTone;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-tone={tone}
      className={`${styles.point} ${className}`}
    />
  );
}

/* ================================================================== */
/* IDENTITY RAIL                                                      */
/* ================================================================== */

export function IdentityRail({
  className = "",
  direction = "horizontal",
  tone = "muted",
}: IdentityRailProps) {
  return (
    <span
      aria-hidden="true"
      data-direction={direction}
      data-tone={tone}
      className={`${styles.rail} ${className}`}
    />
  );
}

/* ================================================================== */
/* MICRO LABEL                                                        */
/* ================================================================== */

export function IdentityLabel({
  children,
  className = "",
}: IdentityLabelProps) {
  return (
    <span className={`${styles.label} ${className}`}>
      {children}
    </span>
  );
}

/* ================================================================== */
/* SECTION INDEX                                                      */
/* ================================================================== */

export function SectionIndex({
  number,
  children,
  tone = "coral",
  className = "",
}: SectionIndexProps) {
  return (
    <div
      className={`${styles.index} ${className}`}
      data-tone={tone}
    >
      <IdentityPoint tone={tone} />

      <IdentityRail
        tone={tone}
        className={styles.indexRail}
      />

      <IdentityLabel>
        <span className={styles.indexNumber}>
          {number}
        </span>

        <span
          aria-hidden="true"
          className={styles.indexSlash}
        >
          /
        </span>

        <span>{children}</span>
      </IdentityLabel>
    </div>
  );
}

/* ================================================================== */
/* SCAN FRAME                                                         */
/* ================================================================== */

export function ScanFrame({
  children,
  className = "",
}: ScanFrameProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className={`${styles.scanFrame} ${className}`}
    >
      <path
        d={ALL_CORNERS_PATH}
        className={styles.scanCorners}
      />

      {children}
    </svg>
  );
}

/* ================================================================== */
/* PROJECTION BOUNDARY                                                */
/* ================================================================== */

export function ProjectionBoundary({
  children,
  className = "",
}: ProjectionBoundaryProps) {
  return (
    <div
      className={`${styles.boundary} ${className}`}
      data-vaahansafe-projection=""
    >
      {/* identity geometry */}
      <div
        aria-hidden="true"
        className={styles.boundaryGeometry}
      >
        <span className={styles.boundaryOrbitLarge} />
        <span className={styles.boundaryOrbitSmall} />

        <span className={styles.boundaryPointOne} />
        <span className={styles.boundaryPointTwo} />

        <span className={styles.boundaryCornerTop} />
        <span className={styles.boundaryCornerBottom} />
      </div>

      <div className={styles.boundaryContent}>
        {children}
      </div>
    </div>
  );
}

/* ================================================================== */
/* STATUS SIGNAL                                                      */
/* ================================================================== */

export function StatusSignal({
  children,
  tone = "success",
  className = "",
}: StatusSignalProps) {
  return (
    <span
      className={`${styles.signal} ${className}`}
      data-tone={tone}
    >
      <span
        aria-hidden="true"
        className={styles.signalPoint}
      />

      <span className={styles.signalText}>
        {children}
      </span>
    </span>
  );
}

/* ================================================================== */
/* DEMO SCAN                                                          */
/* ================================================================== */

/**
 * Purely illustrative.
 *
 * HARD RULE:
 * - Never encode a live VaahanSafe URL.
 * - Never encode a customer ID.
 * - Never encode an activation credential.
 * - Never encode personal information.
 * - Never make this graphic scannable.
 */
export function DemoScan({
  animate = false,
  size = "md",
  label = "Illustrative QR · demo only",
  className = "",
}: DemoScanProps) {
  return (
    <figure
      data-size={size}
      className={`${styles.demoScan} ${className}`}
    >
      <div className={styles.scanObject}>
        {/* ambient identity field */}
        <span
          aria-hidden="true"
          className={styles.scanOrbitOuter}
        />

        <span
          aria-hidden="true"
          className={styles.scanOrbitInner}
        />

        <span
          aria-hidden="true"
          className={styles.scanCoordinateOne}
        />

        <span
          aria-hidden="true"
          className={styles.scanCoordinateTwo}
        />

        <ScanFrame className={styles.demoSvg}>
          <path
            d={DEMO_QR_PATH}
            className={styles.demoQr}
            fillRule="evenodd"
          />

          {animate && (
            <rect
              className={styles.sweep}
              x="8"
              y="8"
              width="16"
              height=".34"
              rx=".17"
            />
          )}
        </ScanFrame>

        {/* identity status */}
        <div
          aria-hidden="true"
          className={styles.scanStatus}
        >
          <IdentityPoint tone="coral" />

          <span>Identity</span>
        </div>
      </div>

      <figcaption className={styles.scanCaption}>
        <IdentityRail
          tone="coral"
          className={styles.scanCaptionRail}
        />

        <IdentityLabel>{label}</IdentityLabel>
      </figcaption>
    </figure>
  );
}

/* ================================================================== */
/* SAFETY PROJECTION                                                  */
/* ================================================================== */

/**
 * Public-view illustration only.
 *
 * This component must always use synthetic homepage demo data.
 * It must never receive or render a real customer record.
 */
export function SafetyProjection() {
  const { hero } = HOMEPAGE_DEMO_DATA;

  return (
    <ProjectionBoundary>
      {/* ============================================================ */}
      {/* HEADER                                                       */}
      {/* ============================================================ */}

      <header className={styles.projectionHeader}>
        <div className={styles.projectionBrand}>
          <div
            className={styles.projectionBrandMark}
            aria-hidden="true"
          >
            <VaahanIcon
              name="shield"
              size={14}
            />

            <span className={styles.projectionBrandPoint} />
          </div>

          <div>
            <IdentityLabel>
              Safety view
            </IdentityLabel>

            <span className={styles.projectionDemo}>
              Demo
            </span>
          </div>
        </div>

        <StatusSignal tone="success">
          Active
        </StatusSignal>
      </header>

      {/* ============================================================ */}
      {/* IDENTIFIED VEHICLE                                           */}
      {/* ============================================================ */}

      <div className={styles.projectionIdentity}>
        <SectionIndex
          number="01"
          tone="coral"
          className={styles.projectionIndex}
        >
          Vehicle identified
        </SectionIndex>

        <p className={styles.profileVehicle}>
          {hero.vehicleDisplay}
        </p>

        <div className={styles.profileIdentityCode}>
          <IdentityLabel>
            VaahanSafe ID
          </IdentityLabel>

          <p className={styles.profileCode}>
            {hero.visibleCode}
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* PUBLIC PROJECTION                                            */}
      {/* ============================================================ */}

      <div className={styles.projectionSection}>
        <div className={styles.projectionSectionHeader}>
          <IdentityLabel>
            Public safety projection
          </IdentityLabel>

          <VaahanIcon
            name="lock"
            size={12}
            aria-hidden="true"
          />
        </div>

        <dl className={styles.profileRows}>
          <ProjectionRow
            icon="shield"
            label="Safety information"
            value="Owner selected"
            tone="amber"
          />

          <ProjectionRow
            icon="phone"
            label="Contact options"
            value="Owner selected"
            tone="teal"
          />
        </dl>
      </div>

      {/* ============================================================ */}
      {/* PRIVACY BOUNDARY                                             */}
      {/* ============================================================ */}

      <footer className={styles.projectionFooter}>
        <div className={styles.projectionFooterIcon}>
          <VaahanIcon
            name="check"
            size={12}
            aria-hidden="true"
          />
        </div>

        <div>
          <span className={styles.projectionFooterTitle}>
            Owner-controlled view
          </span>

          <span className={styles.projectionFooterDescription}>
            Only selected safety information is represented.
          </span>
        </div>
      </footer>
    </ProjectionBoundary>
  );
}

/* ================================================================== */
/* PROJECTION ROW                                                     */
/* ================================================================== */

function ProjectionRow({
  icon,
  label,
  value,
  tone,
}: {
  icon: string;
  label: string;
  value: string;
  tone: "amber" | "teal";
}) {
  return (
    <div
      className={styles.projectionRow}
      data-tone={tone}
    >
      <dt className={styles.projectionRowLabel}>
        <span
          className={styles.projectionRowIcon}
          aria-hidden="true"
        >
          <VaahanIcon
            name={icon as any}
            size={12}
          />
        </span>

        <span>{label}</span>
      </dt>

      <dd className={styles.projectionRowValue}>
        {value}
      </dd>
    </div>
  );
}