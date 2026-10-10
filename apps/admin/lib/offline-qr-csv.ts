const headers =
  "serial,vehicle_id,qr_url,status,vehicle_number,owner_name,phone,tagged_date";

export function parseOfflineQrCsv(csv: string) {
  const lines = csv
    .replace(/^\uFEFF/, "")
    .trim()
    .split(/\r?\n/);
  if (lines[0] !== headers || lines.length < 2 || lines.length > 5001)
    throw new Error(
      "Choose the offline batch CSV with its original column headings (up to 5,000 rows).",
    );
  const ids = new Set<string>(),
    serials = new Set<string>();
  let reference = "";
  const rows = lines.slice(1).map((line, index) => {
    const values = line.split(",");
    const [serial, id, url, status, ...owner] = values;
    const match = /^(B\d{3})-\d{4}$/.exec(serial || "");
    if (
      values.length !== 8 ||
      !match ||
      !/^VS-[A-Z0-9]{8}$/.test(id || "") ||
      url !== `https://www.vaahansafe.com/v/${id}` ||
      status !== "unassigned" ||
      owner.some(Boolean)
    )
      throw new Error(
        `Row ${index + 2} must contain an unassigned offline ID with no owner or vehicle details.`,
      );
    reference ||= match[1]!;
    if (reference !== match[1] || ids.has(id!) || serials.has(serial!))
      throw new Error(
        `Row ${index + 2} contains a duplicate ID or a different batch reference.`,
      );
    ids.add(id!);
    serials.add(serial!);
    return { serial: serial!, publicId: id!.slice(3) };
  });
  return { reference, rows };
}
