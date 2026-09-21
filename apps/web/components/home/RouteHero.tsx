import * as React from "react";
import Link from "next/link";

import { VaahanIcon } from "@vaahansafe/icons";
import { Button } from "@vaahansafe/ui/components";
import { getActivateUrl, getCustomerUrl } from "@vaahansafe/config";

import { IdentityField } from "./IdentityField";
import { IdentityPoint } from "./identity-primitives";
import { VaahanSafeIdentityObject } from "./VaahanSafeIdentityObject";

import styles from "./identity-hero.module.css";

/**
 * Homepage identity introduction.
 *
 * Server rendered by default.
 * Decorative motion is CSS-only and must respect prefers-reduced-motion.
 */
export function RouteHero() {
  const customerUrl = getCustomerUrl();
  const activateUrl = getActivateUrl();

  return (
    <section
      className={styles.hero}
      aria-labelledby="identity-headline"
    >
      {/* Decorative registration / identity geometry */}
      <IdentityField />

      <div className={styles.content}>
        {/* ========================================================= */}
        {/* INTRO                                                     */}
        {/* ========================================================= */}

        <header className={styles.intro}>
          <p className={styles.eyebrow}>
            <IdentityPoint />

            <span>Vehicle safety identity</span>

            <span className={styles.eyebrowRail} aria-hidden="true" />

            <span className={styles.eyebrowIndex} aria-hidden="true">
              01
            </span>
          </p>

          <h1
            id="identity-headline"
            className={styles.headline}
          >
            <span className={styles.headlinePrimary}>
              Your vehicle has an identity.
            </span>

            <span className={styles.headlineAccent}>
              Make it useful when it matters.
            </span>
          </h1>

          <p className={styles.description}>
            A permanent QR-based safety identity that helps people
            reach the information you choose to make available when
            your vehicle&apos;s QR is scanned.
          </p>
        </header>

        {/* ========================================================= */}
        {/* PRIMARY ROUTES                                            */}
        {/* ========================================================= */}

        <div className={styles.actions}>
          <Button
            size="lg"
            asChild
            className={styles.primary}
          >
            <a href={customerUrl}>
              <span>Get VaahanSafe</span>

              <VaahanIcon
                name="arrow-right"
                size={15}
                aria-hidden="true"
              />
            </a>
          </Button>

          <Link
            href="/how-it-works"
            className={styles.secondary}
          >
            <span>See how it works</span>

            <VaahanIcon
              name="arrow-right"
              size={13}
              aria-hidden="true"
            />
          </Link>
        </div>

        {/* ========================================================= */}
        {/* RETAIL ENTRY                                              */}
        {/* ========================================================= */}

        <div className={styles.retailRoute}>
          <span
            className={styles.retailRoutePoint}
            aria-hidden="true"
          />

          <span className={styles.retailRouteLabel}>
            Already have a retail QR?
          </span>

          <a
            href={activateUrl}
            className={styles.retailRouteLink}
          >
            Activate it

            <VaahanIcon
              name="arrow-right"
              size={11}
              aria-hidden="true"
            />
          </a>
        </div>

        {/* ========================================================= */}
        {/* IDENTITY TRANSITION                                       */}
        {/* ========================================================= */}

        <div
          className={styles.identityTransition}
          aria-hidden="true"
        >
          <span className={styles.transitionLine} />

          <div className={styles.transitionNode}>
            <IdentityPoint />
          </div>

          <span className={styles.transitionLabel}>
            Physical vehicle
          </span>

          <span className={styles.transitionArrow}>→</span>

          <span className={styles.transitionLabel}>
            VaahanSafe identity
          </span>

          <span className={styles.transitionArrow}>→</span>

          <span className={styles.transitionLabel}>
            Safety view
          </span>

          <span className={styles.transitionLine} />
        </div>

        {/* ========================================================= */}
        {/* HERO PRODUCT OBJECT                                       */}
        {/* ========================================================= */}

        <div className={styles.artifactStage}>
          <div
            className={styles.artifactCoordinate}
            aria-hidden="true"
          >
            <span>IDENTITY OBJECT</span>
            <span>01 / ACTIVE</span>
          </div>

          <div
            className={styles.artifactRail}
            aria-hidden="true"
          >
            <span className={styles.artifactRailPoint} />

            <span className={styles.artifactRailLine} />

            <span>Vehicle / identity / safety</span>
          </div>

          <VaahanSafeIdentityObject />

          <div
            className={styles.artifactCaption}
            aria-hidden="true"
          >
            <span />

            <p>
              One vehicle. One identity.
              <strong> A useful connection.</strong>
            </p>

            <span />
          </div>
        </div>

        {/* ========================================================= */}
        {/* CLOSING                                                   */}
        {/* ========================================================= */}

        <footer className={styles.closing}>
          <span
            className={styles.closingIndex}
            aria-hidden="true"
          >
            VS / 01
          </span>

          <p>
            Made for the journeys you take.
            <span> And the people who matter.</span>
          </p>

          <span
            className={styles.closingPoint}
            aria-hidden="true"
          />
        </footer>
      </div>
    </section>
  );
}