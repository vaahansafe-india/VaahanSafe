import { REPORT_BUTTON_TEMPLATES } from "./report-buttons";

type Msg91Contract = { language: string; bodyCount: number; urlButtons?: readonly RegExp[] };

/** Exact provider contracts. Report templates also require live approval before dispatch. */
export const MSG91_TEMPLATE_CATALOG = {
  vhn_welcome_v1: { language: "en", bodyCount: 1 },
  vhn_qr_activated_v1: { language: "en_US", bodyCount: 2 },
  vhn_qr_scan_notice_v2: { language: "en_US", bodyCount: 2 },
  vhn_vehicle_report_v1: { language: "en", bodyCount: 5 },
  vhn_vehicle_emergency_report_v1: { language: "en", bodyCount: 5 },
  vhn_emergency_contact_report_v1: { language: "en", bodyCount: 4 },
  vhn_vehicle_report_v2: { language: "en", bodyCount: 5 },
  vhn_vehicle_emergency_report_v2: { language: "en", bodyCount: 5 },
  vhn_emergency_contact_report_v2: { language: "en", bodyCount: 5 },
  [REPORT_BUTTON_TEMPLATES.owner.report]: reportButtonContract(false),
  [REPORT_BUTTON_TEMPLATES.owner.directions]: reportButtonContract(true),
  [REPORT_BUTTON_TEMPLATES.ownerEmergency.report]: reportButtonContract(false),
  [REPORT_BUTTON_TEMPLATES.ownerEmergency.directions]: reportButtonContract(true),
  [REPORT_BUTTON_TEMPLATES.contact.report]: reportButtonContract(false),
  [REPORT_BUTTON_TEMPLATES.contact.directions]: reportButtonContract(true),
  vhn_payment_success_v1: { language: "en", bodyCount: 2 },
  vhn_shipment_update_v1: { language: "en", bodyCount: 2 },
  vhn_sub_renewed_v1: { language: "en", bodyCount: 2 },
  vhn_sub_failed_v1: { language: "en", bodyCount: 1 },
  vhn_replace_approved_v1: { language: "en", bodyCount: 1 },
  vhn_security_alert_v1: { language: "en", bodyCount: 2 },
  vhn_support_update_v1: { language: "en", bodyCount: 2 },
} as const satisfies Record<string, Msg91Contract>;

function reportButtonContract(withDirections: boolean): Msg91Contract {
  return {
    language: "en",
    bodyCount: 3,
    urlButtons: [
      /^[A-Za-z0-9_-]{43}$/,
      ...(withDirections ? [/^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/] : []),
    ],
  };
}

export type Msg91TemplateName = keyof typeof MSG91_TEMPLATE_CATALOG;

export function getMsg91Template(name: string): Msg91Contract {
  if (!Object.prototype.hasOwnProperty.call(MSG91_TEMPLATE_CATALOG, name)) {
    throw new Error("MSG91_TEMPLATE_NOT_APPROVED");
  }
  return MSG91_TEMPLATE_CATALOG[name as Msg91TemplateName];
}

export function getMsg91TemplateVariableNames(contract: Msg91Contract) {
  return [
    ...Array.from({ length: contract.bodyCount }, (_, i) => `body_${i + 1}`),
    ...(contract.urlButtons || []).map((_, i) => `button_${i + 1}`),
  ];
}

/** Only exact positional components reach the provider. */
export function buildMsg91Components(
  name: string,
  parameters: Record<string, string>,
) {
  const { bodyCount, urlButtons = [] } = getMsg91Template(name);
  if (Object.keys(parameters).length !== bodyCount + urlButtons.length) {
    throw new Error("MSG91_TEMPLATE_PARAMETERS_INVALID");
  }
  const components: Record<string, { type: "text"; value: string; subtype?: "url" }> = {};
  for (let index = 1; index <= bodyCount; index++) {
    const value = parameters[String(index)];
    if (typeof value !== "string" || !value.trim() || value.length > 1024) {
      throw new Error("MSG91_TEMPLATE_PARAMETERS_INVALID");
    }
    components[`body_${index}`] = { type: "text", value };
  }
  for (const [index, validation] of urlButtons.entries()) {
    const field = `button_${index + 1}`;
    const value = parameters[field];
    if (typeof value !== "string" || !validation.test(value)) {
      throw new Error("MSG91_TEMPLATE_PARAMETERS_INVALID");
    }
    components[field] = { subtype: "url", type: "text", value };
  }
  return components;
}
