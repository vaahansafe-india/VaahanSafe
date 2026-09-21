export interface GuideCallout {
  type: "distinction" | "warning" | "note";
  title: string;
  left?: string;
  right?: string;
  text: string;
}

export interface GuideSubSection {
  title: string;
  content: string[];
}

export interface GuideSection {
  id: string;
  title: string;
  content: string[];
  subsections?: readonly GuideSubSection[];
  callout?: GuideCallout;
}

export interface GuideCrossLink {
  title: string;
  href: string;
  isExternal?: boolean;
}

export interface OfficialGuide {
  id: string;
  docId: string;
  number: string;
  stepName: string;
  slug: string;
  title: string;
  subtitle: string;
  purpose: string;
  updatedAt: string; // real publication reference date
  whatItCovers: readonly string[];
  diagram: readonly string[];
  sections: readonly GuideSection[];
  crossLinks: readonly GuideCrossLink[];
  previousSlug?: string;
  nextSlug?: string;
}

export const OFFICIAL_GUIDES: readonly OfficialGuide[] = [
  {
    id: "product-guide",
    docId: "DOC / PRODUCT / 01",
    number: "01",
    stepName: "UNDERSTAND",
    slug: "product-guide",
    title: "VaahanSafe Product Guide",
    subtitle: "Understand the complete vehicle identity system.",
    purpose: "The master non-legal product reference explaining how decals, digital vehicle records, and roadside safety screens interconnect.",
    updatedAt: "September 2026",
    whatItCovers: [
      "What is VaahanSafe and core platform principles",
      "Physical vehicle → Decal QR → Digital vehicle identity",
      "Public roadside safety view vs. owner private account",
      "Owner account controls & privacy model",
      "Retail package vs. online vehicle acquisition paths",
      "Subscription plans & cloud notification services",
      "QR continuity & replacement lifecycle",
    ],
    diagram: [
      "PHYSICAL VEHICLE",
      "       ↓",
      "VAAHANSAFE QR",
      "       ↓",
      "VEHICLE IDENTITY",
      "       ↓",
      "SAFETY VIEW",
      "       ↓",
      "USEFUL CONNECTION",
    ],
    sections: [
      {
        id: "what-is-vaahansafe",
        title: "01 What is VaahanSafe?",
        content: [
          "VaahanSafe is a QR-based vehicle safety identity platform designed for Indian roads. It bridges the physical vehicle parked or moving on the road with an owner-controlled digital identity.",
          "Every day, millions of motor vehicles navigate Indian streets without an immediate, privacy-preserving method for bystanders, first responders, or community members to notify the owner when an incident occurs—such as a blocked driveway, an accidental light left on, or a roadside emergency.",
          "VaahanSafe solves this without exposing the owner's personal phone number, home address, or identity documents to the general public.",
        ],
      },
      {
        id: "vehicle-qr-identity",
        title: "02 Vehicle → QR → Identity",
        content: [
          "The architecture consists of three distinct layers:",
          "1. The Physical Decal: An engineered high-contrast vehicle decal carrying a cryptographically registered public QR code.",
          "2. The Resolver: When scanned by any modern smartphone camera, the QR directs the scanner to the canonical VaahanSafe edge resolver (vaahansafe.com).",
          "3. The Digital Identity: A secure vehicle record hosted on cloud edge infrastructure that determines what safety details, contact relays, and vehicle status are displayed.",
        ],
        callout: {
          type: "distinction",
          title: "ARCHITECTURE PRINCIPLE",
          left: "PHYSICAL QR",
          right: "DIGITAL IDENTITY",
          text: "The physical QR on your vehicle is an entry point, not a data container. The QR contains no personal data. All safety details and contact choices reside in your cloud account and can be updated or paused instantly.",
        },
      },
      {
        id: "public-safety-view",
        title: "03 Public Safety View",
        content: [
          "The public safety view is the web page that opens when someone scans your vehicle QR. It is intentionally lightweight, responsive, and requires zero app installations for the scanner.",
          "Depending on the owner's configuration, the safety view can display: basic vehicle context (make, model, color), designated emergency contact relays, voluntary medical safety notes (such as blood group or allergy warnings), and vehicle alert prompts (wrong parking, vehicle unattended, headlight on).",
          "The viewer never sees the owner's residential address, private email, or direct mobile number unless the owner explicitly configures a direct contact display.",
        ],
      },
      {
        id: "owner-account",
        title: "04 Owner Account",
        content: [
          "Your VaahanSafe owner account is the central management cockpit. You log in securely using your mobile number and one-time verification.",
          "Inside your account, you can manage multiple vehicles, bind new retail decals, adjust visibility toggles for each vehicle, view alert history, and maintain emergency contact relationships.",
        ],
      },
      {
        id: "privacy-controls",
        title: "05 Privacy Controls",
        content: [
          "Privacy is built into the core design of VaahanSafe rather than treated as an afterthought. Every data point on the public safety view has an independent visibility switch.",
          "You decide whether your emergency contact is reachable via masked calling, instant WhatsApp/SMS notification relay, or visible number. At any moment, you can toggle your vehicle's public view into 'Maintenance' or 'Inactive' mode.",
        ],
      },
      {
        id: "retail-vs-online",
        title: "06 Retail vs Online Acquisition",
        content: [
          "VaahanSafe supports two primary acquisition routes:",
          "• Online Acquisition: You create an account on vaahansafe.com, register your vehicle details, and order a custom-linked VaahanSafe decal delivered to your address.",
          "• Retail Acquisition: You purchase a pre-packaged VaahanSafe kit from an authorized automotive retailer, dealership, or service center with decal in hand, then scan to activate and link to your account.",
        ],
      },
      {
        id: "plans-services",
        title: "07 Plans and Services",
        content: [
          "VaahanSafe provides both foundational safety services and enhanced subscription capabilities.",
          "The foundational service includes public QR resolution, owner vehicle identity, and basic incident alerts. Optional premium tiers provide automated cloud contact relay, multi-contact notification chaining, and extended telemetry support.",
        ],
      },
      {
        id: "qr-replacement",
        title: "08 QR Replacement & Continuity",
        content: [
          "Vehicles encounter cracked windshields, accidents, and paint renewals. When a decal is lost or destroyed, your digital vehicle record and safety settings do not have to be recreated.",
          "VaahanSafe allows you to retire the damaged physical QR code and link a replacement decal directly to your existing vehicle record without losing your configuration history.",
        ],
      },
      {
        id: "help-support",
        title: "09 Help and Support",
        content: [
          "For technical troubleshooting, decal binding assistance, or courier queries, the VaahanSafe Help Center (/help) provides actionable resolution guides and support channels.",
        ],
      },
    ],
    crossLinks: [
      { title: "How It Works", href: "/how-it-works" },
      { title: "Safety & Privacy Architecture", href: "/safety" },
      { title: "Plans & Cloud Services", href: "/pricing" },
      { title: "Help Center", href: "/help" },
    ],
    nextSlug: "quick-start",
  },
  {
    id: "quick-start",
    docId: "DOC / START / 02",
    number: "02",
    stepName: "START",
    slug: "quick-start",
    title: "VaahanSafe Quick-Start Guide",
    subtitle: "From account creation to a ready vehicle identity.",
    purpose: "A clear step-by-step roadmap guiding new vehicle owners from first sign-up to a fully configured and positioned vehicle identity.",
    updatedAt: "September 2026",
    whatItCovers: [
      "Step 01: Account creation via mobile verification",
      "Step 02: Owner profile completion",
      "Step 03: Registering your vehicle details",
      "Step 04: Online decal order vs Retail QR binding",
      "Step 05: Configuring emergency contacts and safety notes",
      "Step 06: Surface preparation and physical placement",
      "Step 07: Live scan test and operational readiness",
    ],
    diagram: [
      "01 CREATE ACCOUNT",
      "       ↓",
      "02 VERIFY & COMPLETE PROFILE",
      "       ↓",
      "03 ADD VEHICLE",
      "       ↓",
      "04 GET / CONNECT VAAHANSAFE QR",
      "       ↓",
      "05 SET SAFETY INFORMATION",
      "       ↓",
      "06 PLACE QR",
      "       ↓",
      "07 READY",
    ],
    sections: [
      {
        id: "onboarding-overview",
        title: "Understanding Your Onboarding Flow",
        content: [
          "Depending on how you obtained your VaahanSafe kit, your onboarding path begins either on our website or with a physical box in your hand.",
          "Both paths converge at Step 05 once your vehicle record is connected to a unique QR identity.",
        ],
        subsections: [
          {
            title: "Online Acquisition Path",
            content: [
              "Create Account → Enter Vehicle Info → Select Decal Kit → Complete Order → Receive Decal via Courier → Connect & Place.",
            ],
          },
          {
            title: "Retail Kit Path",
            content: [
              "Kit in Hand → Scan Activation Code with Phone → Sign In or Create Account → Add Vehicle → Confirm Binding → Place Decal.",
            ],
          },
        ],
      },
      {
        id: "step-01-account",
        title: "Step 01: Create Your Account",
        content: [
          "Visit vaahansafe.com on your smartphone or desktop computer. Enter your primary Indian mobile phone number.",
          "You will receive a 6-digit verification code via SMS. Enter the code to authenticate. No complex password creation is necessary.",
        ],
      },
      {
        id: "step-02-profile",
        title: "Step 02: Complete Your Owner Profile",
        content: [
          "Provide your preferred owner display name and an optional secondary email address for notification backups.",
          "Your email address remains strictly confidential and is never shown to public roadside scanners.",
        ],
      },
      {
        id: "step-03-vehicle",
        title: "Step 03: Add Your Vehicle",
        content: [
          "Enter your vehicle registration number (e.g., DL 01 AB 1234), make, model, and vehicle class (Two-wheeler, Car/SUV, or Commercial).",
          "This metadata helps bystanders verify that the QR they are scanning matches the vehicle in front of them.",
        ],
      },
      {
        id: "step-04-connect-qr",
        title: "Step 04: Connect Your VaahanSafe QR",
        content: [
          "If you ordered online, your decal kit is automatically pre-associated with your order and arrives ready to confirm.",
          "If you purchased a retail box, follow the Retail Activation Guide (Doc 03) to scan the inner activation code and pair it with your newly added vehicle.",
        ],
      },
      {
        id: "step-05-safety-info",
        title: "Step 05: Configure Safety Information",
        content: [
          "Set up at least one verified emergency contact phone number (e.g., spouse, parent, or trusted contact).",
          "Optionally indicate driver blood group and critical medical cautions (e.g., severe allergies, asthma, insulin dependence).",
        ],
        callout: {
          type: "distinction",
          title: "IMPORTANT DISTINCTION",
          left: "SAFETY ADVISORY",
          right: "MEDICAL RECORD",
          text: "Information entered in VaahanSafe is an owner-provided safety advisory for roadside emergency context. It is not an official verified medical record and does not substitute for clinical triage.",
        },
      },
      {
        id: "step-06-place-qr",
        title: "Step 06: Place the QR Decal",
        content: [
          "Clean the inside lower corner of your windshield (or front fork on two-wheelers) using the provided alcohol wipe.",
          "Ensure the glass is dry and free of oil or dust before adhering the decal. Follow Doc 04 (QR Placement Guide) for detailed vehicle-specific locations.",
        ],
      },
      {
        id: "step-07-live-test",
        title: "Step 07: Perform a Verification Scan",
        content: [
          "Use a smartphone camera to scan the positioned decal from outside the vehicle.",
          "Verify that the public safety screen opens smoothly, shows the expected vehicle details, and offers your designated contact relays.",
        ],
      },
    ],
    crossLinks: [
      { title: "Retail Activation Guide", href: "/documents/activation" },
      { title: "QR Placement Guide", href: "/documents/qr-placement" },
      { title: "Safety & Emergency Contact Guide", href: "/documents/safety" },
    ],
    previousSlug: "product-guide",
    nextSlug: "activation",
  },
  {
    id: "activation",
    docId: "DOC / ACTIVATE / 03",
    number: "03",
    stepName: "ACTIVATE",
    slug: "activation",
    title: "Retail QR Activation Guide",
    subtitle: "Connect a pre-issued VaahanSafe QR to your account and vehicle.",
    purpose: "Operational instructions for vehicle owners who bought a sealed retail kit at a store, dealership, or service garage and need to bind it securely.",
    updatedAt: "September 2026",
    whatItCovers: [
      "Before you start: package checklist",
      "The core retail activation sequence (Buy → Scan → Reveal → Verify → Connect → Active)",
      "Public QR vs Activation Proof security boundaries",
      "What happens after activation",
      "Common retail activation troubleshooting",
      "De-activation and transfer considerations",
    ],
    diagram: [
      "BUY RETAIL KIT",
      "       ↓",
      "SCAN PACKAGING QR",
      "       ↓",
      "REVEAL ACTIVATION TOKEN",
      "       ↓",
      "VERIFY AUTHENTICITY",
      "       ↓",
      "CONNECT TO VEHICLE",
      "       ↓",
      "ACTIVATION COMPLETE",
    ],
    sections: [
      {
        id: "before-you-start",
        title: "01 Before You Start",
        content: [
          "Ensure your retail packaging has its factory holographic seal intact.",
          "Each retail box contains: one genuine VaahanSafe exterior/interior vehicle decal, a surface preparation wipe, and an inner activation card containing the single-use activation proof.",
          "Have your vehicle registration number and mobile phone handy.",
        ],
      },
      {
        id: "security-boundary",
        title: "02 Public QR vs Activation Proof",
        content: [
          "A fundamental security principle of VaahanSafe is that the public QR printed on the decal CANNOT be used by a stranger to claim or hijack your vehicle.",
          "The public QR is purely an identifier. Activation requires the concealed single-use proof located inside the tamper-evident packaging.",
        ],
        callout: {
          type: "distinction",
          title: "SECURITY BOUNDARY",
          left: "PUBLIC QR",
          right: "ACTIVATION PROOF",
          text: "Anyone standing near your car can see and scan the Public QR to view safety information. Only the person holding the physical tamper-evident activation card can connect the decal to an owner account.",
        },
      },
      {
        id: "activation-steps",
        title: "03 Activation Steps",
        content: [
          "Step 1 — Open the package and locate the Activation Card.",
          "Step 2 — Open your phone camera and scan the setup QR printed on the Activation Card, or visit vaahansafe.com/help/activation directly.",
          "Step 3 — Sign in to your existing VaahanSafe account or enter your phone number to create one.",
          "Step 4 — Enter or confirm the activation token displayed on the card.",
          "Step 5 — Select which vehicle in your account you wish to bind, or enter your vehicle number to create a new vehicle profile.",
          "Step 6 — Confirm the binding. The platform establishes an immutable cryptographic link between the decal's public identifier and your vehicle record.",
        ],
      },
      {
        id: "after-activation",
        title: "04 What Happens After Activation?",
        content: [
          "Once successfully bound, the single-use activation token is permanently spent and retired. It can never be used again.",
          "The public QR code instantly becomes active on the global edge resolver network.",
          "You can now proceed to install the decal on your vehicle and configure your emergency contacts.",
        ],
      },
      {
        id: "troubleshooting",
        title: "05 Troubleshooting Retail Activation",
        content: [
          "• 'Token already claimed': If you purchased a sealed package and the token is reported as claimed, do not install the decal. Return it immediately to the retail merchant or contact VaahanSafe support with your purchase receipt.",
          "• 'Unreadable card QR': If the camera cannot scan the activation QR due to poor lighting or smudging, type the alphanumeric token printed beneath the code directly into vaahansafe.com/help/activation.",
          "• 'Account mismatch': Make sure you are signed in with the phone number you want associated with this vehicle identity.",
        ],
      },
    ],
    crossLinks: [
      { title: "Activate Retail QR Online", href: "/help/activation" },
      { title: "Retail Activation Help", href: "/help/activation" },
      { title: "QR Placement Guide", href: "/documents/qr-placement" },
    ],
    previousSlug: "quick-start",
    nextSlug: "qr-placement",
  },
  {
    id: "qr-placement",
    docId: "DOC / PLACE / 04",
    number: "04",
    stepName: "PLACE",
    slug: "qr-placement",
    title: "QR Placement Guide",
    subtitle: "Choose a visible, appropriate location for your VaahanSafe QR.",
    purpose: "Vehicle-specific placement guidance ensuring maximum readability for emergency personnel and bystanders while strictly respecting motor vehicle regulations and driver visibility.",
    updatedAt: "September 2026",
    whatItCovers: [
      "Pre-installation inspection and surface preparation",
      "Recommended positions for Passenger Cars & SUVs",
      "Recommended positions for Two-Wheelers & Scooters",
      "Commercial & Fleet vehicle placement",
      "Critical safety rules: non-obstruction of driver vision & lights",
      "Application procedure & curing recommendations",
      "Decal maintenance and scan checking",
    ],
    diagram: [
      "VEHICLE",
      "   ↓",
      "APPROPRIATE POSITION",
      "   ↓",
      "CLEAN SURFACE",
      "   ↓",
      "AFFIX VAAHANSAFE QR",
      "   ↓",
      "VISIBLE ENTRY POINT",
    ],
    sections: [
      {
        id: "before-placement",
        title: "01 Before Placement",
        content: [
          "Inspect your decal before peeling the backing liner. Confirm the QR code is crisp, flat, and undamaged.",
          "Choose an application time when the vehicle surface is at moderate ambient temperature, out of harsh direct midday sun or torrential rain.",
          "Have a clean microfiber cloth and the supplied cleaning wipe ready.",
        ],
      },
      {
        id: "choosing-location",
        title: "02 Choosing an Appropriate Location",
        content: [
          "The ideal location is easily discovered by someone approaching the vehicle on foot, yet does not interfere with the driver's forward driving visibility or any vehicle instrumentation.",
        ],
        subsections: [
          {
            title: "Passenger Cars, Sedans & SUVs",
            content: [
              "• Primary Recommendation: Lower passenger-side corner of the front windshield (inside-glass mount), positioned 5–10 cm from the edge border.",
              "• Secondary Recommendation: Rear windshield lower corner, or passenger-side rear quarter glass.",
              "• Do NOT place directly in the driver's primary line of sight, wiper sweeping apex, or over ADAS camera sensor housings located behind the rearview mirror.",
            ],
          },
          {
            title: "Motorcycles & Scooters",
            content: [
              "• Motorcycles: Front fork upper leg, fuel tank front slope (outside the rider knee contact area), or windshield visor.",
              "• Scooters: Front apron panel, glovebox upper surface, or rear body panel adjacent to the tail lamp.",
              "• Avoid placing near high-temperature exhaust piping, suspension travel pinch points, or chain drive areas.",
            ],
          },
          {
            title: "Commercial & Fleet Vehicles",
            content: [
              "• Left-hand passenger side door window corner or passenger entryway glass.",
              "• Ensure the decal is placed at standing eye level (approximately 1.2m to 1.6m from ground level) for easy scanning by parking wardens or logistics staff.",
            ],
          },
        ],
      },
      {
        id: "safety-compliance",
        title: "03 Regulatory Compliance & Visibility Rules",
        content: [
          "Always adhere to local Motor Vehicles Rules and transport authority regulations.",
          "Never place the VaahanSafe decal in locations that obscure:",
          "1. Driver field of view required for safe driving.",
          "2. Official high-security registration plates (HSRP) or vehicle registration numbers.",
          "3. Headlamps, taillamps, indicator signals, or reversing lights.",
          "4. Airbag deployment zones, dashboard warning indicators, or mechanical controls.",
        ],
        callout: {
          type: "warning",
          title: "COMPLIANCE ADVISORY",
          text: "Never apply stickers over statutory registration plates or mandatory high-security registration plate (HSRP) holograms. VaahanSafe is a supplementary safety identity, not a replacement for statutory government identification.",
        },
      },
      {
        id: "application-steps",
        title: "04 Applying the QR Decal",
        content: [
          "1. Clean Surface: Wipe the target glass or painted area thoroughly with the included wipe. Remove all dust, grease, and moisture.",
          "2. Dry Completely: Allow the surface to dry completely for at least 60 seconds.",
          "3. Peel Backing: Carefully peel the protective backing paper from one edge without touching the adhesive face with your fingers.",
          "4. Align & Press: Position the decal gently against the surface. Using a clean cloth or soft squeegee, press firmly from the center outward to displace air bubbles.",
          "5. Seal Edges: Run your thumb firmly along all four edges to ensure complete perimeter adhesion.",
        ],
      },
      {
        id: "testing-caring",
        title: "05 Testing and Caring for the QR",
        content: [
          "• Scan Test: Stand 0.5m to 1m away in normal daylight and scan the decal with your smartphone camera. Verify immediate URL detection.",
          "• Cleaning: When washing the vehicle, avoid scraping the decal with sharp metal razor blades, harsh abrasive scouring pads, or high-pressure washer nozzles held within 10 cm.",
          "• Replacement: If windshield replacement or severe abrasion occurs, follow the QR Replacement Guide (Doc 07D) to bind a new decal seamlessly.",
        ],
      },
    ],
    crossLinks: [
      { title: "QR Placement Gallery", href: "/gallery" },
      { title: "Safety Disclaimer", href: "/safety-disclaimer" },
      { title: "Decal Replacement Help", href: "/help/replacement" },
    ],
    previousSlug: "activation",
    nextSlug: "safety",
  },
  {
    id: "safety",
    docId: "DOC / SAFETY / 05",
    number: "05",
    stepName: "SAFETY",
    slug: "safety",
    title: "Safety & Emergency Contact Guide",
    subtitle: "Choose useful information for the vehicle's public safety view.",
    purpose: "Practical advice on selecting and maintaining reliable emergency contacts and vital roadside notes while understanding the technical and legal boundaries of the platform.",
    updatedAt: "September 2026",
    whatItCovers: [
      "The role of public safety view in roadside incidents",
      "Selecting primary and secondary emergency contacts",
      "Emergency contact privacy vs reachability trade-offs",
      "Recording blood group and critical medical cautions",
      "Critical boundaries: Safety Information ≠ Medical Record",
      "Critical boundaries: Contact Option ≠ Emergency Dispatch",
      "Routine verification and updating practices",
    ],
    diagram: [
      "ACCOUNT",
      "   ↓",
      "YOUR CONTROLS",
      "   ↓",
      "SELECTED SAFETY INFORMATION",
      "   ↓",
      "PUBLIC SCAN VIEW",
      "   ↓",
      "EMERGENCY CALL / RELAY",
    ],
    sections: [
      {
        id: "public-safety-role",
        title: "01 The Purpose of Roadside Safety View",
        content: [
          "When a vehicle is involved in a collision, parked in an obstructive manner, or experiencing a hazardous situation (such as a fluid leak or smoke), bystanders often want to help but have no means to reach the owner or their loved ones.",
          "The public safety view provides immediate, structured guidance to the scanner, allowing them to initiate an alert or reach designated emergency contacts without bureaucratic delay.",
        ],
      },
      {
        id: "emergency-contacts",
        title: "02 Selecting Emergency Contacts",
        content: [
          "We strongly recommend designating two distinct emergency contacts:",
          "• Primary Contact: An immediate family member or trusted local friend who is likely to answer calls from unknown numbers in an emergency.",
          "• Secondary Contact: An alternative relative, neighbor, or workplace contact.",
          "Always inform the people you designate as emergency contacts so they understand they may receive calls if your vehicle is involved in an incident.",
        ],
      },
      {
        id: "medical-notes",
        title: "03 Voluntary Safety Notes & Blood Group",
        content: [
          "Where supported by your profile settings, you may choose to display your blood group and brief medical context (e.g., 'Severe penicillin allergy', 'Diabetic - carry insulin in glovebox', 'Wear spectacles').",
          "This information is strictly voluntary and serves to provide contextual awareness to first responders during golden-hour triage.",
        ],
      },
      {
        id: "vital-distinctions",
        title: "04 Crucial Legal & Operational Distinctions",
        content: [
          "It is imperative that vehicle owners and the public understand what VaahanSafe is and what it is not.",
        ],
        callout: {
          type: "distinction",
          title: "VITAL SAFETY DISTINCTIONS",
          left: "SAFETY ADVISORY",
          right: "MEDICAL RECORD & DISPATCH",
          text: "SAFETY INFORMATION ≠ MEDICAL RECORD. VaahanSafe displays user-provided declarations. It does not certify medical history.\n\nCONTACT OPTION ≠ EMERGENCY DISPATCH. VaahanSafe is NOT an emergency response service (like 112, police, or ambulance dispatch). In life-threatening emergencies, bystanders should always dial 112 directly first.",
        },
      },
      {
        id: "no-guarantees",
        title: "05 Service Scope & Boundaries",
        content: [
          "VaahanSafe makes no claim of:",
          "• Automated hospital or police dispatch connection.",
          "• Guaranteed phone network availability or carrier cellular coverage at the scan location.",
          "• Verification or clinical accuracy of user-submitted health data.",
          "• Continuous 24/7 responsiveness of user-designated personal contacts.",
        ],
      },
      {
        id: "maintenance-hygiene",
        title: "06 Routine Verification Practices",
        content: [
          "We recommend testing your vehicle QR and reviewing your designated contact numbers twice a year—for instance, during seasonal vehicle service or insurance renewal.",
          "If a designated contact changes their telephone number, update your VaahanSafe dashboard immediately. Changes propagate to the public safety view within seconds.",
        ],
      },
    ],
    crossLinks: [
      { title: "Safety & Privacy Architecture", href: "/safety" },
      { title: "Statutory Safety Disclaimer", href: "/safety-disclaimer" },
      { title: "Privacy Guide", href: "/documents/privacy" },
    ],
    previousSlug: "qr-placement",
    nextSlug: "privacy",
  },
  {
    id: "privacy",
    docId: "DOC / PRIVACY / 06",
    number: "06",
    stepName: "PRIVACY",
    slug: "privacy",
    title: "VaahanSafe Privacy Guide",
    subtitle: "Understand what stays private and what can become visible.",
    purpose: "A clear, human-readable product explanation of data privacy boundaries, distinguishing the private owner account from the public roadside scan view.",
    updatedAt: "September 2026",
    whatItCovers: [
      "Human-readable privacy philosophy (not legal jargon)",
      "Strict separation: Private Account vs Public Safety View",
      "What is NEVER shown publicly under any circumstance",
      "What you CONTROL and can choose to display or hide",
      "Masked calling and notification relay mechanics",
      "Roadside scan privacy: what the vehicle owner sees about scans",
      "How to access the statutory legal Privacy Policy",
    ],
    diagram: [
      "PRIVATE ACCOUNT (Owner Only)",
      "       ↓",
      "YOUR GRANULAR CONTROLS",
      "       ↓",
      "CONTROLLED / FILTERED DATA",
      "       ↓",
      "SELECTED PUBLIC SAFETY VIEW (Roadside)",
    ],
    sections: [
      {
        id: "privacy-philosophy",
        title: "01 Our Privacy Philosophy",
        content: [
          "This document is a human-readable product guide explaining how privacy works in practice on VaahanSafe. It complements—but does not replace—our formal statutory Privacy Policy.",
          "Our foundational belief is that you should not have to sacrifice your personal privacy, home location, or direct phone number to make your vehicle safe and contactable on Indian streets.",
        ],
      },
      {
        id: "account-vs-safety-view",
        title: "02 Account ≠ Public Safety View",
        content: [
          "The most critical architectural concept is the strict wall between your private owner account and the public roadside safety screen.",
        ],
        callout: {
          type: "distinction",
          title: "CORE SEPARATION",
          left: "PRIVATE OWNER ACCOUNT",
          right: "PUBLIC SAFETY VIEW",
          text: "Your owner account contains your private administrative credentials, order histories, billing details, and full contact options. The Public Safety View contains ONLY the specific data fields you have explicitly authorized for roadside display.",
        },
      },
      {
        id: "always-private",
        title: "03 What Remains Strictly Private",
        content: [
          "The following information is strictly confidential and is NEVER displayed on the public safety screen:",
          "• Your residential or commercial home address.",
          "• Your private account email address.",
          "• Your payment methods, invoice histories, or card details.",
          "• Your full government identity numbers (Aadhaar, PAN, or driving license).",
          "• Your location history or historical whereabouts.",
        ],
      },
      {
        id: "controlled-fields",
        title: "04 Controlled & Optional Fields",
        content: [
          "You retain granular control over what appears on your vehicle's safety screen:",
          "• Emergency Contact Number: You can choose to display the raw phone number, route calls via masked relay, or allow only web-based emergency alert notifications.",
          "• Blood Group: Completely optional. Can be toggled on or off at will.",
          "• Emergency Medical Notes: Completely optional. Edit or clear at any moment.",
          "• Vehicle Model & Color: Displayed by default to help scanners confirm they are viewing the correct vehicle, but can be customized.",
        ],
      },
      {
        id: "scanner-privacy",
        title: "05 Scanner Privacy & Abuse Prevention",
        content: [
          "When a bystander scans your decal, they are not asked to download an app or surrender their personal address book.",
          "To prevent stalking and harassment, our edge servers employ automated rate-limiting and bot-protection filters. If someone attempts to trigger repeated nuisance alerts, their session is temporarily throttled.",
        ],
      },
      {
        id: "access-deletion",
        title: "06 Account Controls & Data Deletion",
        content: [
          "You have the right to request deletion of your vehicle records or deactivate your decals at any time through your dashboard settings.",
          "When a vehicle identity is deleted, its public resolver route is immediately disabled and returns a neutral unassigned status.",
        ],
      },
    ],
    crossLinks: [
      { title: "Statutory Privacy Policy", href: "/privacy" },
      { title: "Terms of Service", href: "/terms" },
      { title: "Safety & Privacy Architecture", href: "/safety" },
    ],
    previousSlug: "safety",
    nextSlug: "plans-orders-support",
  },
  {
    id: "plans-orders-support",
    docId: "DOC / SERVICES / 07",
    number: "07",
    stepName: "MANAGE",
    slug: "plans-orders-support",
    title: "Plans, Orders & Support",
    subtitle: "Understand plans, purchases, shipping, refunds and QR replacement.",
    purpose: "The unified operational reference guide explaining subscription services, order lifecycles, non-refundable purchase terms, delivery mechanisms, and decal replacement workflows.",
    updatedAt: "September 2026",
    whatItCovers: [
      "Sub-Guide 07A: Plans & Subscriptions (QR Identity ≠ Subscription Plan)",
      "Sub-Guide 07B: Purchase & Refund Guide (No Refund ≠ No Support)",
      "Sub-Guide 07C: Shipping & Courier Delivery Guide",
      "Sub-Guide 07D: QR Continuity & Decal Replacement Workflows",
      "Common service scenarios and resolution pathways",
    ],
    diagram: [
      "07A PLANS & SUBSCRIPTIONS",
      "       ↓",
      "07B PURCHASE & REFUND POLICY",
      "       ↓",
      "07C SHIPPING & TRACKING",
      "       ↓",
      "07D QR REPLACEMENT WORKFLOW",
    ],
    sections: [
      {
        id: "guide-overview",
        title: "Collection Overview",
        content: [
          "To avoid fragmenting commercial and service policies across confusing separate pages, VaahanSafe groups all order, subscription, shipping, and replacement guidelines into this unified operational reference.",
          "Explore the four clear sub-guides below to understand how our services, orders, and support mechanisms operate.",
        ],
      },
      {
        id: "sub-guide-07a",
        title: "07A Plans & Subscriptions",
        content: [
          "A fundamental concept in VaahanSafe is the clear separation between your physical vehicle identity and the optional service plans surrounding it.",
          "• QR Identity: Represents your vehicle's physical decal, edge resolver route, and essential public safety view.",
          "• Subscription Plan: Represents value-added cloud communication capabilities, such as automated multi-contact relay chaining, scheduled parking alerts, and prioritized operational monitoring.",
        ],
        callout: {
          type: "distinction",
          title: "CORE SERVICE DISTINCTION",
          left: "QR IDENTITY",
          right: "SUBSCRIPTION PLAN",
          text: "QR IDENTITY ≠ PLAN. Your vehicle identity remains linked to your vehicle decal. Upgrading or modifying a subscription plan alters cloud notification features without altering your decal's physical placement or identity mapping.",
        },
      },
      {
        id: "sub-guide-07b",
        title: "07B Purchase & Refund Guide",
        content: [
          "Completed purchases of custom-manufactured or security-sealed VaahanSafe decal kits and active digital services are generally non-refundable.",
          "Because each physical kit involves unique cryptographic serialization, personalized fulfillment, and anti-fraud packaging, kits cannot be restocked once dispatched.",
        ],
        callout: {
          type: "distinction",
          title: "CUSTOMER SUPPORT PRINCIPLE",
          left: "NO REFUND POLICY",
          right: "NO SUPPORT (FALSE)",
          text: "NO REFUND DOES NOT MEAN NO SUPPORT. If you encounter a technical failure, duplicate billing error, shipping damage, or carrier non-delivery, our dedicated support team resolves the problem through verification, re-dispatch, or account correction.",
        },
        subsections: [
          {
            title: "Evaluating Common Scenarios",
            content: [
              "• Change of mind: Ineligible for refund once package is dispatched or digital token is claimed.",
              "• Duplicate charge: Fully verified and credited back to original payment instrument.",
              "• Failed transaction: Handled automatically by payment gateway within 5–7 banking days.",
              "• Defective or damaged in transit: Eligible for prompt verified replacement without additional charge.",
            ],
          },
        ],
      },
      {
        id: "sub-guide-07c",
        title: "07C Shipping & Courier Guide",
        content: [
          "For online decal kit orders, VaahanSafe coordinates dispatch via reputed domestic courier and postal logistics partners across India.",
          "• Order Processing: Orders are validated, verified, and sent for serialized kit packaging.",
          "• Dispatch & Tracking: Once dispatched, an automated dispatch notification with courier tracking AWB is sent via SMS and email.",
          "• Delivery Address: Ensure complete postal address including PIN code and landmark.",
          "• Address Correction: Address corrections must be submitted before order dispatch occurs.",
        ],
      },
      {
        id: "sub-guide-07d",
        title: "07D QR Replacement Guide",
        content: [
          "When a vehicle windshield is damaged, replaced, or a motorcycle decal is abraded, you do not need to discard your vehicle identity or configuration.",
          "Our replacement architecture allows you to decouple the retired decal and link a fresh replacement decal while preserving all vehicle settings, emergency contacts, and notification preferences.",
        ],
        callout: {
          type: "distinction",
          title: "REPLACEMENT VS REFUND",
          left: "DECAL REPLACEMENT",
          right: "PURCHASE REFUND",
          text: "REPLACEMENT ≠ REFUND. A damaged decal entitles the owner to request a replacement unit under our replacement policy, but does not constitute grounds for cash refund of past subscription or initial purchase fees.",
        },
        subsections: [
          {
            title: "Replacement Workflow",
            content: [
              "1. Request: Submit a replacement request via the Help Center (/help/replacement) indicating vehicle registration.",
              "2. Verification: Verify account ownership via OTP authentication.",
              "3. Dispatch / Retail Pair: Order a replacement decal or pair a new retail kit using your dashboard.",
              "4. Transition: The old QR is retired; the new QR immediately resolves to your existing vehicle record.",
            ],
          },
        ],
      },
    ],
    crossLinks: [
      { title: "Plans & Pricing", href: "/pricing" },
      { title: "Commercial Refund Policy", href: "/refund-policy" },
      { title: "Shipping & Replacement Policy", href: "/shipping-replacement" },
      { title: "Replacement Help Center", href: "/help/replacement" },
    ],
    previousSlug: "privacy",
  },
];

export function getGuideBySlug(slug: string): OfficialGuide | undefined {
  return OFFICIAL_GUIDES.find((guide) => guide.slug === slug);
}

export function getAllGuideSlugs(): string[] {
  return OFFICIAL_GUIDES.map((guide) => guide.slug);
}

export function calculateReadingTimeMinutes(guide: OfficialGuide): number {
  let wordCount = 0;
  for (const section of guide.sections) {
    wordCount += section.title.split(/\s+/).length;
    for (const p of section.content) {
      wordCount += p.split(/\s+/).length;
    }
    if (section.callout) {
      wordCount += section.callout.title.split(/\s+/).length;
      wordCount += section.callout.text.split(/\s+/).length;
    }
    if (section.subsections) {
      for (const sub of section.subsections) {
        wordCount += sub.title.split(/\s+/).length;
        for (const sp of sub.content) {
          wordCount += sp.split(/\s+/).length;
        }
      }
    }
  }
  // Standard reading speed: 200 words per minute
  return Math.max(2, Math.ceil(wordCount / 200));
}
