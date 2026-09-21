/**
 * VaahanSafe Design System Tokens (v1.0)
 * Source of Truth: docs/architecture/design-system.md
 */

import { BRAND_COLORS, BRAND_MOTION } from "../brand/brand.constants";

export const designTokens = {
  version: "1.0",
  name: "VaahanSafe Warm Editorial Safety System",

  // 01. COLOR SYSTEM
  colors: {
    brand: {
      950: "#48271f",
      900: "#66372a",
      800: BRAND_COLORS.coralActive,
      700: "#b3654a",
      600: BRAND_COLORS.coral,
      500: "#d58d75",
      400: "#dfa791",
      300: "#e9c1af",
      200: "#f0d8cb",
      100: "#f5e9e0",
      50: BRAND_COLORS.soft,
      primary: BRAND_COLORS.coral,
      primaryHover: BRAND_COLORS.coralActive,
      primaryActive: BRAND_COLORS.coralActive,
      primarySoft: BRAND_COLORS.soft,
    },
    mint: {
      950: "#052E27",
      900: "#104E42",
      800: "#115E4E",
      700: "#0F765F",
      600: "#0D9675",
      500: "#16B98F",
      400: "#34D6AE",
      300: "#6EE7C8",
      200: "#A7F3DD",
      100: "#D1FAED",
      50: "#ECFDF8",
      signature: "#22D3A7",
      signatureSoft: "#D1FAED",
    },
    signal: {
      cyan: "#38BDF8",
      cyanSoft: "#E0F4FE",
      amber: BRAND_COLORS.amber,
      teal: BRAND_COLORS.teal,
      amberSoft: "#FFF4D6",
    },
    neutral: {
      1000: BRAND_COLORS.ink,
      950: BRAND_COLORS.dark,
      900: BRAND_COLORS.elevated,
      800: BRAND_COLORS.body,
      700: "#3f3f46",
      600: "#52525b",
      500: BRAND_COLORS.muted,
      400: "#a1a1aa",
      300: BRAND_COLORS.cream,
      200: "#e4e4e7",
      100: BRAND_COLORS.soft,
      50: BRAND_COLORS.canvas,
    },
    lightSurfaces: {
      canvas: BRAND_COLORS.canvas,
      surface: BRAND_COLORS.surface,
      surfaceSoft: BRAND_COLORS.soft,
      surfaceMuted: BRAND_COLORS.cream,
      surfaceElevated: BRAND_COLORS.canvas,
      ink: BRAND_COLORS.ink,
      body: BRAND_COLORS.body,
      bodyStrong: BRAND_COLORS.elevated,
      muted: BRAND_COLORS.muted,
      mutedSoft: "#a1a1aa",
      hairline: "#e4e4e7",
      hairlineStrong: BRAND_COLORS.cream,
    },
    darkSurfaces: {
      darkCanvas: BRAND_COLORS.dark,
      darkSurface: BRAND_COLORS.dark,
      darkSurfaceSoft: "#18181b",
      darkSurfaceElevated: BRAND_COLORS.elevated,
      darkBorder: "#27272a",
      darkBorderStrong: "#3f3f46",
      onDark: BRAND_COLORS.canvas,
      onDarkBody: "#d4d4d8",
      onDarkMuted: "#a1a1aa",
    },
    semantic: {
      success: BRAND_COLORS.success,
      successSoft: "#E8F8F0",
      warning: BRAND_COLORS.warning,
      warningSoft: "#FFF4DE",
      danger: BRAND_COLORS.emergency,
      dangerSoft: "#FDECEF",
      emergency: BRAND_COLORS.emergency,
      emergencyHover: "#a83a3a",
      emergencySoft: "#FDEBED",
      info: "#2684FF",
      infoSoft: "#EAF3FF",
    },
    onBrand: {
      onPrimary: "#FFFFFF",
      onSignature: "#071211",
      onEmergency: "#FFFFFF",
    },
  },

  // 02. COLOR PHILOSOPHY
  colorPhilosophy: {
    publicSite: {
      neutral: "70%",
      brand: "20%",
      signature: "7%",
      semantic: "3%",
    },
    customerApp: {
      neutral: "75%",
      brand: "15%",
      signature: "5%",
      semantic: "5%",
    },
    admin: { neutral: "85%", brand: "10%", semantic: "5%" },
    emergencyQr: { neutral: "90%", brand: "5%", semantic: "5%" },
    rules: [
      "Neutral space must dominate the interface.",
      "Do not make VaahanSafe a green website.",
      "Coral establishes brand identity and primary actions.",
      "Teal is a supporting signal, not the primary brand.",
      "Cyan is informational, never the primary brand color.",
      "Amber indicates attention, pending states, or selective editorial emphasis.",
      "Red is protected and never decorative.",
      "Emergency red is reserved for SOS, critical actions, destructive actions, failures, and genuine emergency states.",
      "Never communicate state using color alone.",
      "Combine semantic color with a Hugeicon and explicit text label.",
    ],
  },

  // 03. TYPOGRAPHY
  typography: {
    fontFamilies: {
      display: "Cormorant Garamond, Georgia, serif",
      sans: "Geist, Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono: "Geist Mono, JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    },
    scale: {
      displayXl: {
        fontSize: "72px",
        fontWeight: 600,
        lineHeight: 0.98,
        letterSpacing: "-0.045em",
      },
      displayLg: {
        fontSize: "56px",
        fontWeight: 600,
        lineHeight: 1.02,
        letterSpacing: "-0.04em",
      },
      displayMd: {
        fontSize: "42px",
        fontWeight: 600,
        lineHeight: 1.08,
        letterSpacing: "-0.035em",
      },
      displaySm: {
        fontSize: "32px",
        fontWeight: 600,
        lineHeight: 1.15,
        letterSpacing: "-0.025em",
      },
      titleXl: {
        fontSize: "26px",
        fontWeight: 600,
        lineHeight: 1.25,
        letterSpacing: "-0.02em",
      },
      titleLg: {
        fontSize: "22px",
        fontWeight: 600,
        lineHeight: 1.3,
        letterSpacing: "-0.015em",
      },
      titleMd: {
        fontSize: "18px",
        fontWeight: 600,
        lineHeight: 1.4,
        letterSpacing: "-0.01em",
      },
      titleSm: {
        fontSize: "16px",
        fontWeight: 600,
        lineHeight: 1.4,
        letterSpacing: "-0.005em",
      },
      bodyLg: {
        fontSize: "18px",
        fontWeight: 400,
        lineHeight: 1.65,
        letterSpacing: "-0.005em",
      },
      bodyMd: {
        fontSize: "16px",
        fontWeight: 400,
        lineHeight: 1.6,
        letterSpacing: "0",
      },
      bodySm: {
        fontSize: "14px",
        fontWeight: 400,
        lineHeight: 1.55,
        letterSpacing: "0",
      },
      label: {
        fontSize: "14px",
        fontWeight: 500,
        lineHeight: 1.4,
        letterSpacing: "-0.005em",
      },
      caption: {
        fontSize: "12px",
        fontWeight: 500,
        lineHeight: 1.4,
        letterSpacing: "0.02em",
      },
      overline: {
        fontSize: "11px",
        fontWeight: 600,
        lineHeight: 1.4,
        letterSpacing: "0.12em",
      },
      mono: {
        fontSize: "13px",
        fontWeight: 500,
        lineHeight: 1.5,
        letterSpacing: "0",
      },
      button: {
        fontSize: "14px",
        fontWeight: 600,
        lineHeight: 1,
        letterSpacing: "-0.005em",
      },
    },
  },

  // 05. SPACING
  spacing: {
    0: "0px",
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "20px",
    6: "24px",
    8: "32px",
    10: "40px",
    12: "48px",
    16: "64px",
    20: "80px",
    24: "96px",
    32: "128px",
    sectionMobile: "72px",
    sectionTablet: "96px",
    sectionDesktop: "120px",
    sectionLarge: "144px",
  },

  // 06. RADIUS
  rounded: {
    xs: "4px",
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    xxl: "20px",
    xxxl: "24px",
    pill: "9999px",
    full: "9999px",
  },

  // 07. SHADOWS
  shadows: {
    xs: "0 1px 2px rgba(7,18,17,0.04)",
    sm: "0 1px 2px rgba(7,18,17,0.04), 0 4px 12px rgba(7,18,17,0.035)",
    md: "0 2px 4px rgba(7,18,17,0.04), 0 12px 28px rgba(7,18,17,0.06)",
    lg: "0 4px 8px rgba(7,18,17,0.04), 0 20px 48px rgba(7,18,17,0.08)",
    focus: "0 0 0 3px rgba(32,169,155,0.18)",
  },

  // 08. MOTION
  motion: {
    brand: BRAND_MOTION,
    instant: "80ms",
    fast: "140ms",
    normal: "200ms",
    slow: "320ms",
    reveal: "480ms",
    easingStandard: "cubic-bezier(0.2, 0, 0, 1)",
    easingEnter: "cubic-bezier(0.16, 1, 0.3, 1)",
    easingExit: "cubic-bezier(0.4, 0, 1, 1)",
  },

  // 09. ICONS
  icons: {
    library: "Hugeicons",
    defaultSize: "20px",
    smallSize: "16px",
    mediumSize: "20px",
    largeSize: "24px",
    featureSize: "28px",
    heroSize: "32px",
    defaultColor: "currentColor",
  },

  // 11. COMPONENT TOKENS
  components: {
    buttonPrimary: {
      backgroundColor: "#0D4844",
      textColor: "#FFFFFF",
      height: "44px",
      padding: "0 20px",
      rounded: "8px",
    },
    buttonPrimaryHover: {
      backgroundColor: "#105752",
      textColor: "#FFFFFF",
    },
    buttonPrimaryActive: {
      backgroundColor: "#063B3B",
      textColor: "#FFFFFF",
    },
    buttonSecondary: {
      backgroundColor: "#FFFFFF",
      textColor: "#101817",
      borderColor: "#DCE5E2",
      height: "44px",
      padding: "0 20px",
      rounded: "8px",
    },
    buttonGhost: {
      backgroundColor: "transparent",
      textColor: "#263330",
      height: "40px",
      padding: "0 14px",
      rounded: "8px",
    },
    buttonEmergency: {
      backgroundColor: "#E02D3C",
      textColor: "#FFFFFF",
      minHeight: "48px",
      padding: "0 24px",
      rounded: "8px",
    },
    buttonEmergencyHover: {
      backgroundColor: "#C92331",
      textColor: "#FFFFFF",
    },
    textInput: {
      backgroundColor: "#FFFFFF",
      textColor: "#101817",
      borderColor: "#DCE5E2",
      height: "44px",
      padding: "0 14px",
      rounded: "8px",
    },
    standardCard: {
      backgroundColor: "#FFFFFF",
      textColor: "#101817",
      borderColor: "#DCE5E2",
      rounded: "12px",
      padding: "24px",
    },
    featureCard: {
      backgroundColor: "#FFFFFF",
      textColor: "#101817",
      borderColor: "#DCE5E2",
      rounded: "16px",
      padding: "32px",
    },
    featureCardSoft: {
      backgroundColor: "#EFF4F2",
      textColor: "#101817",
      rounded: "16px",
      padding: "32px",
    },
    darkProductCard: {
      backgroundColor: "#0C1917",
      textColor: "#EDF7F4",
      borderColor: "#20312D",
      rounded: "20px",
      padding: "32px",
    },
    emergencyCard: {
      backgroundColor: "#FFFFFF",
      textColor: "#101817",
      borderColor: "#DCE5E2",
      rounded: "12px",
      padding: "20px",
    },
  },

  // 22. QR LIFECYCLE SEMANTICS
  qrStatus: {
    printed: { semantic: "neutral", label: "Printed" },
    inTransitDistributor: {
      semantic: "info",
      label: "In Transit to Distributor",
    },
    withDistributor: { semantic: "info", label: "With Distributor" },
    withRetailer: { semantic: "info", label: "With Retailer" },
    sold: { semantic: "warning", label: "Sold" },
    activated: { semantic: "success", label: "Activated" },
    expiredUnsold: { semantic: "muted", label: "Expired Unsold" },
    lostDamaged: { semantic: "danger", label: "Lost / Damaged" },
    replaced: { semantic: "neutral", label: "Replaced" },
  },

  // 23. PAYMENT STATUS SEMANTICS
  paymentStatus: {
    created: { semantic: "neutral", label: "Created" },
    pending: { semantic: "warning", label: "Pending Verification" },
    processing: { semantic: "info", label: "Processing" },
    paid: { semantic: "success", label: "Paid" },
    failed: { semantic: "danger", label: "Failed" },
    refunded: { semantic: "neutral", label: "Refunded" },
    partialRefund: { semantic: "warning", label: "Partial Refund" },
  },

  // 24. CONNECTION STATUS SEMANTICS
  connectionStatus: {
    checking: { semantic: "neutral", label: "Checking Connection" },
    online: { semantic: "success", label: "Online" },
    degraded: { semantic: "warning", label: "Degraded" },
    offline: { semantic: "danger", label: "Offline" },
    reconnected: { semantic: "success", label: "Reconnected" },
  },

  // 25. SYSTEM ERROR CODES
  systemStates: [
    "400",
    "401",
    "403",
    "404",
    "408",
    "409",
    "429",
    "500",
    "502",
    "503",
  ] as const,
} as const;

export type DesignTokens = typeof designTokens;
