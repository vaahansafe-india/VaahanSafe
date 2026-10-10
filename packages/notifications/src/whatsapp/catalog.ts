/** Approved contracts inspected in the VaahanSafe MSG91 dashboard on 8 October 2026. */
export const MSG91_TEMPLATE_CATALOG = {
  vhn_welcome_v1: { language: "en", bodyCount: 1 },
  vhn_qr_activated_v1: { language: "en_US", bodyCount: 2 },
  vhn_qr_scan_notice_v2: { language: "en_US", bodyCount: 2 },
  vhn_vehicle_report_v1: { language: 'en', bodyCount: 5 },
  vhn_vehicle_emergency_report_v1: { language: 'en', bodyCount: 5 },
  vhn_payment_success_v1: { language: "en", bodyCount: 2 },
  vhn_shipment_update_v1: { language: "en", bodyCount: 2 },
  vhn_sub_renewed_v1: { language: "en", bodyCount: 2 },
  vhn_sub_failed_v1: { language: "en", bodyCount: 1 },
  vhn_replace_approved_v1: { language: "en", bodyCount: 1 },
  vhn_security_alert_v1: { language: "en", bodyCount: 2 },
  vhn_support_update_v1: { language: "en", bodyCount: 2 },
} as const;

export type Msg91TemplateName = keyof typeof MSG91_TEMPLATE_CATALOG;

export function getMsg91Template(name: string) {
  if (!Object.prototype.hasOwnProperty.call(MSG91_TEMPLATE_CATALOG, name)) {
    throw new Error("MSG91_TEMPLATE_NOT_APPROVED");
  }
  return MSG91_TEMPLATE_CATALOG[name as Msg91TemplateName];
}

/** Only exact positional components reach the provider. */
export function buildMsg91Components(name: string, parameters: Record<string, string>) {
  const { bodyCount } = getMsg91Template(name);
  const keys = Object.keys(parameters);
  if (keys.length !== bodyCount || keys.some((key) => !/^[1-9]\d*$/.test(key))) {
    throw new Error("MSG91_TEMPLATE_PARAMETERS_INVALID");
  }
  const components: Record<string, { type: "text"; value: string }> = {};
  for (let index = 1; index <= bodyCount; index++) {
    const value = parameters[String(index)];
    if (typeof value !== "string" || !value.trim() || value.length > 1024) {
      throw new Error("MSG91_TEMPLATE_PARAMETERS_INVALID");
    }
    components[`body_${index}`] = { type: "text", value };
  }
  return components;
}
