import * as React from "react";

import {
  ALL_CORNERS_PATH,
  VEHICLE_BODY_PATH,
} from "@vaahansafe/ui/brand";

import styles from "./identity-hero.module.css";

/**
 * VAHANSAFE — HERO IDENTITY FIELD
 *
 * Decorative only.
 *
 * Visual idea:
 *
 * PHYSICAL VEHICLE
 *        ↓
 *      IDENTITY
 *        ↓
 *       SCAN
 *        ↓
 *     CONNECTION
 *
 * No pointer listeners.
 * No canvas.
 * No WebGL.
 * No customer information.
 * No functional QR.
 */
export function IdentityField() {
  return (
    <div
      className={styles.field}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 1040"
        preserveAspectRatio="xMidYMid slice"
        className={styles.fieldSvg}
        focusable="false"
      >
        {/* ========================================================== */}
        {/* OUTER REGISTRATION ARCS                                    */}
        {/* ========================================================== */}

        <g
          className={styles.fieldHairlines}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        >
          <path
            d="
              M-120 880
              C85 880 108 472 300 472
              C422 472 438 276 532 206
            "
          />

          <path
            d="
              M972 206
              C1064 276 1078 472 1196 472
              C1384 472 1408 880 1560 880
            "
          />

          <path
            d="
              M-80 952
              C188 952 205 654 382 654
            "
          />

          <path
            d="
              M1058 654
              C1236 654 1250 952 1520 952
            "
          />

          {/* upper framing rails */}

          <path d="M138 164V86H390" />

          <path d="M1050 86H1302V164" />

          {/* lower framing rails */}

          <path d="M138 824V960H410" />

          <path d="M1030 960H1302V824" />

          {/* side registration marks */}

          <path d="M96 680H258" />

          <path d="M1182 680H1344" />

          {/* crosshair left */}

          <path d="M204 708H250" />
          <path d="M227 685V731" />

          {/* crosshair right */}

          <path d="M1190 708H1236" />
          <path d="M1213 685V731" />

          {/* central identity datum */}

          <path d="M535 902H905" />

          <path d="M720 902V982" />

          {/* small technical ticks */}

          <path d="M535 896V908" />
          <path d="M585 898V906" />
          <path d="M635 898V906" />
          <path d="M685 898V906" />

          <path d="M755 898V906" />
          <path d="M805 898V906" />
          <path d="M855 898V906" />
          <path d="M905 896V908" />
        </g>

        {/* ========================================================== */}
        {/* MICRO COORDINATES                                          */}
        {/* ========================================================== */}

        <g
          className={styles.fieldCoordinates}
          fill="currentColor"
        >
          <text x="240" y="112">
            01 / VEHICLE
          </text>

          <text x="1040" y="112">
            02 / IDENTITY
          </text>

          <text x="220" y="872">
            PLACE / SCAN / CONNECT
          </text>

          <text x="1040" y="972">
            PRIVACY / CONTROL
          </text>

          <text
            x="720"
            y="932"
            textAnchor="middle"
          >
            VS / IDENTITY FIELD
          </text>
        </g>

        {/* ========================================================== */}
        {/* CENTRAL REGISTRATION TARGET                                */}
        {/* ========================================================== */}

        <g
          className={styles.registrationTarget}
          fill="none"
          stroke="currentColor"
          vectorEffect="non-scaling-stroke"
        >
          <circle
            cx="720"
            cy="540"
            r="148"
          />

          <circle
            cx="720"
            cy="540"
            r="112"
          />

          {/* interrupted targeting marks */}

          <path d="M720 374V402" />
          <path d="M720 678V706" />

          <path d="M554 540H582" />
          <path d="M858 540H886" />
        </g>

        {/* ========================================================== */}
        {/* VEHICLE CONTOUR                                            */}
        {/* ========================================================== */}

        <path
          className={styles.vehicleContour}
          d={VEHICLE_BODY_PATH}
          fill="currentColor"
          fillRule="evenodd"
          transform="translate(465 570) scale(16)"
        />

        {/* ========================================================== */}
        {/* IDENTITY CONNECTION                                        */}
        {/* ========================================================== */}

        <g
          className={styles.connectionGeometry}
          fill="none"
          stroke="currentColor"
          vectorEffect="non-scaling-stroke"
        >
          <path d="M720 642V740" />

          <path d="M720 740C720 778 684 790 646 790" />

          <path d="M720 740C720 778 756 790 794 790" />
        </g>

        {/* ========================================================== */}
        {/* IDENTITY POINTS                                             */}
        {/* ========================================================== */}

        <g className={styles.fieldPoints}>
          <circle
            cx="227"
            cy="708"
            r="4"
          />

          <circle
            cx="1213"
            cy="708"
            r="4"
          />

          <circle
            cx="720"
            cy="414"
            r="4.5"
            className={styles.primaryPoint}
          />

          <circle
            cx="646"
            cy="790"
            r="3.5"
            className={styles.secondaryPoint}
          />

          <circle
            cx="794"
            cy="790"
            r="3.5"
            className={styles.secondaryPoint}
          />
        </g>

        {/* ========================================================== */}
        {/* REGISTRATION NOTCHES                                       */}
        {/* ========================================================== */}

        <g
          className={styles.registrationNotches}
          fill="currentColor"
        >
          <rect
            x="137"
            y="160"
            width="18"
            height="2"
            rx="1"
          />

          <rect
            x="1285"
            y="160"
            width="18"
            height="2"
            rx="1"
          />

          <rect
            x="137"
            y="822"
            width="18"
            height="2"
            rx="1"
          />

          <rect
            x="1285"
            y="822"
            width="18"
            height="2"
            rx="1"
          />
        </g>
      </svg>

      {/* ============================================================ */}
      {/* HTML MICRO LABELS                                             */}
      {/* ============================================================ */}

      <div className={styles.fieldMetaLeft}>
        <span>Physical Vehicle</span>
        <span className={styles.metaLine} />
        <span>Identity Ready</span>
      </div>

      <div className={styles.fieldMetaRight}>
        <span>QR Identity</span>
        <span className={styles.metaLine} />
        <span>Safety View</span>
      </div>
    </div>
  );
}