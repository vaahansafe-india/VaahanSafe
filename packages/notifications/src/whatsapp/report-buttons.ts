export const REPORT_VIEW_BUTTON = "https://view.vaahansafe.com/r#";
export const REPORT_DIRECTIONS_BUTTON =
  "https://www.google.com/maps/dir/?api=1&destination=";

export const REPORT_BUTTON_TEMPLATES = {
  owner: {
    report: "vhn_vehicle_report_v4",
    directions: "vhn_vehicle_report_map_v4",
    header: "VaahanSafe | Vehicle report",
    introduction: "Someone shared a report about your vehicle.",
    guidance: "",
  },
  ownerEmergency: {
    report: "vhn_vehicle_emergency_report_v4",
    directions: "vhn_vehicle_emergency_report_map_v4",
    header: "VaahanSafe | Possible emergency",
    introduction: "Someone reported a possible emergency involving your vehicle.",
    guidance: "Check the situation when safe. In immediate danger, call 112.",
  },
  contact: {
    report: "vhn_emergency_contact_report_v4",
    directions: "vhn_emergency_contact_report_map_v4",
    header: "VaahanSafe | Emergency contact alert",
    introduction: "You’re listed as an emergency contact for this vehicle. Someone reported a possible emergency.",
    guidance: "Check in with the vehicle owner when safe. In immediate danger, call 112.",
  },
} as const;

export type ReportButtonAudience = keyof typeof REPORT_BUTTON_TEMPLATES;
export const reportButtonTemplates = Object.entries(REPORT_BUTTON_TEMPLATES).flatMap(
  ([audience, definition]) => [false, true].map((withDirections) => ({
    name: withDirections ? definition.directions : definition.report,
    heading: definition.header,
    body: [
      definition.introduction,
      "*Vehicle* · {{1}}\n*Report* · {{2}}\n*Time* · {{3}}",
      withDirections ? "Location shared by the reporter." : "No location was shared.",
      definition.guidance,
    ].filter(Boolean).join("\n\n"),
    footer: "Private report access expires after 24 hours.",
    sampleReason: audience === "owner" ? "Parking or blocked access" : "Possible emergency",
    buttons: [
      { text: "View report", base: REPORT_VIEW_BUTTON, sample: "A".repeat(43) },
      ...(withDirections ? [
        { text: "Get directions", base: REPORT_DIRECTIONS_BUTTON, sample: "19.076,72.8777" },
      ] : []),
    ],
  })),
);

export function reportDirectionsDestination(location: string): string | undefined {
  const match = /^Finder-shared GPS \(accuracy (?:\+\/-|±)\d+ m\): https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/.exec(location);
  if (!match) return;
  const [, latitude, longitude] = match;
  if (Math.abs(Number(latitude)) <= 90 && Math.abs(Number(longitude)) <= 180) {
    return `${latitude},${longitude}`;
  }
}

export function renderReportButtons(
  audience: ReportButtonAudience,
  report: { viewerUrl?: string; vehicleMaskedReg: string; scannedAtFormatted: string; locationText: string },
  reason: string,
  approved: ReadonlySet<string>,
) {
  const proof = report.viewerUrl?.match(/^https:\/\/view\.vaahansafe\.com\/r#([A-Za-z0-9_-]{43})$/)?.[1];
  if (!proof) return;
  const location = reportDirectionsDestination(report.locationText);
  const variants = REPORT_BUTTON_TEMPLATES[audience];
  const name = location ? variants.directions : variants.report;
  if (!approved.has(name)) return;

  return {
    templateName: name,
    languageCode: "en",
    parameters: {
      1: report.vehicleMaskedReg,
      2: reason,
      3: report.scannedAtFormatted,
      button_1: proof,
      ...(location ? { button_2: location } : {}),
    },
  };
}
