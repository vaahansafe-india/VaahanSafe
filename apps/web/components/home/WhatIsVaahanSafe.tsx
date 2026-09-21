import * as React from "react";
import Link from "next/link";

import { VaahanIcon } from "@vaahansafe/icons";
import { VaahanSafeMark } from "@vaahansafe/ui/brand";
import { HOMEPAGE_DEMO_DATA } from "../../lib/demo/homepage-demo";

import {
  IdentityLabel,
  IdentityPoint,
  SafetyProjection,
  SectionIndex,
  StatusSignal,
} from "./identity-primitives";

import styles from "./identity-story.module.css";

export function WhatIsVaahanSafe() {
  const { hero } = HOMEPAGE_DEMO_DATA;

  return (
    <section
      id="what-is-vaahansafe"
      aria-labelledby="what-is-vaahansafe-title"
      className={[styles.section, styles.whatSection].join(" ")}
    >
      <div className={styles.container}>
        {/* ========================================================= */}
        {/* SECTION INTRO                                             */}
        {/* ========================================================= */}

        <header className={styles.header}>
          <SectionIndex number="02">
            What is VaahanSafe?
          </SectionIndex>

          <h2
            id="what-is-vaahansafe-title"
            className={styles.heading}
          >
            A safety identity
            <br />
            <span>for your vehicle.</span>
          </h2>

          <p className={styles.intro}>
            VaahanSafe connects a physical vehicle to a scannable
            safety view. You choose which supported information and
            contact options are made available when the QR is scanned.
          </p>
        </header>

        {/* ========================================================= */}
        {/* IDENTITY STORY                                            */}
        {/* ========================================================= */}

        <div
          className={styles.identityStory}
          aria-label="Vehicle to VaahanSafe identity to safety view"
        >
          {/* ------------------------------------------------------- */}
          {/* 01 / PHYSICAL VEHICLE                                  */}
          {/* ------------------------------------------------------- */}

          <article
            className={[
              styles.identityStoryStage,
              styles.vehicleStage,
            ].join(" ")}
          >
            <div className={styles.stageMeta}>
              <span className={styles.stageIndex}>
                01
              </span>

              <IdentityLabel>
                Physical vehicle
              </IdentityLabel>
            </div>

            <div className={styles.vehicleScene}>
              <div
                className={styles.vehicleCoordinate}
                aria-hidden="true"
              >
                <span>PHYSICAL</span>
                <span>VEHICLE / 01</span>
              </div>

              <div
                className={styles.vehicleRegistrationRing}
                aria-hidden="true"
              />

              <div className={styles.vehicleFigure}>
                <VaahanIcon
                  name="car"
                  size={142}
                  strokeWidth={0.65}
                  aria-hidden="true"
                />

                <span
                  className={styles.vehicleIdentityPoint}
                  aria-hidden="true"
                >
                  <IdentityPoint tone="coral" />
                </span>
              </div>

              <div
                className={styles.vehicleQrMarker}
                aria-hidden="true"
              >
                <span />
                <span>QR</span>
              </div>
            </div>

            <div className={styles.stageNarrative}>
              <h3 className={styles.stageTitle}>
                It starts with your vehicle.
              </h3>

              <p className={styles.stageCopy}>
                The VaahanSafe QR gives the physical vehicle an
                entry point to its digital safety identity.
              </p>
            </div>
          </article>

          {/* ------------------------------------------------------- */}
          {/* CONNECTION                                             */}
          {/* ------------------------------------------------------- */}

          <StoryConnector
            number="01"
            label="Identify"
          />

          {/* ------------------------------------------------------- */}
          {/* 02 / IDENTITY                                          */}
          {/* ------------------------------------------------------- */}

          <article
            className={[
              styles.identityStoryStage,
              styles.identityAnchor,
            ].join(" ")}
          >
            <div
              className={styles.anchorGeometry}
              aria-hidden="true"
            >
              <span className={styles.anchorOrbitLarge} />
              <span className={styles.anchorOrbitSmall} />

              <span className={styles.anchorAxisHorizontal} />
              <span className={styles.anchorAxisVertical} />

              <span className={styles.anchorCoordinate}>
                VS / IDENTITY
              </span>
            </div>

            <div className={styles.anchorHeader}>
              <div className={styles.anchorHeaderLeft}>
                <span className={styles.anchorIndex}>
                  02
                </span>

                <IdentityLabel>
                  VaahanSafe identity
                </IdentityLabel>
              </div>

              <span className={styles.anchorDemo}>
                Synthetic preview
              </span>
            </div>

            <div className={styles.anchorCore}>
              <div className={styles.anchorMarkStage}>
                <span
                  className={styles.anchorMarkRing}
                  aria-hidden="true"
                />

                <VaahanSafeMark
                  size={96}
                  variant="dark"
                  aria-hidden="true"
                  className={styles.anchorMark}
                />

                <span
                  className={styles.anchorMarkPoint}
                  aria-hidden="true"
                >
                  <IdentityPoint tone="coral" />
                </span>
              </div>

              <div className={styles.anchorIdentity}>
                <span className={styles.microLabel}>
                  VaahanSafe ID
                </span>

                <p className={styles.anchorCode}>
                  {hero.visibleCode}
                </p>
              </div>

              <div className={styles.anchorStatus}>
                <StatusSignal>
                  ACTIVE
                </StatusSignal>

                <span>Demo identity</span>
              </div>
            </div>

            <div className={styles.anchorRelationship}>
              <IdentityRelation
                label="Belongs to"
                value="Vehicle"
              />

              <IdentityRelation
                label="Opens"
                value="Safety view"
              />

              <IdentityRelation
                label="Visibility"
                value="Owner controlled"
              />
            </div>
          </article>

          {/* ------------------------------------------------------- */}
          {/* CONNECTION                                             */}
          {/* ------------------------------------------------------- */}

          <StoryConnector
            number="02"
            label="Project"
          />

          {/* ------------------------------------------------------- */}
          {/* 03 / SAFETY VIEW                                       */}
          {/* ------------------------------------------------------- */}

          <article
            className={[
              styles.identityStoryStage,
              styles.projectionStage,
            ].join(" ")}
          >
            <div className={styles.stageMeta}>
              <span className={styles.stageIndex}>
                03
              </span>

              <IdentityLabel>
                Controlled safety view
              </IdentityLabel>
            </div>

            <div className={styles.projectionScene}>
              <div
                className={styles.projectionCoordinate}
                aria-hidden="true"
              >
                <span>PUBLIC VIEW</span>
                <span>OWNER CONTROLLED</span>
              </div>

              <SafetyProjection />
            </div>

            <div className={styles.stageNarrative}>
              <h3 className={styles.stageTitle}>
                Useful information comes forward.
              </h3>

              <p className={styles.stageCopy}>
                A scan can bring the selected safety information
                and contact options into view without exposing the
                VaahanSafe account itself.
              </p>
            </div>
          </article>
        </div>

        {/* ========================================================= */}
        {/* RELATIONSHIP SUMMARY                                     */}
        {/* ========================================================= */}

        <div
          className={styles.identityEquation}
          aria-label="Physical vehicle becomes connected to a VaahanSafe identity and controlled safety view"
        >
          <EquationState
            index="01"
            label="Physical"
            value="Vehicle"
          />

          <EquationConnector />

          <EquationState
            index="02"
            label="Identity"
            value="VaahanSafe"
            active
          />

          <EquationConnector />

          <EquationState
            index="03"
            label="Projection"
            value="Safety view"
          />
        </div>

        {/* ========================================================= */}
        {/* CLOSING                                                   */}
        {/* ========================================================= */}

        <footer className={styles.whatClosing}>
          <span
            className={styles.whatClosingRail}
            aria-hidden="true"
          />

          <p>
            The QR is only the doorway.
            <span>
              {" "}
              The identity behind it is what matters.
            </span>
          </p>

          <div className="mt-5 flex justify-center">
            <Link
              href="/how-it-works"
              className="group inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[#cc785c] transition-all hover:border-[#cc785c]/40 hover:bg-muted hover:text-[#a9583e] dark:border-white/[0.08] dark:bg-zinc-950 dark:hover:border-[#cc785c]/40 dark:hover:bg-zinc-800"
            >
              <span>Explore how VaahanSafe works</span>
              <VaahanIcon
                name="arrow-right"
                size={11}
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
                aria-hidden="true"
              />
            </Link>
          </div>

          <span
            className={styles.whatClosingPoint}
            aria-hidden="true"
          />
        </footer>
      </div>
    </section>
  );
}

function StoryConnector({
  number,
  label,
}: {
  number: string;
  label: string;
}) {
  return (
    <div
      className={styles.storyConnector}
      aria-hidden="true"
    >
      <span className={styles.storyConnectorLine} />

      <div className={styles.storyConnectorNode}>
        <IdentityPoint tone="coral" />

        <span>{number}</span>
      </div>

      <span className={styles.storyConnectorLabel}>
        {label}
      </span>

      <span className={styles.storyConnectorArrow}>
        →
      </span>

      <span className={styles.storyConnectorLine} />
    </div>
  );
}

function IdentityRelation({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className={styles.identityRelation}>
      <span>{label}</span>
      <p>{value}</p>
    </div>
  );
}

function EquationState({
  index,
  label,
  value,
  active = false,
}: {
  index: string;
  label: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div
      className={[
        styles.equationState,
        active ? styles.equationStateActive : "",
      ].join(" ")}
    >
      <span className={styles.equationIndex}>
        {index}
      </span>

      <span className={styles.equationPoint} />

      <div>
        <span className={styles.equationLabel}>
          {label}
        </span>

        <p>{value}</p>
      </div>
    </div>
  );
}

function EquationConnector() {
  return (
    <div
      className={styles.equationConnector}
      aria-hidden="true"
    >
      <span />
      <i>→</i>
      <span />
    </div>
  );
}