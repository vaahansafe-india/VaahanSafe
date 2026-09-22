/**
 * VAAHANSAFE PRIVACY POLICY CONTENT ARCHITECTURE
 *
 * This structured content module decouples formal legal text and category
 * taxonomy from UI rendering components.
 *
 * IMPORTANT LEGAL NOTE:
 * Text contained herein reflects product architecture and privacy-by-choice design.
 * Specific statutory references, retention periods, age limits, and legal terms
 * must be formally confirmed by qualified legal counsel before production publication.
 */

export interface PolicyMetadata {
  readonly title: string;
  readonly subtitle: string;
  readonly documentId: string;
  readonly effectiveDate: string;
  readonly lastUpdated: string;
  readonly version: string;
  readonly status: "DRAFT_PENDING_LEGAL_REVIEW" | "ACTIVE";
}

// LEGAL REVIEW REQUIRED:
// Confirm exact policy effective date and version numbers prior to formal regulatory submission.
export const PRIVACY_POLICY_META: PolicyMetadata = {
  title: "Privacy Policy",
  subtitle: "Vehicle Safety Identity for India",
  documentId: "DOCUMENT / 01",
  effectiveDate: "March 15, 2026",
  lastUpdated: "March 15, 2026",
  version: "1.0",
  status: "DRAFT_PENDING_LEGAL_REVIEW",
} as const;

export interface PolicySubsection {
  readonly id: string;
  readonly title: string;
  readonly paragraphs: readonly string[];
  readonly bulletPoints?: readonly string[];
  readonly legalReviewNote?: string;
}

export interface PolicySection {
  readonly index: string;
  readonly id: string;
  readonly shortTitle: string;
  readonly heading: string;
  readonly summary: string;
  readonly subsections: readonly PolicySubsection[];
}

export const POLICY_SECTIONS: readonly PolicySection[] = [
  {
    index: "01",
    id: "introduction",
    shortTitle: "Introduction",
    heading: "Privacy at VaahanSafe",
    summary:
      "This Privacy Policy explains how VaahanSafe handles information across your account, vehicle identity, QR activation, public safety view, and related services.",
    subsections: [
      {
        id: "intro-core-principle",
        title: "Core Privacy Principle: Private Account vs. Selective Safety View",
        paragraphs: [
          "VaahanSafe is built around a deliberate architecture: your underlying account and sensitive personal records remain private, while you retain continuous control over the limited safety details made accessible when your vehicle's physical QR is scanned.",
          "We believe vehicle safety should not require exposing your residential address, private travel history, or complete personal profile to every person who scans a sticker on your vehicle.",
        ],
      },
      {
        id: "intro-scope",
        title: "Scope of This Policy",
        paragraphs: [
          "This policy applies to individuals who access our public web portal (vaahansafe.com), activate physical stickers (activate.vaahansafe.com), scan registered QR codes (qr.vaahansafe.com), or manage their vehicles through the customer application (app.vaahansafe.com).",
          "By accessing or using any VaahanSafe service, you acknowledge the handling of information described in this policy.",
        ],
      },
    ],
  },
  {
    index: "02",
    id: "information-we-collect",
    shortTitle: "Information We Collect",
    heading: "Information we handle",
    summary:
      "VaahanSafe handles distinct categories of information necessary to maintain account security, verify physical sticker ownership, and present your configured safety view.",
    subsections: [
      {
        id: "category-account",
        title: "Account Information",
        paragraphs: [
          "When you register an account with VaahanSafe, we collect information necessary to authenticate your identity and administer your services.",
        ],
        bulletPoints: [
          "Verified mobile phone number (used for one-time passcodes and urgent relay notifications)",
          "Account name or display moniker",
          "Email address (optional or required based on notification preferences)",
          "Authentication credentials and active session state tokens",
        ],
      },
      {
        id: "category-vehicle",
        title: "Vehicle Information",
        paragraphs: [
          "To link a physical QR sticker to a vehicle, we handle basic vehicle contextual information supplied during onboarding or management.",
        ],
        bulletPoints: [
          "Vehicle type and category (e.g., Two-Wheeler, Four-Wheeler, Commercial, Helmet)",
          "Vehicle registration number or nickname",
          "Make, model, and color for visual recognition by responders",
        ],
      },
      {
        id: "category-safety-profile",
        title: "Safety Profile & Emergency Contacts",
        paragraphs: [
          "You choose what supported safety information to attach to your vehicle's identity. These items are strictly controlled by your configuration.",
        ],
        bulletPoints: [
          "Primary and secondary emergency contact names and phone numbers",
          "Blood group (optional, provided solely for medical emergency assistance)",
          "Important safety or medical notes (e.g., allergies, critical vehicle emergency notes)",
          "Privacy projection settings designating which fields are active on the public safety view",
        ],
      },
      {
        id: "category-qr-identity",
        title: "QR Identity & Activation Data",
        paragraphs: [
          "Every physical sticker possesses unique technical metadata separating its public lookup locator from its ownership verification credentials.",
        ],
        bulletPoints: [
          "Public QR Identifier (the random, non-sequential alphanumeric string physically printed and encoded in the QR code)",
          "Sticker lifecycle state (e.g., manufactured, in-transit, activated, suspended, replaced)",
          "Verification timestamp and activation proof submitted during initial retail or online setup",
        ],
      },
      {
        id: "category-transactions",
        title: "Order & Shipping Information",
        paragraphs: [
          "If you purchase a VaahanSafe physical kit or renewal plan directly from our web portal, we process details required to fulfill delivery.",
        ],
        bulletPoints: [
          "Shipping address and pin code for physical sticker packet delivery",
          "Transaction status and payment processor confirmation reference (payment card and banking credentials are handled directly by PCI-compliant payment partners; VaahanSafe does not store full card numbers or UPI PINs)",
          "Order history and subscription entitlement status",
        ],
      },
      {
        id: "category-telemetry",
        title: "Service Activity & Scanner Interaction",
        paragraphs: [
          "When a QR code is scanned by a third party (such as a helpful bystander, parking attendant, or emergency responder), our resolver logs minimal diagnostic information.",
        ],
        bulletPoints: [
          "Timestamp of the scan event",
          "Masked IP address and generalized browser user-agent for fraud prevention and abuse protection",
          "Relay action triggered (e.g., call initiated, parking alert sent) to notify the owner of interaction",
        ],
        legalReviewNote:
          "LEGAL REVIEW REQUIRED: Confirm diagnostic log retention intervals with engineering operations.",
      },
    ],
  },
  {
    index: "03",
    id: "how-we-use-information",
    shortTitle: "How We Use Information",
    heading: "Purpose limitation and service delivery",
    summary:
      "We process information solely for specific, legitimate purposes linked directly to operating the vehicle safety identity platform.",
    subsections: [
      {
        id: "use-purposes",
        title: "Authorized Processing Purposes",
        paragraphs: [
          "Information collected by VaahanSafe is used exclusively for the following purposes:",
        ],
        bulletPoints: [
          "Generating and resolving the configured Public Safety View upon authorized QR scan",
          "Routing masked voice or SMS notifications between vehicle discoverers and owners without exposing direct personal phone numbers unless explicitly designated",
          "Verifying sticker authenticity and ownership during retail kit activation",
          "Processing fulfillment, shipping, and replacement of physical reflective QR decals",
          "Detecting fraudulent scans, bot scanning attacks, and unauthorized claim attempts",
          "Communicating critical service announcements, security alerts, and subscription status updates",
          "Complying with applicable laws, judicial orders, and regulatory directives in India",
        ],
      },
      {
        id: "use-no-selling",
        title: "No Data Selling or Advertising Networks",
        paragraphs: [
          "VaahanSafe does not sell, rent, or lease your personal information, emergency contacts, or vehicle details to third-party data brokers or marketing aggregators.",
          "Your safety profile is processed exclusively to deliver emergency connectivity and vehicle identity services.",
        ],
      },
    ],
  },
  {
    index: "04",
    id: "safety-view-boundary",
    shortTitle: "Public Safety View",
    heading: "The public safety view is not your account",
    summary:
      "When someone scans your vehicle QR sticker, they see only the specific safety details you have configured—never your private account, home address, or billing records.",
    subsections: [
      {
        id: "boundary-explanation",
        title: "The Architectural Privacy Boundary",
        paragraphs: [
          "A fundamental principle of VaahanSafe is the strict separation between your Private Account and your Public Safety View. Scanning your QR code loads a lightweight, read-only resolver interface (qr.vaahansafe.com).",
          "The resolver does not require the finder to log in or create an account to view emergency instructions, ensuring immediate availability during an accident or parking obstruction.",
          "Your residential address, billing records, payment methods, login credentials, and unlinked personal vehicles are architecturally isolated and never exposed through the QR resolver.",
        ],
      },
      {
        id: "boundary-owner-control",
        title: "Granular Visibility Choices",
        paragraphs: [
          "Through the VaahanSafe customer application, you determine which emergency information fields are projected on the public view.",
          "For example, you may choose to display an emergency contact phone number, route calls through our relay system, or show only essential medical notes like blood group.",
        ],
      },
    ],
  },
  {
    index: "05",
    id: "qr-activation-privacy",
    shortTitle: "QR Activation & Ownership",
    heading: "Public QR identity vs. Activation credentials",
    summary:
      "Scanning a public QR code allows viewing the safety profile, but does not grant the right to claim, modify, or transfer vehicle ownership.",
    subsections: [
      {
        id: "activation-separation",
        title: "Separation of Public Identifier and Claim Proof",
        paragraphs: [
          "In both retail stickers and online-purchased kits, the public QR code represents a public locator only. It does not contain or encode the secret credentials needed to activate or claim the sticker.",
          "For retail packs, ownership verification requires physically scratching or revealing a separate, concealed activation token that is permanently linked to the sticker in our manufacturing database.",
          "Once activated, that activation credential is invalidated and cannot be reused by another party to hijack your vehicle's identity.",
        ],
      },
      {
        id: "replacement-handling",
        title: "Replacement Stickers & Transfer",
        paragraphs: [
          "In the event of vehicle sale, windshield replacement, or decal wear, replacement stickers follow a strict re-authentication and de-linking workflow to ensure old public locators are securely retired.",
        ],
        legalReviewNote:
          "LEGAL REVIEW REQUIRED: Align replacement de-linking language with the final fulfilment and replacement SLA policy.",
      },
    ],
  },
  {
    index: "06",
    id: "when-information-is-shared",
    shortTitle: "Information Sharing",
    heading: "When information may be shared",
    summary:
      "We share information with external entities strictly as necessary to execute requested transactions, deliver emergency relays, or comply with legal mandates.",
    subsections: [
      {
        id: "sharing-providers",
        title: "Service Providers and Infrastructure Partners",
        paragraphs: [
          "We engage reputable technology and operational vendors who process information under contractual confidentiality and security commitments:",
        ],
        bulletPoints: [
          "Telecommunications and SMS Providers: To deliver one-time verification passcodes, emergency alerts, and vehicle notification relays (e.g., MSG91 or equivalent certified telecom partners).",
          "Payment Processing Partners: To process payment transactions in compliance with Reserve Bank of India (RBI) tokenization guidelines (e.g., Razorpay / authorized payment partners).",
          "Cloud & Content Delivery Infrastructure: To host edge resolver instances and distributed databases with high uptime and low latency across India (e.g., Cloudflare Inc.).",
          "Courier & Logistics Partners: To deliver physical reflective QR sticker packages to your designated shipping destination.",
        ],
      },
      {
        id: "sharing-legal",
        title: "Legal Obligations and Emergency Protection",
        paragraphs: [
          "We may disclose records if required to do so by applicable law, warrant, court order, or formal request from lawful authorities in India.",
          "We may also disclose necessary details in good faith where we reasonably believe disclosure is critical to prevent imminent physical harm, preserve life in emergency response scenarios, or defend the integrity of our platform against malicious attacks.",
        ],
      },
    ],
  },
  {
    index: "07",
    id: "data-retention",
    shortTitle: "Data Retention",
    heading: "Information lifecycle and retention",
    summary:
      "We retain information only as long as necessary to provide active vehicle safety services, resolve disputes, and fulfill statutory tax and legal obligations.",
    subsections: [
      {
        id: "retention-lifecycle",
        title: "Retention Principles",
        paragraphs: [
          "Account & Vehicle Records: Maintained for the duration of your active vehicle registration and customer relationship with VaahanSafe.",
          "Emergency Contact Data: Stored while configured by you and immediately removed from the active public resolver upon account deletion or vehicle de-registration.",
          "Transaction & Billing Records: Retained in accordance with Indian commercial, accounting, and tax compliance requirements.",
          "Operational Diagnostic Logs: Retained on a rolling, time-bounded schedule to monitor service availability and combat automated malicious traffic.",
        ],
        legalReviewNote:
          "LEGAL REVIEW REQUIRED: Confirm specific retention durations under statutory tax and digital data governance guidelines before finalizing.",
      },
    ],
  },
  {
    index: "08",
    id: "security-and-protection",
    shortTitle: "Security & Protection",
    heading: "Protecting your account and vehicle identity",
    summary:
      "VaahanSafe implements administrative, technical, and physical safeguards designed to protect personal and emergency data against unauthorized access, loss, or misuse.",
    subsections: [
      {
        id: "security-measures",
        title: "Security Safeguards",
        paragraphs: [
          "All communication across our web portal, customer application, activation flows, and QR resolvers is encrypted in transit using industry-standard Transport Layer Security (TLS 1.3).",
          "Customer accounts are protected by multi-factor authentication via cryptographically generated One-Time Passcodes (OTP) sent to verified mobile numbers.",
          "Database access is restricted using strict role-based access controls (RBAC) and least-privilege security boundaries across internal operations.",
        ],
      },
      {
        id: "security-honest-disclaimer",
        title: "Honest Limitation on Absolute Security",
        paragraphs: [
          "While we take rigorous measures to safeguard your vehicle identity and personal information, no online service or method of electronic storage can guarantee absolute security.",
          "We urge you to protect your phone, never disclose your OTPs or concealed retail activation scratch codes, and notify us immediately if you suspect unauthorized access to your account.",
        ],
      },
    ],
  },
  {
    index: "09",
    id: "your-choices-and-rights",
    shortTitle: "Your Choices & Rights",
    heading: "Your information should remain understandable and manageable",
    summary:
      "You hold direct control over your vehicle identity, emergency profile visibility, and personal account data.",
    subsections: [
      {
        id: "rights-actions",
        title: "Actionable Privacy Controls",
        paragraphs: [
          "Through the VaahanSafe Customer Portal (app.vaahansafe.com), you can exercise the following choices at any time:",
        ],
        bulletPoints: [
          "Access & Review: Inspect all personal, vehicle, and emergency details associated with your account.",
          "Update & Rectify: Modify emergency contact details, blood group, vehicle identifiers, or notification preferences.",
          "Toggle Visibility: Enable or disable specific fields from appearing on the public QR scan screen.",
          "Suspend or Replace: Temporarily pause public resolver responses or unlink a retired sticker.",
          "Account Deletion: Request complete closure of your account and purge of non-statutory personal records.",
        ],
      },
      {
        id: "rights-dpdp-note",
        title: "Statutory Rights in India",
        paragraphs: [
          "Users in India are entitled to seek clarification, access, correction, and grievance redressal regarding the processing of their digital personal data in accordance with applicable Indian privacy regulations.",
        ],
        legalReviewNote:
          "LEGAL REVIEW REQUIRED: Incorporate exact statutory grievance officer contact details and DPDP Act provisions once implementation rules are notified.",
      },
    ],
  },
  {
    index: "10",
    id: "third-party-services",
    shortTitle: "Third-Party Services",
    heading: "Third-party services and links",
    summary:
      "Our services interface with specialized infrastructure partners for payments, telecommunications, and mapping.",
    subsections: [
      {
        id: "third-party-overview",
        title: "External Services Context",
        paragraphs: [
          "When you interact with third-party payment gateways, courier tracking links, or external status pages, those third parties operate under their respective privacy policies.",
          "We encourage you to review the privacy documentation of any external service provider you interact with outside the direct vaahansafe.com domain perimeter.",
        ],
      },
    ],
  },
  {
    index: "11",
    id: "childrens-privacy",
    shortTitle: "Children's Privacy",
    heading: "Protection of minors",
    summary:
      "VaahanSafe is designed for adult vehicle owners, drivers, and registered guardians.",
    subsections: [
      {
        id: "children-policy",
        title: "Minimum Age and Parental Responsibility",
        paragraphs: [
          "Our services are intended for individuals who have reached the age of majority and are legally permitted to operate motor vehicles or hold property titles under Indian law.",
          "We do not knowingly solicit or collect personal information from individuals under the legal age threshold. If you become aware that a child has provided us with personal information without parental consent, please contact us for immediate deletion.",
        ],
        legalReviewNote:
          "LEGAL REVIEW REQUIRED: Confirm specific age threshold under DPDP Act provisions (18 years) and parental consent requirements for minor-operated vehicles.",
      },
    ],
  },
  {
    index: "12",
    id: "changes-to-policy",
    shortTitle: "Changes to Policy",
    heading: "Revisions and update notices",
    summary:
      "We may update this Privacy Policy periodically to reflect enhancements in vehicle safety features, regulatory directives, or operational practices.",
    subsections: [
      {
        id: "changes-procedure",
        title: "Revision Procedures",
        paragraphs: [
          "When changes are made, we will update the 'Effective Date' and 'Version' metadata at the top and bottom of this document.",
          "For material modifications that meaningfully alter how we handle your personal information, we will provide prominent notice through the customer application or via SMS/email notification prior to the change becoming effective.",
          "Your continued use of VaahanSafe following notification of updates constitutes acknowledgment of the revised Privacy Policy.",
        ],
      },
    ],
  },
  {
    index: "13",
    id: "contact-and-requests",
    shortTitle: "Contact & Requests",
    heading: "Questions about your information?",
    summary:
      "If you have a question, request, or concern regarding your privacy or data handling, reach out to our dedicated privacy and grievance desk.",
    subsections: [
      {
        id: "contact-channels",
        title: "Official Communication Channels",
        paragraphs: [
          "We are committed to addressing privacy inquiries promptly and transparently. You may contact us through our official support and grievance channels:",
        ],
        bulletPoints: [
          "Privacy Desk: support@vaahansafe.com (Subject: 'Privacy Inquiry')",
          "Grievance Officer: Designated under Indian IT and Digital Data Protection guidelines (Contact via support portal)",
          "Postal Communications: VaahanSafe Technologies, Customer Care & Privacy Desk, India",
        ],
        legalReviewNote:
          "LEGAL REVIEW REQUIRED: Insert registered corporate address and named Grievance Officer details before production release.",
      },
    ],
  },
] as const;

export interface PrivacyChoiceItem {
  readonly index: string;
  readonly title: string;
  readonly description: string;
  readonly actionLabel: string;
  readonly href: string;
  readonly isExternal?: boolean;
}

export const PRIVACY_CHOICES_ITEMS: readonly PrivacyChoiceItem[] = [
  {
    index: "01",
    title: "Account Information",
    description: "Inspect verified phone numbers, names, and profile information.",
    actionLabel: "Open Account",
    href: "https://app.vaahansafe.com",
    isExternal: true,
  },
  {
    index: "02",
    title: "Public Safety View",
    description: "Choose which safety details appear on your vehicle's QR scan screen.",
    actionLabel: "Manage Safety View",
    href: "https://app.vaahansafe.com/vehicles",
    isExternal: true,
  },
  {
    index: "03",
    title: "Emergency Contacts",
    description: "Add, update, or remove designated family and emergency responder relays.",
    actionLabel: "Update Contacts",
    href: "https://app.vaahansafe.com/emergency-contacts",
    isExternal: true,
  },
  {
    index: "04",
    title: "Communication Preferences",
    description: "Configure SMS, alert relays, and administrative announcement settings.",
    actionLabel: "Notification Settings",
    href: "https://app.vaahansafe.com/settings",
    isExternal: true,
  },
  {
    index: "05",
    title: "Account Deletion",
    description: "Request complete closure and deactivation of non-statutory records.",
    actionLabel: "Request Deletion",
    href: "https://app.vaahansafe.com/settings/privacy",
    isExternal: true,
  },
  {
    index: "06",
    title: "Privacy Request & Support",
    description: "Contact our dedicated team for specific legal or data inquiries.",
    actionLabel: "Contact Privacy Desk",
    href: "/#contact",
    isExternal: false,
  },
] as const;
