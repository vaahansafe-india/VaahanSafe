import * as React from "react";

import {
  ALL_CORNERS_PATH,
  DEMO_QR_PATH,
  QR_DATA_PATH,
  QR_FINDERS_PATH,
  VEHICLE_BODY_PATH,
  VaahanSafeLogo,
} from "@vaahansafe/ui/brand";

import { HOMEPAGE_DEMO_DATA } from "../../lib/demo/homepage-demo";
import { IdentityPoint, StatusSignal } from "./identity-primitives";

import styles from "./identity-hero.module.css";

/**
 * Synthetic VaahanSafe identity artifact.
 *
 * Rules:
 * - Never render a real customer identity.
 * - Never encode a real URL, publicId or activation credential.
 * - Demo QR remains deliberately non-functional.
 * - Motion is illustrative only and must not be required for comprehension.
 */
export function VaahanSafeIdentityObject() {
  const { hero } = HOMEPAGE_DEMO_DATA;

  return (
    <article
      className={styles.plaque}
      aria-label="Illustrative VaahanSafe vehicle identity"
    >
      {/* ========================================================== */}
      {/* AMBIENT IDENTITY GEOMETRY                                  */}
      {/* ========================================================== */}

      <div
        className={styles.plaqueGeometry}
        aria-hidden="true"
      >
        <span className={styles.plaqueOrbitLarge} />
        <span className={styles.plaqueOrbitSmall} />

        <span
          className={[
            styles.plaqueGeometryPoint,
            styles.plaqueGeometryPointCoral,
          ].join(" ")}
        />

        <span
          className={[
            styles.plaqueGeometryPoint,
            styles.plaqueGeometryPointTeal,
          ].join(" ")}
        />

        <span className={styles.plaqueRegistrationLine} />
      </div>

      {/* ========================================================== */}
      {/* HEADER                                                     */}
      {/* ========================================================== */}

      <header className={styles.plaqueHeader}>
        <div className={styles.plaqueBrand}>
          <VaahanSafeLogo size="sm" theme="dark" />

          <span
            className={styles.plaqueBrandRail}
            aria-hidden="true"
          />

          <span className={styles.plaqueType}>
            Vehicle identity
          </span>
        </div>

        <div className={styles.demoState}>
          <IdentityPoint tone="coral" />

          <span>Illustrative preview</span>
        </div>
      </header>

      {/* ========================================================== */}
      {/* MAIN IDENTITY BODY                                         */}
      {/* ========================================================== */}

      <div className={styles.plaqueBody}>
        {/* ---------------------------------------------------------- */}
        {/* SCAN / RECOGNITION OBJECT                                  */}
        {/* ---------------------------------------------------------- */}

        <div className={styles.scanZone}>
          <div className={styles.scanZoneMeta}>
            <span>01</span>
            <span>Scan / identify</span>
          </div>

          <div className={styles.scanObject}>
            <div
              className={styles.scanRegistrationRing}
              aria-hidden="true"
            />

            <svg
              viewBox="0 0 32 32"
              aria-hidden="true"
              className={styles.scanSvg}
            >
              {/* VaahanSafe scan corners */}

              <path
                className={styles.scanFrame}
                d={ALL_CORNERS_PATH}
                fill="var(--color-primary)"
              />

              {/* Synthetic QR state */}

              <g className={styles.demoQr}>
                <path
                  d={DEMO_QR_PATH}
                  fill="var(--color-canvas)"
                  fillRule="evenodd"
                />
              </g>

              {/* Recognized vehicle identity state */}

              <g
                className={styles.recognizedVehicle}
                fill="var(--color-canvas)"
                fillRule="evenodd"
              >
                <path d={VEHICLE_BODY_PATH} />
                <path d={QR_FINDERS_PATH} />
                <path d={QR_DATA_PATH} />
              </g>

              {/* One-pass scan sweep */}

              <rect
                className={styles.scanSweep}
                x="8"
                y="8"
                width="16"
                height=".4"
                rx=".2"
                fill="var(--color-primary)"
              />
            </svg>

            <span
              className={styles.scanTarget}
              aria-hidden="true"
            />

            <span
              className={styles.scanCoordinate}
              aria-hidden="true"
            >
              VS / QR
            </span>
          </div>

          <div className={styles.scanState}>
            <span className={styles.scanStatePoint} />

            <span>QR identity</span>

            <span className={styles.scanStateArrow}>
              →
            </span>

            <strong>Vehicle found</strong>
          </div>
        </div>

        {/* ---------------------------------------------------------- */}
        {/* IDENTITY                                                   */}
        {/* ---------------------------------------------------------- */}

        <div className={styles.identityDetails}>
          <div className={styles.identityMeta}>
            <span className={styles.microLabel}>
              VaahanSafe ID
            </span>

            <span
              className={styles.identityMetaIndex}
              aria-hidden="true"
            >
              02 / IDENTITY
            </span>
          </div>

          <p className={styles.visibleCode}>
            {hero.visibleCode}
          </p>

          <div className={styles.identityDivider}>
            <span />
            <IdentityPoint tone="coral" />
          </div>

          <div className={styles.identityFacts}>
            <IdentityFact
              label="Vehicle"
              value={hero.vehicleDisplay}
            />

            <IdentityFact
              label="Profile"
              value={hero.profile}
            />
          </div>

          <div className={styles.projectionRoute}>
            <div className={styles.projectionRouteIcon}>
              <IdentityPoint tone="teal" />
            </div>

            <div>
              <span className={styles.microLabel}>
                Public projection
              </span>

              <p>Owner-controlled safety view</p>
            </div>

            <span
              className={styles.projectionArrow}
              aria-hidden="true"
            >
              →
            </span>
          </div>
        </div>

        {/* ---------------------------------------------------------- */}
        {/* STATUS                                                     */}
        {/* ---------------------------------------------------------- */}

        <div className={styles.statusZone}>
          <div className={styles.statusZoneTop}>
            <span
              className={styles.statusIndex}
              aria-hidden="true"
            >
              03
            </span>

            <span className={styles.microLabel}>
              Identity state
            </span>
          </div>

          <div className={styles.statusSeal}>
            <StatusSignal>ACTIVE</StatusSignal>

            <span className={styles.statusDescription}>
              Demo identity
            </span>
          </div>

          <div
            className={styles.statusConnection}
            aria-hidden="true"
          >
            <span />

            <div>
              <IdentityPoint tone="teal" />
            </div>

            <span />
          </div>

          <div className={styles.statusDestination}>
            <span className={styles.microLabel}>
              Safety view
            </span>

            <p>Ready to open</p>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* PRODUCT RELATIONSHIP                                      */}
      {/* ========================================================== */}

      <div
        className={styles.plaqueRelationship}
        aria-hidden="true"
      >
        <RelationshipState
          number="01"
          label="Physical"
          value="Vehicle QR"
        />

        <RelationshipConnector />

        <RelationshipState
          number="02"
          label="Identity"
          value="VS-7F3K-9021"
          accent
        />

        <RelationshipConnector />

        <RelationshipState
          number="03"
          label="Projection"
          value="Safety view"
        />
      </div>

      {/* ========================================================== */}
      {/* FOOTER                                                     */}
      {/* ========================================================== */}

      <footer className={styles.plaqueFooter}>
        <div className={styles.plaqueFooterStatement}>
          <span
            className={styles.plaqueFooterPoint}
            aria-hidden="true"
          />

          <span>
            Vehicle identity.
            <strong> Owner-controlled safety view.</strong>
          </span>
        </div>

        <span
          className={styles.plaqueFooterIndex}
          aria-hidden="true"
        >
          01 / VAAHANSAFE
        </span>
      </footer>
    </article>
  );
}

/* ================================================================== */
/* IDENTITY FACT                                                      */
/* ================================================================== */

function IdentityFact({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className={styles.identityFact}>
      <span className={styles.microLabel}>
        {label}
      </span>

      <p>{value}</p>
    </div>
  );
}

/* ================================================================== */
/* RELATIONSHIP STATE                                                 */
/* ================================================================== */

function RelationshipState({
  number,
  label,
  value,
  accent = false,
}: {
  number: string;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={styles.relationshipState}>
      <span className={styles.relationshipNumber}>
        {number}
      </span>

      <span
        className={[
          styles.relationshipPoint,
          accent ? styles.relationshipPointAccent : "",
        ].join(" ")}
      />

      <div>
        <span>{label}</span>
        <p>{value}</p>
      </div>
    </div>
  );
}

/* ================================================================== */
/* RELATIONSHIP CONNECTOR                                             */
/* ================================================================== */

function RelationshipConnector() {
  return (
    <div
      className={styles.relationshipConnector}
      aria-hidden="true"
    >
      <span />
      <i>→</i>
      <span />
    </div>
  );
}