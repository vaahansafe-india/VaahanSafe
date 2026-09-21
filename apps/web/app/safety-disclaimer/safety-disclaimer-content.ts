/**
 * VAAHANSAFE SAFETY DISCLAIMER CONTENT ARCHITECTURE
 *
 * This structured content module establishes the foundational boundaries,
 * medical non-warranties, and emergency services disclaimers for the platform.
 *
 * CORE SAFETY PRINCIPLE:
 * VAAHANSAFE HELPS PRESENT AND CONNECT INFORMATION.
 * VAAHANSAFE IS NOT AN EMERGENCY SERVICE.
 *
 * SIGNATURE THREE-WAY BOUNDARY:
 * 1. SAFETY INFORMATION ≠ MEDICAL RECORD
 * 2. VAAHANSAFE IDENTITY ≠ GOVERNMENT IDENTITY
 * 3. CONTACT OPTION ≠ EMERGENCY DISPATCH
 *
 * IMPORTANT LEGAL NOTE:
 * Text contained herein reflects product architecture, user-controlled data models,
 * and emergency communication boundaries under Indian law. Specific statutory disclaimers
 * must be formally validated by qualified legal counsel prior to final regulatory deposition.
 */

export interface SafetyDisclaimerMetadata {
  readonly title: string;
  readonly subtitle: string;
  readonly documentId: string;
  readonly effectiveDate: string;
  readonly lastUpdated: string;
  readonly version: string;
  readonly status: "DRAFT_PENDING_LEGAL_REVIEW" | "ACTIVE";
}

// LEGAL REVIEW REQUIRED:
// Confirm exact disclaimer effective date and version numbers prior to formal publication.
export const SAFETY_DISCLAIMER_META: SafetyDisclaimerMetadata = {
  title: "Safety Disclaimer",
  subtitle: "Vehicle Safety Identity Platform for India",
  documentId: "DOCUMENT / 05",
  effectiveDate: "March 15, 2026",
  lastUpdated: "March 15, 2026",
  version: "1.0",
  status: "DRAFT_PENDING_LEGAL_REVIEW",
} as const;

export interface JourneyStep {
  readonly index: string;
  readonly label: string;
  readonly description: string;
}

export const SAFETY_JOURNEY_STEPS: readonly JourneyStep[] = [
  {
    index: "01",
    label: "SCAN",
    description: "Camera scans physical vehicle QR decal",
  },
  {
    index: "02",
    label: "IDENTIFY",
    description: "VaahanSafe vehicle identity resolved via secure domain",
  },
  {
    index: "03",
    label: "VIEW",
    description: "Selected safety information & emergency context presented",
  },
  {
    index: "04",
    label: "CONNECT",
    description: "Available contact options initiated via civilian telecommunications",
  },
] as const;

export interface CapabilityItem {
  readonly title: string;
  readonly summary: string;
  readonly description: string;
}

export const WHAT_VAAHANSAFE_DOES: readonly CapabilityItem[] = [
  {
    title: "IDENTIFY",
    summary: "Vehicle identity access point",
    description:
      "Provides a secure, scannable physical interface that resolves to the designated vehicle profile.",
  },
  {
    title: "INFORM",
    summary: "Owner-configured safety context",
    description:
      "Presents supported roadside safety details (blood group, vehicle context, safety notes) chosen by the owner.",
  },
  {
    title: "CONNECT",
    summary: "Civilian relay communications",
    description:
      "Facilitates owner-configured emergency contact dials and notifications through telecom networks.",
  },
  {
    title: "CONTROL",
    summary: "Continuous privacy toggles",
    description:
      "Allows the account holder to update visibility settings and discretionary medical markers in real time.",
  },
] as const;

export const NON_REPLACEMENT_ENTITIES: readonly string[] = [
  "Police or Law Enforcement Authorities",
  "Ambulance Services & Paramedic Responders",
  "Fire and Rescue Emergency Units",
  "Hospitals & Urgent Care Facilities",
  "Doctors & Qualified Medical Professionals",
  "Motor Insurance Carriers & Claims Assessors",
  "Highway Patrol & Roadside Traffic Authorities",
  "National Emergency Response Systems (112, 100, 108)",
  "Judicial & Legal Authorities",
  "Motor Vehicle Manufacturers & Dealerships",
] as const;

export interface SafetySubsection {
  readonly id: string;
  readonly title: string;
  readonly paragraphs: readonly string[];
  readonly bulletPoints?: readonly string[];
  readonly legalReviewNote?: string;
}

export interface SafetySection {
  readonly index: string;
  readonly id: string;
  readonly shortTitle: string;
  readonly heading: string;
  readonly summary: string;
  readonly subsections: readonly SafetySubsection[];
}

export const SAFETY_SECTIONS: readonly SafetySection[] = [
  {
    index: "01",
    id: "core-disclaimer",
    shortTitle: "Core Role",
    heading: "VaahanSafe is a connection tool, not an emergency response service",
    summary:
      "VaahanSafe is designed to make supported vehicle and owner-selected safety information available through a vehicle QR experience.",
    subsections: [
      {
        id: "core-disclaimer-scope",
        title: "Connection Aid Only",
        paragraphs: [
          "VaahanSafe is an auxiliary identification and civilian communication platform. It does not dispatch police, ambulances, fire rescue teams, medical practitioners, or emergency responders unless a specific, separately documented service explicitly provides such functionality under a formal contract.",
          "In an emergency, collision, personal injury, or crime, bystanders and responders must dial the appropriate national emergency authorities (112, 100, 108) directly before attempting digital identity interactions.",
        ],
      },
    ],
  },
  {
    index: "02",
    id: "what-vaahan-does",
    shortTitle: "Capabilities",
    heading: "What VaahanSafe can help with",
    summary:
      "Understanding the exact functional capabilities provided by the vehicle identity platform.",
    subsections: [
      {
        id: "capabilities-overview",
        title: "Four Supported Functional Pillars",
        paragraphs: [
          "VaahanSafe operates strictly within defined digital identification and civilian communication parameters:",
        ],
        bulletPoints: [
          "Identify: Resolves a physical sticker to its assigned digital vehicle safety profile.",
          "Inform: Displays verified vehicle context and owner-selected emergency safety markers.",
          "Connect: Provides tap-to-call or SMS relay options to reach designated civilian emergency contacts.",
          "Control: Enables vehicle owners to manage discretionary fields and visibility settings dynamically.",
        ],
      },
    ],
  },
  {
    index: "03",
    id: "what-vaahan-does-not-do",
    shortTitle: "Non-Replacement",
    heading: "What VaahanSafe does not replace",
    summary:
      "A clear, professional boundary separating digital identification from emergency services and medical authorities.",
    subsections: [
      {
        id: "ten-non-replacements",
        title: "Ten Non-Replacement Boundaries",
        paragraphs: [
          "VaahanSafe is never a replacement for official public safety, healthcare, legal, or automotive authorities. Specifically, the platform does not replace:",
        ],
        bulletPoints: [
          "01 Police or law enforcement authorities",
          "02 Ambulance services & emergency medical responders",
          "03 Fire and rescue teams",
          "04 Hospitals and clinical emergency rooms",
          "05 Doctors or medical professionals",
          "06 Insurance providers or roadside survey teams",
          "07 Roadside traffic and transport authorities",
          "08 Government emergency dispatch systems",
          "09 Legal or judicial authorities",
          "10 Vehicle manufacturers or maintenance warranties",
        ],
      },
    ],
  },
  {
    index: "04",
    id: "information-accuracy",
    shortTitle: "Data Accuracy",
    heading: "Safety information may be user-provided",
    summary:
      "Safety profile details are entered and maintained directly by the vehicle owner without independent verification.",
    subsections: [
      {
        id: "user-provided-data",
        title: "No Independent Verification of User Data",
        paragraphs: [
          "Information rendered through a VaahanSafe safety view—such as blood group indicators, emergency contact numbers, insurance policy tags, and safety notes—is supplied, selected, and updated by the vehicle owner.",
          "VaahanSafe does not verify clinical blood group compatibility, confirm medical diagnoses, or independently inspect vehicle ownership against transport authority databases. Responders and bystanders should exercise professional judgment and not treat user-provided notes as formal medical or legal certifications.",
        ],
      },
    ],
  },
  {
    index: "05",
    id: "blood-group-medical",
    shortTitle: "Medical Notes",
    heading: "Blood group and medical information notice",
    summary:
      "Medical indicators displayed on a safety view are informational context only.",
    subsections: [
      {
        id: "blood-group-disclaimer",
        title: "Informational Purpose Only",
        paragraphs: [
          "Any blood group marker, allergy notification, or medical safety note displayed through VaahanSafe is provided solely for auxiliary context and civilian awareness.",
          "Medical practitioners, paramedics, and first responders must not administer blood transfusions, prescription medications, or clinical treatments solely on the basis of a displayed QR marker without standard professional laboratory cross-matching and clinical verification.",
        ],
        legalReviewNote:
          "LEGAL REVIEW REQUIRED: Confirm medical disclaimer language conforms to healthcare provider standards.",
      },
    ],
  },
  {
    index: "06",
    id: "emergency-contacts",
    shortTitle: "Contacts",
    heading: "Emergency contact availability",
    summary:
      "Listing an emergency contact does not guarantee availability, network reach, or immediate response.",
    subsections: [
      {
        id: "contact-availability-disclaimer",
        title: "Non-Guarantee of Contact Response",
        paragraphs: [
          "Displaying an emergency contact number on a safety view does not guarantee that the individual will answer, that their handset is reachable, that they possess medical qualifications, or that they are in a geographic position to assist.",
          "Call and SMS notifications depend on third-party telecommunications networks and carrier signal availability.",
        ],
      },
    ],
  },
  {
    index: "07",
    id: "qr-scanning-dependencies",
    shortTitle: "Scanning",
    heading: "Technical QR scanning dependencies",
    summary:
      "QR resolution requires compatible camera hardware, web connectivity, and clear optical conditions.",
    subsections: [
      {
        id: "scanning-technical-factors",
        title: "External Scanning Conditions",
        paragraphs: [
          "Successful scanning of a physical decal depends on external variables, including smartphone camera autofocus capabilities, ambient lighting, cellular network data connectivity, web browser compatibility, and physical sticker condition.",
          "VaahanSafe does not warrant that every scanning attempt will succeed under all atmospheric or optical conditions.",
        ],
      },
    ],
  },
  {
    index: "08",
    id: "service-availability",
    shortTitle: "Availability",
    heading: "Digital services can experience maintenance or outages",
    summary:
      "We design for continuous readiness but do not promise zero downtime or emergency-grade uptime guarantees.",
    subsections: [
      {
        id: "platform-uptime-standards",
        title: "Maintenance & Network Availability",
        paragraphs: [
          "Access to online safety views, QR resolver redirection, and automated relay messaging may be affected by scheduled maintenance, telecommunications routing failures, or unexpected upstream cloud outages.",
          "VaahanSafe does not provide 100% uninterrupted uptime guarantees or emergency-grade telecommunications SLAs. Real-time platform operational status is published on our official Service Status page.",
        ],
      },
    ],
  },
  {
    index: "09",
    id: "placement-condition",
    shortTitle: "Condition",
    heading: "Decal condition, placement, and weathering",
    summary:
      "Physical sticker placement must comply with safety regulations and avoid obstructing driver visibility.",
    subsections: [
      {
        id: "placement-responsibility",
        title: "Adherence to Placement Instructions",
        paragraphs: [
          "Vehicle owners are responsible for affixing the sticker in accordance with supplied placement instructions and local motor vehicle safety laws. Stickers must never be positioned to obstruct driver sightlines, windshield wiper arcs, or vehicle illumination equipment.",
          "Surface weathering, road grime, pressure washing, or mechanical abrasion may degrade QR scannability over time, requiring sticker replacement.",
        ],
      },
    ],
  },
  {
    index: "10",
    id: "boundaries-matrix",
    shortTitle: "Boundaries",
    heading: "Three fundamental platform boundaries",
    summary:
      "Clarifying that VaahanSafe is not a medical record, government ID, or emergency dispatch tool.",
    subsections: [
      {
        id: "three-key-boundaries",
        title: "Signature Structural Boundaries",
        paragraphs: [
          "To avoid any misunderstanding of the platform's legal and functional scope, three definitive boundaries govern all VaahanSafe interactions:",
        ],
        bulletPoints: [
          "Safety Information ≠ Medical Record: Optional safety notes are owner-entered context, not certified clinical electronic health records.",
          "VaahanSafe Identity ≠ Government Identity: The safety identity does not replace HSRP plates, government registration certificates (RC), or official driving licenses.",
          "Contact Option ≠ Emergency Dispatch: Initiating a phone call through the safety view dials a civilian contact; it does not dispatch emergency response units.",
        ],
      },
    ],
  },
  {
    index: "11",
    id: "user-responsibilities",
    shortTitle: "User Duty",
    heading: "Keeping safety information useful and accurate",
    summary:
      "The value of a vehicle safety identity relies entirely on owner diligence in maintaining current records.",
    subsections: [
      {
        id: "user-obligations-safety",
        title: "Owner Maintenance Obligations",
        paragraphs: [
          "Vehicle owners must keep emergency contact numbers current, verify consent from listed emergency contacts, provide accurate vehicle identifiers, and avoid posting misleading safety notes.",
          "For complete legal obligations, review our Terms of Service at vaahansafe.com/terms.",
        ],
      },
    ],
  },
  {
    index: "12",
    id: "emergency-action",
    shortTitle: "In Emergency",
    heading: "What to do in an actual emergency",
    summary:
      "Immediate life safety always takes precedence over digital QR interactions.",
    subsections: [
      {
        id: "emergency-protocol-action",
        title: "National Emergency Priority",
        paragraphs: [
          "CRITICAL DIRECTIVE: If an accident involves severe personal injury, fire, ongoing crime, or immediate threat to life, bystanders must immediately call National Emergency Services (112, 100, 108) before attempting any secondary digital checks.",
          "VaahanSafe may provide helpful vehicle context once emergency authorities have been notified, but interacting with a QR sticker should never delay calling qualified first responders.",
        ],
      },
    ],
  },
] as const;
