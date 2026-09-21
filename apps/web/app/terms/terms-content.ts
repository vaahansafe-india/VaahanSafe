/**
 * VAAHANSAFE TERMS OF SERVICE CONTENT ARCHITECTURE
 *
 * This structured content module decouples formal legal terms, product
 * definitions, and regulatory taxonomy from UI rendering components.
 *
 * CORE CONCEPTUAL MODEL:
 * USER → ACCOUNT → VEHICLE → IDENTITY → SERVICES
 *
 * IMPORTANT LEGAL NOTE:
 * Text contained herein reflects product architecture and vehicle safety identity design.
 * Specific statutory references, minimum age thresholds, monetary liability caps,
 * arbitration venues, and return periods must be formally confirmed by qualified
 * legal counsel prior to final regulatory deposition.
 */

export interface TermsMetadata {
  readonly title: string;
  readonly subtitle: string;
  readonly documentId: string;
  readonly effectiveDate: string;
  readonly lastUpdated: string;
  readonly version: string;
  readonly status: "DRAFT_PENDING_LEGAL_REVIEW" | "ACTIVE";
}

// LEGAL REVIEW REQUIRED:
// Confirm exact terms effective date and version numbers prior to formal publication.
export const TERMS_META: TermsMetadata = {
  title: "Terms of Service",
  subtitle: "Vehicle Safety Identity Platform for India",
  documentId: "DOCUMENT / 02",
  effectiveDate: "March 15, 2026",
  lastUpdated: "March 15, 2026",
  version: "1.0",
  status: "DRAFT_PENDING_LEGAL_REVIEW",
} as const;

export interface EditorialRowItem {
  readonly index: string;
  readonly title: string;
  readonly description: string;
}

export const BEFORE_YOU_USE_ITEMS: readonly EditorialRowItem[] = [
  {
    index: "01",
    title: "VEHICLE IDENTITY",
    description:
      "The QR provides access to the applicable VaahanSafe vehicle identity and safety view experience. The physical sticker acts as the vehicle's public access point.",
  },
  {
    index: "02",
    title: "OWNER INFORMATION",
    description:
      "The user is solely responsible for ensuring that all submitted vehicle information, account credentials, emergency contacts, and medical safety notes are accurate and up to date.",
  },
  {
    index: "03",
    title: "SAFETY VIEW",
    description:
      "Only supported information deliberately configured by the vehicle owner for the public safety view is presented upon scanning. Sensitive account credentials and residential addresses are never exposed.",
  },
  {
    index: "04",
    title: "SERVICES & PLANS",
    description:
      "The physical QR identity and any associated subscription plans or paid services are distinct product concepts. Service availability depends on active plan status.",
  },
] as const;

export interface TermsSubsection {
  readonly id: string;
  readonly title: string;
  readonly paragraphs: readonly string[];
  readonly bulletPoints?: readonly string[];
  readonly legalReviewNote?: string;
}

export interface TermsSection {
  readonly index: string;
  readonly id: string;
  readonly shortTitle: string;
  readonly heading: string;
  readonly summary: string;
  readonly subsections: readonly TermsSubsection[];
}

export const TERMS_SECTIONS: readonly TermsSection[] = [
  {
    index: "01",
    id: "acceptance",
    shortTitle: "Acceptance",
    heading: "Acceptance of these Terms",
    summary:
      "By creating an account, accessing our web application, or activating a VaahanSafe vehicle identity, you agree to be bound by these Terms of Service.",
    subsections: [
      {
        id: "acceptance-binding-agreement",
        title: "Binding Agreement",
        paragraphs: [
          "These Terms of Service ('Terms') constitute a legally binding agreement between you ('User', 'Owner', or 'You') and VaahanSafe ('Platform', 'We', or 'Us').",
          "These Terms govern your access to and use of our public web portal (vaahansafe.com), QR resolver service (qr.vaahansafe.com), activation portal (activate.vaahansafe.com), customer application (app.vaahansafe.com), physical QR decals, and related services.",
        ],
      },
      {
        id: "acceptance-updates",
        title: "Agreement to Updated Versions",
        paragraphs: [
          "Continued access or use of VaahanSafe services following the posting of any revised Terms constitutes your acceptance of the updated terms. If you do not agree to these Terms, you must immediately discontinue use of the platform.",
        ],
        legalReviewNote:
          "LEGAL REVIEW REQUIRED: Confirm formal statutory notification period for prospective terms modifications.",
      },
    ],
  },
  {
    index: "02",
    id: "eligibility",
    shortTitle: "Eligibility",
    heading: "Eligibility and account requirements",
    summary:
      "Access to VaahanSafe requires legal capacity under Indian law and compliance with verified authentication procedures.",
    subsections: [
      {
        id: "eligibility-capacity",
        title: "Legal Capacity & Minimum Age",
        paragraphs: [
          "To register an account or activate a vehicle identity, you must possess the legal capacity to enter into a contract under the Indian Contract Act, 1872.",
          "You represent and warrant that you are of legal age under applicable law to operate motor vehicles or possess legal ownership/authority over the vehicle registered.",
        ],
        legalReviewNote:
          "LEGAL REVIEW REQUIRED: Statutory minimum age threshold (e.g., 18 years for account contract formation) requires formal legal confirmation.",
      },
      {
        id: "eligibility-authority",
        title: "Authority Over Registered Vehicles",
        paragraphs: [
          "You must be the registered owner of the vehicle, or have received explicit written authority from the registered owner, before creating a VaahanSafe vehicle identity or affixing a physical QR sticker.",
        ],
      },
    ],
  },
  {
    index: "03",
    id: "account",
    shortTitle: "Account",
    heading: "Account creation and security",
    summary:
      "Your VaahanSafe account anchors your vehicle identities and requires active protection of your access credentials.",
    subsections: [
      {
        id: "account-registration",
        title: "Authentication & Credential Integrity",
        paragraphs: [
          "Accounts are registered using a verified mobile phone number through one-time authentication codes. You agree to provide accurate, current, and complete registration information.",
          "You are solely responsible for maintaining the confidentiality of your credentials and for all activities that occur under your account.",
        ],
      },
      {
        id: "account-unauthorized-access",
        title: "Notification of Unauthorized Use",
        paragraphs: [
          "You must immediately notify VaahanSafe of any unauthorized access, compromised authentication device, or any other breach of account security. VaahanSafe will not be liable for any loss resulting from unauthorized use of your credentials prior to formal notification.",
        ],
      },
    ],
  },
  {
    index: "04",
    id: "vehicle-identity",
    shortTitle: "Vehicle Identity",
    heading: "The identity belongs to the vehicle experience",
    summary:
      "VaahanSafe creates a structured connection between your physical motor vehicle and a secure digital identity.",
    subsections: [
      {
        id: "identity-architecture",
        title: "Conceptual Relationship Model",
        paragraphs: [
          "A VaahanSafe vehicle identity is not a generic user profile. It is a distinct, vehicle-anchored record connected through four coordinated layers: the Physical Vehicle, the Decal QR Code, the VaahanSafe Identity Engine, and the Controlled Public Safety View.",
          "Scanning the physical sticker provides public access only to the configured safety view. It does not grant access to the account management dashboard, payment history, or private owner profile.",
        ],
      },
      {
        id: "identity-limitations",
        title: "Service Scope & Non-Governmental Status",
        paragraphs: [
          "A VaahanSafe vehicle identity is an independent safety identification service. It does not replace, duplicate, or alter official government registration, vehicle fitness certificates, High Security Registration Plates (HSRP), or Motor Vehicles Act documentation.",
          "VaahanSafe does not claim universal compatibility with all scanner devices, perpetual service without renewal, or official police/RTO affiliation unless explicitly certified under a government contract.",
        ],
      },
    ],
  },
  {
    index: "05",
    id: "qr-activation",
    shortTitle: "QR Activation",
    heading: "Sticker activation and acquisition paths",
    summary:
      "Vehicle identities are established through verified activation channels. A physical QR alone does not constitute proof of ownership.",
    subsections: [
      {
        id: "activation-channels",
        title: "Dual Acquisition Channels",
        paragraphs: [
          "Online Acquisition: When stickers are ordered via vaahansafe.com, the physical decal is assigned to your account and linked to the vehicle specified during your purchase.",
          "Retail Acquisition: Physical retail packs purchased from authorized partners require you to scan the public QR, reveal the concealed activation credential, verify your account, and complete the vehicle connection workflow.",
        ],
      },
      {
        id: "activation-proof-rule",
        title: "Public QR ≠ Activation Proof",
        paragraphs: [
          "Possessing or scanning a public QR decal does not confer ownership or authorization to activate an identity. Activation requires successful verification of non-public activation credentials linked with a valid user account.",
          "Attempting to activate a sticker without legitimate authorization, or intercepting another party's activation credentials, is strictly prohibited and constitutes grounds for immediate account termination.",
        ],
      },
    ],
  },
  {
    index: "06",
    id: "safety-view",
    shortTitle: "Safety View",
    heading: "A scan opens a safety view — not the entire account",
    summary:
      "When a passerby or first responder scans your decal, only designated safety data is rendered through qr.vaahansafe.com.",
    subsections: [
      {
        id: "safety-view-projection",
        title: "Controlled Information Projection",
        paragraphs: [
          "The public safety view is deliberately separated from your private account management profile. The public surface displays only owner-selected vehicle information, emergency contacts, blood group markers, and essential safety notes.",
          "Sensitive personal identifiers—such as your complete residential address, Aadhaar or government ID records, account email, and financial transaction logs—are strictly excluded from the public safety projection.",
        ],
      },
      {
        id: "safety-view-discretion",
        title: "Owner Discretion & Emergency Context",
        paragraphs: [
          "You retain control over which discretionary safety fields to display. By publishing emergency contact numbers or medical markers to your safety view, you acknowledge that any individual scanning the decal will be able to view that information to facilitate roadside communication.",
        ],
      },
    ],
  },
  {
    index: "07",
    id: "user-responsibilities",
    shortTitle: "Responsibilities",
    heading: "Keeping a vehicle identity useful and compliant",
    summary:
      "Users bear full responsibility for the accuracy, legality, and maintenance of their registered vehicle identities.",
    subsections: [
      {
        id: "responsibilities-core-obligations",
        title: "Primary User Obligations",
        paragraphs: [
          "To maintain the utility and trust of the VaahanSafe network, every registered user agrees to the following core obligations:",
        ],
        bulletPoints: [
          "01 Provide accurate, truthful, and verified account information during registration.",
          "02 Register only vehicles that you own or have verified legal authorization to manage.",
          "03 Maintain current emergency contact numbers and verify that designated contacts consent to being listed.",
          "04 Ensure medical indicators, such as blood group or critical allergy notes, are accurate.",
          "05 Never place or present the QR sticker in misleading, fraudulent, or unlawful contexts.",
          "06 Safely store activation credentials and prevent unauthorized assignment to third parties.",
          "07 Adhere to supplied placement guidelines and all relevant motor vehicle safety regulations.",
        ],
      },
      {
        id: "responsibilities-no-warranty-accuracy",
        title: "No Independent Verification of User Data",
        paragraphs: [
          "VaahanSafe provides the technology platform to project your safety profile. We do not independently inspect vehicles, corroborate medical data, or verify the relationship of listed emergency contacts.",
        ],
      },
    ],
  },
  {
    index: "08",
    id: "plans-and-subscriptions",
    shortTitle: "Plans",
    heading: "Plans, services, and subscription terms",
    summary:
      "The physical QR identity and paid software services are distinct product concepts governed by subscription rules.",
    subsections: [
      {
        id: "plans-concept-separation",
        title: "QR Identity ≠ Subscription Plan",
        paragraphs: [
          "A physical VaahanSafe decal provides the hardware interface to your vehicle identity. Advanced digital capabilities—such as automated emergency calling relays, SMS notifications, and expanded safety profiles—may be bundled with introductory periods or require active paid plans.",
          "Current pricing tiers, renewal cycles, and bundled feature matrices are published at vaahansafe.com/pricing. Plan features may be adjusted periodically with advance notice.",
        ],
      },
      {
        id: "plans-expiration-effects",
        title: "Plan Expiry & Service Grace Periods",
        paragraphs: [
          "Upon expiration or non-renewal of an active service plan, premium relay features may be suspended. The foundational public safety view may remain accessible subject to platform retention policies.",
        ],
        legalReviewNote:
          "PRODUCT + LEGAL CONFIRMATION REQUIRED: Determine exact grace period duration and public QR behavior upon long-term subscription lapse.",
      },
    ],
  },
  {
    index: "09",
    id: "orders-and-payments",
    shortTitle: "Payments",
    heading: "Orders, taxes, and payment processing",
    summary:
      "Purchases of physical decals and digital subscriptions are processed through certified payment partners.",
    subsections: [
      {
        id: "payments-processing",
        title: "Payment Authorization & Invoicing",
        paragraphs: [
          "All orders placed through vaahansafe.com require advance payment via approved payment methods, including UPI, debit/credit cards, and net banking. Prices are quoted in Indian Rupees (INR) and are inclusive of applicable Goods and Services Tax (GST) unless indicated otherwise.",
          "Payment transactions are executed via PCI-DSS compliant payment gateways. VaahanSafe does not store raw credit card numbers or banking authentication PINs.",
        ],
      },
      {
        id: "payments-refunds-cancellations",
        title: "Order Cancellations & Refunds",
        paragraphs: [
          "Physical orders may be cancelled prior to decal dispatch. Once customized or registered decals have been shipped, returns and refunds are governed by our dedicated Refund Policy at vaahansafe.com/refund-policy.",
        ],
        legalReviewNote:
          "LEGAL REVIEW REQUIRED: Harmonize statutory cancellation windows with e-commerce consumer protection rules.",
      },
    ],
  },
  {
    index: "10",
    id: "shipping",
    shortTitle: "Shipping",
    heading: "Physical decal delivery and shipping policies",
    summary:
      "Physical sticker kits are delivered to consumer addresses across India through logistics partners.",
    subsections: [
      {
        id: "shipping-dispatch-timeline",
        title: "Delivery Estimates & Service Scope",
        paragraphs: [
          "Physical decals are shipped to delivery addresses provided during checkout. Estimated delivery timeframes are guidelines and may vary based on geographic location, logistics transit constraints, or weather disruptions.",
          "VaahanSafe does not guarantee overnight or fixed-hour arrival. For complete logistics details, refer to our Shipping & Replacement Policy at vaahansafe.com/shipping-replacement.",
        ],
      },
      {
        id: "shipping-address-accuracy",
        title: "Address Accuracy & Returned Shipments",
        paragraphs: [
          "You are responsible for providing complete and accurate postal information, including correct PIN codes and recipient contact numbers. Returned shipments due to inaccurate addresses may incur re-dispatch processing fees.",
        ],
      },
    ],
  },
  {
    index: "11",
    id: "replacement",
    shortTitle: "Replacement",
    heading: "Lost, damaged, or compromised QR decals",
    summary:
      "Procedures for re-issuing physical stickers while preserving your underlying digital vehicle identity.",
    subsections: [
      {
        id: "replacement-lifecycle",
        title: "Decal Replacement Lifecycle",
        paragraphs: [
          "Physical vehicle stickers can sustain weather wear, vehicle surface repainting, or mechanical abrasion. VaahanSafe provides a structured replacement workflow that allows you to link a replacement decal to your existing vehicle record.",
          "Upon pairing a replacement sticker, the prior physical QR code is permanently revoked to prevent duplicate identity resolution.",
        ],
      },
      {
        id: "replacement-fees",
        title: "Replacement Verification & Fees",
        paragraphs: [
          "Replacement decals may be subject to material and logistics processing fees. VaahanSafe reserves the right to verify account ownership before dispatching replacement hardware for an existing registered vehicle.",
        ],
        legalReviewNote:
          "PRODUCT POLICY CONFIRMATION REQUIRED: Specify standard warranty coverage period vs. subsidized owner-replacement pricing.",
      },
    ],
  },
  {
    index: "12",
    id: "acceptable-use",
    shortTitle: "Acceptable Use",
    heading: "Acceptable use and prohibited conduct",
    summary:
      "Users must not compromise platform integrity, harass emergency contacts, or misrepresent vehicle ownership.",
    subsections: [
      {
        id: "acceptable-use-prohibitions",
        title: "Prohibited Platform Activities",
        paragraphs: [
          "You agree not to engage in any of the following prohibited behaviors:",
        ],
        bulletPoints: [
          "01 Registering false, fraudulent, or impersonated vehicle registration marks.",
          "02 Listing third-party emergency contact numbers without express consent.",
          "03 Attempting unauthorized activation of physical decals belonging to another party.",
          "04 Scanning vehicle stickers with automated scripts, scrapers, or bulk harvesting tools.",
          "05 Overriding, reverse-engineering, or tampering with the QR resolver infrastructure.",
          "06 Using the messaging relay service to transmit abusive, harassing, or spam communications.",
          "07 Deliberately pasting malicious, deceptive, or offensive content into public safety notes.",
          "08 Affixing a VaahanSafe sticker to an unauthorized or non-registered vehicle.",
          "09 Subverting authentication controls or attempting brute-force activation attacks.",
          "10 Misrepresenting VaahanSafe as an official government agency or emergency authority.",
        ],
      },
    ],
  },
  {
    index: "13",
    id: "third-parties",
    shortTitle: "Third Parties",
    heading: "Third-party service dependencies",
    summary:
      "VaahanSafe collaborates with certified third-party infrastructure and telecommunications providers.",
    subsections: [
      {
        id: "third-parties-scope",
        title: "Service Infrastructure Dependencies",
        paragraphs: [
          "To provide reliable vehicle identity management and emergency notifications, VaahanSafe integrates with trusted infrastructure partners for SMS telecommunications, payment processing, cloud hosting, and physical logistics.",
          "While we select enterprise-grade partners with strict operational standards, VaahanSafe is not liable for carrier-level telecommunication delays, upstream cellular network blackouts, or external gateway failures.",
        ],
      },
    ],
  },
  {
    index: "14",
    id: "availability",
    shortTitle: "Availability",
    heading: "Service availability and platform modifications",
    summary:
      "We strive for high reliability but do not promise uninterrupted or instantaneous operation under all conditions.",
    subsections: [
      {
        id: "availability-operational-standards",
        title: "Maintenance & Operational Status",
        paragraphs: [
          "VaahanSafe is designed for continuous operational readiness. However, web services, QR resolution, and relay communications may experience periodic maintenance downtime, software updates, or unexpected outages.",
          "We do not promise 100% uninterrupted uptime or zero latency across all geographic networks. Real-time system availability and scheduled maintenance notices are posted on our official Service Status page.",
        ],
      },
      {
        id: "availability-modifications",
        title: "Right to Modify Platform Features",
        paragraphs: [
          "VaahanSafe continually improves its services and reserves the right to modify, replace, or discontinue specific platform capabilities or visual projections with reasonable notice where appropriate.",
        ],
      },
    ],
  },
  {
    index: "15",
    id: "emergency-disclaimer",
    shortTitle: "Emergency Disclaimer",
    heading: "Emergency services and roadside disclaimer",
    summary:
      "VaahanSafe supports roadside connection but is never a substitute for police, ambulance, or emergency responders.",
    subsections: [
      {
        id: "emergency-disclaimer-not-a-substitute",
        title: "Independent Communication Aid Only",
        paragraphs: [
          "CRITICAL NOTICE: VaahanSafe is an auxiliary communication and vehicle identification tool. It is not an emergency response organization, law enforcement dispatch, paramedic team, or roadside recovery fleet.",
          "In the event of a motor vehicle collision, life-threatening situation, personal injury, or crime, bystanders and responders must immediately dial national emergency authorities (112, 100, 108) prior to attempting digital identity interactions.",
        ],
      },
      {
        id: "emergency-disclaimer-no-medical-guarantee",
        title: "No Warranty for Medical or Emergency Actions",
        paragraphs: [
          "VaahanSafe does not guarantee that listed emergency contacts will answer, that emergency relay notifications will be received instantly in low-network zones, or that third-party rescuers will access the public QR.",
          "For further guidance, consult our dedicated Safety Disclaimer at vaahansafe.com/safety-disclaimer.",
        ],
      },
    ],
  },
  {
    index: "16",
    id: "information-accuracy",
    shortTitle: "Data Accuracy",
    heading: "Information accuracy and medical safety notes",
    summary:
      "The vehicle owner retains sole responsibility for verifying all safety records and emergency designations.",
    subsections: [
      {
        id: "accuracy-user-responsibility",
        title: "User-Supplied Information Responsibility",
        paragraphs: [
          "Information displayed on your vehicle's public safety view—including blood group, emergency contacts, insurance identifiers, and medical alerts—is entered and controlled entirely by you.",
          "VaahanSafe does not verify blood group compatibility, confirm medical diagnoses, or cross-check vehicle ownership records against transport authority databases.",
        ],
      },
    ],
  },
  {
    index: "17",
    id: "intellectual-property",
    shortTitle: "Intellectual Property",
    heading: "Intellectual property and brand rights",
    summary:
      "All trademarks, software architecture, decal designs, and platform visual identities are protected assets.",
    subsections: [
      {
        id: "ip-ownership",
        title: "VaahanSafe Proprietary Rights",
        paragraphs: [
          "The VaahanSafe brand, logo, domain names, mobile and web user interfaces, graphic systems, proprietary QR decal formatting, and software code are the exclusive property of VaahanSafe.",
          "You are granted a limited, revocable, non-exclusive, non-transferable license to use the physical decal and associated web interface solely for personal or authorized vehicular safety purposes in accordance with these Terms.",
        ],
      },
    ],
  },
  {
    index: "18",
    id: "disclaimers",
    shortTitle: "Disclaimers",
    heading: "Disclaimers of warranties",
    summary:
      "The platform and decals are provided on an 'as is' and 'as available' basis without implied guarantees.",
    subsections: [
      {
        id: "disclaimers-as-is",
        title: "As-Is Service Provision",
        paragraphs: [
          "To the maximum extent permitted by applicable Indian law, VaahanSafe disclaims all warranties of any kind, whether express, statutory, or implied, including but not limited to implied warranties of merchantability, fitness for a particular vehicular purpose, and non-infringement.",
          "We do not warrant that the decal material will endure all environmental conditions, accidents, or solvent exposures, nor that QR code readability will remain unaffected by severe mechanical surface damage.",
        ],
      },
    ],
  },
  {
    index: "19",
    id: "limitation-of-liability",
    shortTitle: "Liability",
    heading: "Limitation of liability",
    summary:
      "Our liability is strictly limited to the extent permitted by law and the amounts paid for our services.",
    subsections: [
      {
        id: "liability-indirect-damages",
        title: "Exclusion of Consequential Damages",
        paragraphs: [
          "Under no circumstances shall VaahanSafe, its directors, employees, or authorized agents be liable for any indirect, incidental, punitive, special, or consequential damages, including loss of profits, towing fees, vehicle damage, medical expenses, or personal injury arising out of or in connection with your use or inability to use the platform or decals.",
        ],
      },
      {
        id: "liability-monetary-cap",
        title: "Monetary Liability Cap",
        paragraphs: [
          "To the fullest extent permitted by applicable law, the total aggregate liability of VaahanSafe for all claims relating to these Terms or the services shall be limited to the amount paid by you to VaahanSafe in the twelve (12) months preceding the event giving rise to the liability, or ₹500, whichever is greater.",
        ],
        legalReviewNote:
          "LEGAL REVIEW REQUIRED: Confirm precise statutory liability limitations and financial caps under the Consumer Protection Act, 2019.",
      },
    ],
  },
  {
    index: "20",
    id: "termination",
    shortTitle: "Termination",
    heading: "Account suspension and termination",
    summary:
      "Accounts may be closed voluntarily or suspended in instances of fraudulent activation or Terms violations.",
    subsections: [
      {
        id: "termination-by-user",
        title: "Voluntary Closure",
        paragraphs: [
          "You may discontinue using VaahanSafe at any time by closing your account through the customer dashboard or contacting support@vaahansafe.com. Closing your account revokes public resolution for linked vehicle decals.",
        ],
      },
      {
        id: "termination-by-platform",
        title: "Suspension or Inactivation for Cause",
        paragraphs: [
          "VaahanSafe reserves the right to immediately suspend or terminate your account and deactivate associated vehicle QR codes if we determine that you have violated these Terms, provided fraudulent information, or engaged in abusive conduct.",
        ],
        legalReviewNote:
          "PRODUCT POLICY + LEGAL REVIEW REQUIRED: Clarify public QR display state (e.g., neutral inactive notice) upon account termination or vehicle de-registration.",
      },
    ],
  },
  {
    index: "21",
    id: "governing-law",
    shortTitle: "Governing Law",
    heading: "Governing law and dispute resolution",
    summary:
      "Disputes are governed by the laws of India and subject to defined jurisdiction and arbitration procedures.",
    subsections: [
      {
        id: "governing-law-jurisdiction",
        title: "Jurisdiction & Statutory Law",
        paragraphs: [
          "These Terms and any contractual disputes or claims arising out of or in connection with them shall be governed by and construed in accordance with the laws of the Republic of India.",
        ],
        legalReviewNote:
          "LEGAL REVIEW REQUIRED: Confirm specific judicial seat (e.g., courts of Bengaluru / Hyderabad / Chennai / New Delhi) and arbitration clause requirements under the Arbitration and Conciliation Act, 1996.",
      },
      {
        id: "governing-law-dispute-process",
        title: "Informal Resolution First",
        paragraphs: [
          "Before initiating formal legal proceedings, you and VaahanSafe agree to make good-faith efforts to resolve any dispute through informal discussions by submitting a written notice to our legal grievance desk.",
        ],
      },
    ],
  },
  {
    index: "22",
    id: "changes-to-terms",
    shortTitle: "Changes",
    heading: "Modifications to these Terms",
    summary:
      "Periodic revisions are published on this page with updated effective date and version records.",
    subsections: [
      {
        id: "changes-notification",
        title: "Notice of Material Modifications",
        paragraphs: [
          "We may update these Terms from time to time to reflect modifications in legal requirements, safety enhancements, or platform architecture. When changes occur, we will update the Effective Date at the top of this document.",
          "For material changes affecting existing vehicle identities or subscription terms, we will provide reasonable notification via our web portal or registered mobile contact.",
        ],
      },
    ],
  },
  {
    index: "23",
    id: "contact",
    shortTitle: "Contact",
    heading: "Official legal and platform inquiries",
    summary:
      "Official channels for communicating with the VaahanSafe legal and customer operations desk.",
    subsections: [
      {
        id: "contact-official-channels",
        title: "Grievance and Legal Inquiries",
        paragraphs: [
          "For inquiries regarding these Terms, compliance questions, or notices under Indian electronic governance regulations, contact our dedicated legal desk at support@vaahansafe.com.",
          "We endeavor to address formal inquiries within 72 business hours of receipt during working days.",
        ],
      },
    ],
  },
] as const;
