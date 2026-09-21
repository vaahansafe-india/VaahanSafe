export interface HelpStep {
  stepNumber: number;
  title: string;
  instruction: string;
}

export interface HelpArticle {
  id: string;
  categoryId: string;
  categoryTitle: string;
  articleNumber: string;
  title: string;
  summary: string;
  beforeYouStart?: readonly string[];
  whatYouNeed?: readonly string[];
  steps: readonly HelpStep[];
  whatHappensNext: string;
  relatedHelp: readonly { title: string; href: string }[];
  keywords: readonly string[];
}

export interface HelpCategory {
  id: string;
  index: string;
  title: string;
  description: string;
  icon: "check" | "qr-code" | "shield" | "user" | "receipt" | "phone";
  articles: readonly HelpArticle[];
}

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  href: string;
  badge?: string;
}

export const HELP_QUICK_ACTIONS: readonly QuickAction[] = [
  {
    id: "activate-retail",
    label: "Activate a Retail QR →",
    description: "Connect your pre-issued store or dealer kit to your vehicle profile.",
    href: "/help/activation",
    badge: "Model B",
  },
  {
    id: "replace-qr",
    label: "Replace a QR →",
    description: "Guidance for lost, damaged, unreadable, or replaced glass decals.",
    href: "/help/replacement",
    badge: "Continuity",
  },
  {
    id: "manage-safety",
    label: "Manage Safety Information →",
    description: "Configure emergency contacts, blood group, and medical notes.",
    href: "/safety",
    badge: "Privacy",
  },
  {
    id: "understand-plans",
    label: "Understand Your Plan →",
    description: "Learn what features surround your vehicle identity and how tiers work.",
    href: "/pricing",
    badge: "Services",
  },
];

export const HELP_CATEGORIES: readonly HelpCategory[] = [
  {
    id: "getting-started",
    index: "01",
    title: "Getting Started",
    description: "Fundamental setup, vehicle identity assignment, and unboxing.",
    icon: "check",
    articles: [
      {
        id: "what-is-vaahansafe",
        categoryId: "getting-started",
        categoryTitle: "Getting Started",
        articleNumber: "01",
        title: "What is VaahanSafe?",
        summary: "An overview of how physical decals connect to a digital vehicle safety record.",
        beforeYouStart: [
          "Understand that VaahanSafe is not a toll tag or government registration plate.",
          "Keep your smartphone camera handy for initial onboarding.",
        ],
        whatYouNeed: [
          "Vehicle registration details (RC copy or registration number).",
          "Primary emergency contact phone numbers.",
        ],
        steps: [
          {
            stepNumber: 1,
            title: "Physical Vehicle Anchor",
            instruction: "Every VaahanSafe record begins with a physical machine. The durable decal provides a curb-side gateway for bystanders.",
          },
          {
            stepNumber: 2,
            title: "Digital Identity Binding",
            instruction: "Your unique alphanumeric code (e.g., VS-7F3K-9021) is recorded on the VaahanSafe network, linking the decal to your private portal.",
          },
          {
            stepNumber: 3,
            title: "Configured Safety View",
            instruction: "You choose what emergency contacts and non-sensitive medical details appear when someone scans your decal.",
          },
        ],
        whatHappensNext: "Your vehicle is equipped with an accessible roadside identity that can relay help in an emergency without exposing your home address.",
        relatedHelp: [
          { title: "Explore how VaahanSafe works", href: "/how-it-works" },
          { title: "Adding a vehicle", href: "#article-adding-a-vehicle" },
        ],
        keywords: ["overview", "introduction", "basics", "identity", "what is vaahansafe"],
      },
      {
        id: "getting-your-qr",
        categoryId: "getting-started",
        categoryTitle: "Getting Started",
        articleNumber: "02",
        title: "Getting your QR",
        summary: "How to order online or purchase an authorized packaged retail kit.",
        steps: [
          {
            stepNumber: 1,
            title: "Choose Your Acquisition Channel",
            instruction: "Order directly online for home delivery or pick up an official VaahanSafe kit from an automotive dealership or accessory shop.",
          },
          {
            stepNumber: 2,
            title: "Verify Packaging Integrity",
            instruction: "Ensure the retail pack is sealed and the concealed scratch activation panel is intact before peeling.",
          },
          {
            stepNumber: 3,
            title: "Receive and Prepare",
            instruction: "Follow the included positioning guide to prepare a clean, lint-free surface on your vehicle windshield.",
          },
        ],
        whatHappensNext: "Once received, proceed to clean your glass surface and complete the activation workflow.",
        relatedHelp: [
          { title: "Retail Activation Help", href: "/help/activation" },
          { title: "QR Placement Guide", href: "/gallery" },
        ],
        keywords: ["order", "purchase", "delivery", "buy", "dealership"],
      },
      {
        id: "adding-a-vehicle",
        categoryId: "getting-started",
        categoryTitle: "Getting Started",
        articleNumber: "03",
        title: "Adding a vehicle to your account",
        summary: "Step-by-step instructions for linking a car or two-wheeler to your dashboard.",
        beforeYouStart: [
          "Log in to your account at app.vaahansafe.com.",
        ],
        whatYouNeed: [
          "Vehicle registration number, make, and model.",
        ],
        steps: [
          {
            stepNumber: 1,
            title: "Navigate to My Vehicles",
            instruction: "Open your customer dashboard and click '+ Add Vehicle'.",
          },
          {
            stepNumber: 2,
            title: "Enter Vehicle Particulars",
            instruction: "Enter the registration number and vehicle type (Four-Wheeler or Two-Wheeler).",
          },
          {
            stepNumber: 3,
            title: "Assign a Decal",
            instruction: "Select an unassigned decal order or scan your retail pack to bind the physical identifier.",
          },
        ],
        whatHappensNext: "The vehicle appears in your vehicle list where emergency contacts and safety views can be customized.",
        relatedHelp: [
          { title: "Emergency contacts setup", href: "#article-emergency-contacts" },
          { title: "Retail Activation Help", href: "/help/activation" },
        ],
        keywords: ["add car", "add bike", "register vehicle", "dashboard", "garage"],
      },
      {
        id: "understanding-vehicle-identity",
        categoryId: "getting-started",
        categoryTitle: "Getting Started",
        articleNumber: "04",
        title: "Understanding your vehicle identity",
        summary: "Why your alphanumeric code is separate from your account credentials.",
        steps: [
          {
            stepNumber: 1,
            title: "Permanent Roadside Beacon",
            instruction: "The alphanumeric ID (e.g. VS-7F3K-9021) identifies the vehicle in traffic and emergency situations.",
          },
          {
            stepNumber: 2,
            title: "Account Independence",
            instruction: "Bystanders see only the configured public profile; your private account logins, home address, and payment cards remain strictly segregated.",
          },
        ],
        whatHappensNext: "Review the Safety & Privacy architecture to fine-tune your visibility preferences.",
        relatedHelp: [
          { title: "Safety & Privacy Architecture", href: "/safety" },
        ],
        keywords: ["identity code", "VS code", "security", "privacy boundary"],
      },
    ],
  },
  {
    id: "qr-vehicle",
    index: "02",
    title: "QR & Vehicle",
    description: "Affixing, scanning, maintaining, and replacing your physical decals.",
    icon: "qr-code",
    articles: [
      {
        id: "qr-placement",
        categoryId: "qr-vehicle",
        categoryTitle: "QR & Vehicle",
        articleNumber: "01",
        title: "QR placement and application",
        summary: "Proper locations on car windshields, quarter glass, and two-wheeler bodywork.",
        steps: [
          {
            stepNumber: 1,
            title: "Select an Unobstructed Location",
            instruction: "On cars, choose the passenger-side lower windshield quadrant or fixed quarter glass. On two-wheelers, select a clean, rigid body panel.",
          },
          {
            stepNumber: 2,
            title: "Clean with Alcohol Wipe",
            instruction: "Degrease the glass or plastic surface thoroughly. Ensure it is 100% dry and dust-free.",
          },
          {
            stepNumber: 3,
            title: "Affix Firmly",
            instruction: "Peel the backing liner and apply pressure from center to edges to prevent trapped air pockets.",
          },
        ],
        whatHappensNext: "Test the decal by scanning it with your smartphone camera to confirm optical resolution.",
        relatedHelp: [
          { title: "Visual QR Placement Guide", href: "/gallery" },
        ],
        keywords: ["stick decal", "windshield", "install", "placement guide", "apply"],
      },
      {
        id: "scanning-the-qr",
        categoryId: "qr-vehicle",
        categoryTitle: "QR & Vehicle",
        articleNumber: "02",
        title: "Scanning the QR in an emergency",
        summary: "How first responders or parking marshals scan the decal without downloading an app.",
        steps: [
          {
            stepNumber: 1,
            title: "Open Phone Camera",
            instruction: "Point any standard iOS or Android camera at the decal from 25 to 50 cm away.",
          },
          {
            stepNumber: 2,
            title: "Tap Notification Link",
            instruction: "Tap the recognized vaahansafe.com link banner in the camera viewfinder.",
          },
          {
            stepNumber: 3,
            title: "Access Emergency Relay",
            instruction: "Review vehicle context, blood group tags, and tap 'Call Emergency Contact' or 'Alert Owner'.",
          },
        ],
        whatHappensNext: "The call or SMS alert is routed immediately without exposing personal phone numbers directly.",
        relatedHelp: [
          { title: "Public safety view details", href: "/safety" },
        ],
        keywords: ["scan", "camera", "how to scan", "responder", "bystander"],
      },
      {
        id: "damaged-qr",
        categoryId: "qr-vehicle",
        categoryTitle: "QR & Vehicle",
        articleNumber: "03",
        title: "Replacing a damaged QR",
        summary: "What to do if your windshield is replaced or decal is scratched.",
        beforeYouStart: [
          "Inspect whether the optical target is scannable or completely degraded.",
        ],
        whatYouNeed: [
          "Access to your VaahanSafe account at app.vaahansafe.com.",
        ],
        steps: [
          {
            stepNumber: 1,
            title: "Identify the Vehicle",
            instruction: "Open your customer portal and select the vehicle associated with the damaged decal.",
          },
          {
            stepNumber: 2,
            title: "Request Replacement",
            instruction: "Submit a replacement request. Where eligible, a replacement QR is safely linked to your existing vehicle record.",
          },
          {
            stepNumber: 3,
            title: "Deactivate Old Decal",
            instruction: "Upon binding the new decal, the previous optical code is permanently revoked for security.",
          },
        ],
        whatHappensNext: "Your new decal is dispatched to your address while your emergency contact history remains intact.",
        relatedHelp: [
          { title: "QR Replacement Help Workflow", href: "/help/replacement" },
          { title: "Shipping & Replacement Policy", href: "/shipping-replacement" },
        ],
        keywords: ["broken decal", "scratched", "windshield replacement", "peeled"],
      },
      {
        id: "lost-qr",
        categoryId: "qr-vehicle",
        categoryTitle: "QR & Vehicle",
        articleNumber: "04",
        title: "Lost or unattached QR",
        summary: "Handling unapplied decals that have been lost before application.",
        steps: [
          {
            stepNumber: 1,
            title: "Mark as Inactive",
            instruction: "If a retail decal or shipment is lost before being affixed, report it in your dashboard.",
          },
          {
            stepNumber: 2,
            title: "Order Replacement Kit",
            instruction: "Order a fresh decal kit to pair with your vehicle profile.",
          },
        ],
        whatHappensNext: "The unactivated code is flagged and blocked from unauthorized enrollment.",
        relatedHelp: [
          { title: "QR Replacement Help", href: "/help/replacement" },
        ],
        keywords: ["lost decal", "misplaced", "stolen", "missing"],
      },
    ],
  },
  {
    id: "retail-activation",
    index: "03",
    title: "Retail Activation",
    description: "Guidance for activating physical packs purchased from dealers and stores.",
    icon: "check",
    articles: [
      {
        id: "how-activation-works",
        categoryId: "retail-activation",
        categoryTitle: "Retail Activation",
        articleNumber: "01",
        title: "How retail activation works",
        summary: "The Model B enrollment journey from retail purchase to live protection.",
        steps: [
          {
            stepNumber: 1,
            title: "Scan the Packaged QR",
            instruction: "Scan the decal with your mobile phone camera to open activate.vaahansafe.com.",
          },
          {
            stepNumber: 2,
            title: "Scratch to Reveal PIN",
            instruction: "Gently scratch the silver security box to reveal your 6-character activation key.",
          },
          {
            stepNumber: 3,
            title: "Verify and Bind",
            instruction: "Sign in with your mobile OTP and select the car or motorcycle to link the decal.",
          },
        ],
        whatHappensNext: "The decal is instantly active and scannable by anyone on the road.",
        relatedHelp: [
          { title: "Retail Activation Guide", href: "/help/activation" },
        ],
        keywords: ["store", "dealer", "scratch card", "activation code", "model b"],
      },
      {
        id: "activation-problems",
        categoryId: "retail-activation",
        categoryTitle: "Retail Activation",
        articleNumber: "02",
        title: "Troubleshooting activation issues",
        summary: "Resolving scratch code readability, invalid keys, or network errors.",
        steps: [
          {
            stepNumber: 1,
            title: "Check Character Legibility",
            instruction: "Ensure characters like '0' (zero) and 'O' (letter), or '1' and 'I' are not confused.",
          },
          {
            stepNumber: 2,
            title: "Verify Network Connection",
            instruction: "Ensure your mobile device has active internet connectivity when submitting the verification request.",
          },
          {
            stepNumber: 3,
            title: "Contact Support with Pack Serial",
            instruction: "If the scratch area is damaged, contact support with the visible public ID on the front of the decal.",
          },
        ],
        whatHappensNext: "Support can inspect retail batch fulfillment records and issue an activation override.",
        relatedHelp: [
          { title: "Retail Activation Help", href: "/help/activation" },
        ],
        keywords: ["invalid code", "scratch damaged", "cannot activate", "activation error"],
      },
    ],
  },
  {
    id: "safety-privacy",
    index: "04",
    title: "Safety & Privacy",
    description: "Configuring public visibility, emergency contacts, and privacy boundaries.",
    icon: "shield",
    articles: [
      {
        id: "public-safety-view",
        categoryId: "safety-privacy",
        categoryTitle: "Safety & Privacy",
        articleNumber: "01",
        title: "The public safety view",
        summary: "What bystanders see when scanning your vehicle decal.",
        steps: [
          {
            stepNumber: 1,
            title: "Vehicle Profile Context",
            instruction: "Displays vehicle make, color, and synthetic ID to confirm matching identity.",
          },
          {
            stepNumber: 2,
            title: "Emergency Relays",
            instruction: "Provides one-touch call or SMS relays to pre-configured primary contacts.",
          },
          {
            stepNumber: 3,
            title: "Optional Medical Data",
            instruction: "Displays user-provided blood group or urgent medical allergies if configured by the owner.",
          },
        ],
        whatHappensNext: "Review your active profile anytime in the customer app to add or remove visible attributes.",
        relatedHelp: [
          { title: "Safety & Privacy Architecture", href: "/safety" },
        ],
        keywords: ["public view", "bystander view", "emergency screen", "medical tags"],
      },
      {
        id: "emergency-contacts",
        categoryId: "safety-privacy",
        categoryTitle: "Safety & Privacy",
        articleNumber: "02",
        title: "Managing emergency contacts",
        summary: "Adding primary, secondary, and family contacts for roadside relays.",
        steps: [
          {
            stepNumber: 1,
            title: "Access Emergency Contacts Panel",
            instruction: "Log in and select your vehicle, then open 'Emergency Contacts'.",
          },
          {
            stepNumber: 2,
            title: "Enter Verified Phone Numbers",
            instruction: "Provide contacts who are typically reachable during transit (spouse, parent, driver depot).",
          },
          {
            stepNumber: 3,
            title: "Set Relay Priority",
            instruction: "Assign primary contact order for sequential calling relays.",
          },
        ],
        whatHappensNext: "Saved contacts are updated immediately on the safety projection resolver.",
        relatedHelp: [
          { title: "Plans & Notification Relays", href: "/pricing" },
        ],
        keywords: ["contacts", "sos numbers", "family phone", "relay"],
      },
      {
        id: "privacy-controls",
        categoryId: "safety-privacy",
        categoryTitle: "Safety & Privacy",
        articleNumber: "03",
        title: "Privacy controls and boundaries",
        summary: "Ensuring residential addresses and emails remain strictly concealed.",
        steps: [
          {
            stepNumber: 1,
            title: "Account Isolation",
            instruction: "Account billing information, email addresses, and residential premises are never published to the QR view.",
          },
          {
            stepNumber: 2,
            title: "Selective Projection",
            instruction: "Toggle individual fields like blood group or owner name on/off based on your comfort level.",
          },
        ],
        whatHappensNext: "Changes take effect instantaneously across edge network resolvers.",
        relatedHelp: [
          { title: "Legal Privacy Policy", href: "/privacy" },
          { title: "Safety & Privacy Product Page", href: "/safety" },
        ],
        keywords: ["hidden info", "privacy shield", "hide address", "data protection"],
      },
    ],
  },
  {
    id: "account",
    index: "05",
    title: "Account & Profile",
    description: "Mobile OTP logins, vehicle transfers, and profile administration.",
    icon: "user",
    articles: [
      {
        id: "sign-in-otp",
        categoryId: "account",
        categoryTitle: "Account & Profile",
        articleNumber: "01",
        title: "Signing in with mobile verification",
        summary: "Secure passwordless access using your registered Indian mobile number.",
        steps: [
          {
            stepNumber: 1,
            title: "Enter Mobile Number",
            instruction: "Visit app.vaahansafe.com and enter your 10-digit mobile phone number.",
          },
          {
            stepNumber: 2,
            title: "Receive One-Time Password",
            instruction: "Enter the 6-digit SMS verification code dispatched to your handset.",
          },
          {
            stepNumber: 3,
            title: "Access Dashboard",
            instruction: "Manage your registered vehicles, decals, and order history.",
          },
        ],
        whatHappensNext: "Sessions remain securely cached on your trusted browser.",
        relatedHelp: [
          { title: "Terms of Service", href: "/terms" },
        ],
        keywords: ["login", "otp", "sign in", "mobile number", "sms code"],
      },
      {
        id: "vehicle-management",
        categoryId: "account",
        categoryTitle: "Account & Profile",
        articleNumber: "02",
        title: "Managing multiple vehicles",
        summary: "Overseeing two-wheelers and cars under a single family or commercial account.",
        steps: [
          {
            stepNumber: 1,
            title: "Switch Vehicles in Header",
            instruction: "Use the vehicle switcher dropdown in your dashboard to view specific decals.",
          },
          {
            stepNumber: 2,
            title: "Customize Independent Settings",
            instruction: "Each vehicle maintains its own emergency contacts, blood group info, and scan history.",
          },
        ],
        whatHappensNext: "Easily order replacement decals or add new family vehicles at any time.",
        relatedHelp: [
          { title: "Adding a vehicle", href: "#article-adding-a-vehicle" },
        ],
        keywords: ["multi-car", "garage", "family portal", "fleet"],
      },
    ],
  },
  {
    id: "plans-orders",
    index: "06",
    title: "Plans & Orders",
    description: "Decal orders, shipping, subscription services, and refunds.",
    icon: "receipt",
    articles: [
      {
        id: "understanding-plans",
        categoryId: "plans-orders",
        categoryTitle: "Plans & Orders",
        articleNumber: "01",
        title: "Understanding service plans",
        summary: "Why the physical decal is the identity, and the plan is the service layer.",
        steps: [
          {
            stepNumber: 1,
            title: "Baseline Decal Pairing",
            instruction: "Every physical decal includes permanent roadside identity resolution and primary contact relay.",
          },
          {
            stepNumber: 2,
            title: "Active Protection Tier",
            instruction: "Extends capabilities to 3 cascading emergency contacts, instant scan SMS alerts, and priority replacement dispatch.",
          },
        ],
        whatHappensNext: "Review and manage your plan tier directly from your customer dashboard.",
        relatedHelp: [
          { title: "Plans Architecture", href: "/pricing" },
        ],
        keywords: ["pricing", "subscription", "annual plan", "tier", "essential"],
      },
      {
        id: "shipping-replacement-orders",
        categoryId: "plans-orders",
        categoryTitle: "Plans & Orders",
        articleNumber: "02",
        title: "Shipping and order tracking",
        summary: "Order dispatch timelines, surface courier delivery, and replacement kits.",
        steps: [
          {
            stepNumber: 1,
            title: "Order Dispatch",
            instruction: "Online decal orders are typically processed and handed to regional courier partners promptly.",
          },
          {
            stepNumber: 2,
            title: "Track Package",
            instruction: "Check your dispatch confirmation SMS for courier AWB tracking links.",
          },
        ],
        whatHappensNext: "Decal kits arrive in protective envelopes with surface prep wipes and application guides.",
        relatedHelp: [
          { title: "Shipping & Replacement Policy", href: "/shipping-replacement" },
          { title: "Refund Policy", href: "/refund-policy" },
        ],
        keywords: ["tracking", "courier", "delivery", "dispatch", "awb"],
      },
    ],
  },
];

export const ALL_HELP_ARTICLES: readonly HelpArticle[] = HELP_CATEGORIES.flatMap(
  (cat) => cat.articles
);
