/**
 * VAAHANSAFE HOMEPAGE DEMO DATA CONTRACT
 *
 * Strictly synthetic, isolated data for marketing demonstrations and visual previews.
 * Contains ZERO production customer records, zero real vehicle plates, and zero
 * activation secrets.
 */

export interface HomepageDemoData {
  hero: { visibleCode: string; vehicleDisplay: string; profile: string };
  vehicle: {
    visibleCode: string;
    vehicleType: string;
    vehicleDisplay: string;
    plateMasked: string;
    status: "ACTIVE";
    fuelType: string;
    color: string;
  };
  emergency: {
    ownerDisplayName: string;
    bloodGroup: string;
    safetyNotes: string;
    primaryContactRole: string;
    maskedPhone: string;
  };
  evidenceConfig: {
    hasPublishedEvidence: boolean;
    evidenceItems: Array<{
      id: string;
      quote: string;
      source: string;
      context: string;
    }>;
  };
}

export const HOMEPAGE_DEMO_DATA: HomepageDemoData = {
  hero: {
    visibleCode: "VS-7F3K-9021",
    vehicleDisplay: "Demo Vehicle",
    profile: "Privacy Controlled",
  },
  vehicle: {
    visibleCode: "VS-7F3K-9021",
    vehicleType: "Two Wheeler",
    vehicleDisplay: "Honda — Demo Vehicle",
    plateMasked: "DL 01 •••• 4821",
    status: "ACTIVE",
    fuelType: "Petrol",
    color: "Pearl Siren Blue",
  },
  emergency: {
    ownerDisplayName: "Demo Owner",
    bloodGroup: "O+",
    safetyNotes:
      "Demo emergency medical profile. In an accident, please alert the designated emergency contact.",
    primaryContactRole: "Emergency Contact (Spouse)",
    maskedPhone: "+91 ••••• ••001",
  },
  evidenceConfig: {
    // CRITICAL: Must remain false unless verified, formal real evidence exists.
    hasPublishedEvidence: false,
    evidenceItems: [],
  },
};
