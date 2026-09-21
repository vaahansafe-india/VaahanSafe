/**
 * VAAHANSAFE DEMO DATA
 *
 * This file contains strictly simulated seed/demonstration data for public
 * marketing, hero interactions, and preview flows.
 *
 * NOTE: All mobile numbers, vehicle registrations, and personal records
 * are synthetic and do not correspond to live customer data.
 */

export interface HeroIdentityDemoData {
  publicId: string;
  batchId: string;
  status: "ACTIVE" | "UNACTIVATED" | "REPLACED" | "INVALID";
  vehicle: {
    make: string;
    model: string;
    edition: string;
    plateNumber: string;
    fuelType: string;
    color: string;
    registrationState: string;
  };
  emergency: {
    profileStatus: string;
    approvedContactsCount: number;
    contacts: Array<{
      role: string;
      maskedPhone: string;
      verified: boolean;
    }>;
    safetyNote: string;
    maskingRelay: string;
  };
  telemetry: {
    lastResolverCheck: string;
    edgeLatency: string;
    securityHash: string;
  };
}

export const HERO_IDENTITY_DEMO: HeroIdentityDemoData = {
  publicId: "VS-7F3K-9021",
  batchId: "B-OCT-26/DL",
  status: "ACTIVE",
  vehicle: {
    make: "Tata",
    model: "Safari",
    edition: "Dark Edition",
    plateNumber: "DL 01 AB 9021",
    fuelType: "Diesel Kryotec 2.0L",
    color: "Oberon Black",
    registrationState: "Delhi (DL-01)",
  },
  emergency: {
    profileStatus: "Active & Monitored",
    approvedContactsCount: 2,
    contacts: [
      {
        role: "Primary Contact (Spouse)",
        maskedPhone: "+91 ••••• ••421",
        verified: true,
      },
      {
        role: "Secondary Contact (Brother)",
        maskedPhone: "+91 ••••• ••980",
        verified: true,
      },
    ],
    safetyNote: "Blood Group: O+ • No critical allergies • Emergency dispatch ready",
    maskingRelay: "Cloudflare Turnstile + MSG91 WhatsApp Relay",
  },
  telemetry: {
    lastResolverCheck: "14ms ago",
    edgeLatency: "18ms",
    securityHash: "7d8f4c2a-9482",
  },
};
