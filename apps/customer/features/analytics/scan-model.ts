export const SCAN_OUTCOMES = {
  RESOLVED_ACTIVE: "Active safety view",
  RESOLVED_INACTIVE: "Activation required",
  RESOLVED_REPLACED: "Replaced QR",
  RESOLVED_BLOCKED: "Blocked QR",
  NOT_FOUND: "Not found",
  OTHER: "Not resolved",
  NON_ACTIVE: "All non-active outcomes",
  NOT_RESOLVED: "All not-resolved outcomes",
} as const;
export function outcomeLabel(value: string | null) {
  return value && value in SCAN_OUTCOMES
    ? SCAN_OUTCOMES[value as keyof typeof SCAN_OUTCOMES]
    : "Outcome not recorded";
}
export const scanColors = ["#718f72", "#d4a35d", "#c7654c", "#718b9c"] as const;
export const INDIA_REGIONS: Record<string, string> = {
  "IN-AN": "Andaman & Nicobar Islands",
  "IN-AP": "Andhra Pradesh",
  "IN-AR": "Arunachal Pradesh",
  "IN-AS": "Assam",
  "IN-BR": "Bihar",
  "IN-CH": "Chandigarh",
  "IN-CG": "Chhattisgarh",
  "IN-DH": "Dadra & Nagar Haveli and Daman & Diu",
  "IN-DL": "Delhi",
  "IN-GA": "Goa",
  "IN-GJ": "Gujarat",
  "IN-HR": "Haryana",
  "IN-HP": "Himachal Pradesh",
  "IN-JK": "Jammu & Kashmir",
  "IN-JH": "Jharkhand",
  "IN-KA": "Karnataka",
  "IN-KL": "Kerala",
  "IN-LA": "Ladakh",
  "IN-LD": "Lakshadweep",
  "IN-MP": "Madhya Pradesh",
  "IN-MH": "Maharashtra",
  "IN-MN": "Manipur",
  "IN-ML": "Meghalaya",
  "IN-MZ": "Mizoram",
  "IN-NL": "Nagaland",
  "IN-OD": "Odisha",
  "IN-PY": "Puducherry",
  "IN-PB": "Punjab",
  "IN-RJ": "Rajasthan",
  "IN-SK": "Sikkim",
  "IN-TN": "Tamil Nadu",
  "IN-TG": "Telangana",
  "IN-TR": "Tripura",
  "IN-UP": "Uttar Pradesh",
  "IN-UK": "Uttarakhand",
  "IN-WB": "West Bengal",
  UNKNOWN: "Not recorded / unrecognized",
};
export const scanStamp = (v: string) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(v));
