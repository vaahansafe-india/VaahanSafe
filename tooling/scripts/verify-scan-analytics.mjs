import { executeAdminSql, adminService } from "./admin-service.mjs";
import { buildAnalyticsSql } from "../../apps/customer/features/analytics/sql.ts";
const to = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
const f = {
  from: new Date(Date.parse(to) - 29 * 86400000).toISOString().slice(0, 10),
  to,
  vehicle: "",
  qr: "",
  outcome: "",
  category: "",
  device: "",
  region: "",
  event: "",
  grouping: "day",
  compare: true,
  file: "",
  validity: "",
  protection: "",
  documentActivity: "",
  state: "",
  city: "",
  weekday: "",
  hour: "",
};
const [auth] = await executeAdminSql(
  "SELECT s.id,s.user_id FROM sessions s WHERE public.vault_session_owner(s.id) IS NOT NULL AND EXISTS(SELECT 1 FROM qr_assignments a WHERE a.user_id=s.user_id::text AND a.ended_at IS NULL) LIMIT 1",
);
if (!auth)
  throw Error("A verified customer session with an owned QR is needed");
const literal = (v) =>
  typeof v === "boolean" || typeof v === "number"
    ? String(v)
    : `'${String(v).replaceAll("'", "''")}'`;
function format(q) {
  let i = 0;
  return q.sql.replace(/'(?:''|[^'])*'|\?/g, (t) =>
    t === "?" ? literal(q.params[i++]) : t,
  );
}
const sections = [
  "scan-summary",
  "scan-flow",
  "scan-timeline",
  "scan-geography",
  "scan-heatmap",
  "scan-rhythm",
  "scan-top",
  "scan-calendar",
  "scan-recent",
];
const data = {};
const planClient = adminService();
for (const section of sections) {
  const q = buildAnalyticsSql(section, auth.user_id, auth.id, f, "day");
  const [row] = await executeAdminSql(format(q));
  if (!row?.data) throw Error(`Missing ${section}`);
  data[section] = row.data;
  if (
    /"(?:ip_hash|ip_address|token_hash|user_agent|public_id|storage_key|activation_secret_hash)"/.test(
      JSON.stringify(row.data),
    )
  )
    throw Error("Unsafe scan projection");
  const foreign = buildAnalyticsSql(
    section,
    "00000000-0000-4000-8000-000000000000",
    auth.id,
    f,
    "day",
  );
  if ((await executeAdminSql(format(foreign))).length)
    throw Error("Cross-account scan leak");
  const { error: planError, data: planData } = await planClient.rpc(
    "exec_sql",
    {
      p_sql: `DO $scan_plan$ DECLARE plan json; BEGIN EXECUTE 'EXPLAIN (ANALYZE,FORMAT JSON) ${format(q).replaceAll("'", "''")}' INTO plan; IF plan IS NULL THEN RAISE EXCEPTION 'Missing plan'; END IF; RAISE EXCEPTION 'SCAN_PLAN_MS:%',plan->0->>'Execution Time'; END $scan_plan$;`,
    },
  );
  const planMessage =
    planError?.message || planData?.error?.message || planData?.error || "";
  const timing = /SCAN_PLAN_MS:([0-9.]+)/.exec(planMessage)?.[1];
  if (!timing) throw Error("Missing scan execution plan");
  console.log(
    `${section}: real data, account isolation and safe fields verified; ${timing} ms`,
  );
}
const total = data["scan-summary"].total;
if (
  data["scan-summary"].identities < 0 ||
  data["scan-summary"].identities > total
)
  throw Error("Distinct QR identity count is invalid");
if (
  data["scan-summary"].previousIdentities < 0 ||
  data["scan-summary"].previousIdentities > data["scan-summary"].previousTotal
)
  throw Error("Previous distinct QR identity count is invalid");
if (
  data["scan-summary"].partial !==
  data["scan-timeline"].series.reduce((sum, row) => sum + row.partial, 0)
)
  throw Error("Activation-required summary and timeline disagree");
function same(value, name) {
  if (value !== total) throw Error(`${name} does not reconcile`);
}
same(
  data["scan-summary"].successful + data["scan-summary"].unsuccessful,
  "summary",
);
same(
  data["scan-flow"].rows.reduce((s, r) => s + r.count, 0),
  "flow",
);
same(
  data["scan-timeline"].series.reduce(
    (s, r) => s + r.successful + r.partial + r.unsuccessful,
    0,
  ),
  "timeline",
);
same(
  data["scan-geography"].states.reduce((s, r) => s + r.count, 0),
  "geography",
);
same(
  data["scan-heatmap"].cells.reduce((s, r) => s + r.count, 0),
  "heatmap",
);
same(
  data["scan-rhythm"].hours.reduce((s, r) => s + r.count, 0),
  "rhythm",
);
same(
  data["scan-calendar"].days.reduce((s, r) => s + r.count, 0),
  "calendar",
);
if (data["scan-recent"].events.length > 26 || data["scan-top"].qrs.length > 20)
  throw Error("Unbounded projection");
for (const changes of [
  { outcome: "RESOLVED_ACTIVE" },
  { outcome: "NOT_RESOLVED" },
  { state: "IN-AP" },
  { weekday: "0", hour: "0" },
  { city: "x' OR 1=1--" },
]) {
  const variant = { ...f, ...changes };
  const [s] = await executeAdminSql(
    format(
      buildAnalyticsSql("scan-summary", auth.user_id, auth.id, variant, "day"),
    ),
  );
  const [t] = await executeAdminSql(
    format(
      buildAnalyticsSql("scan-timeline", auth.user_id, auth.id, variant, "day"),
    ),
  );
  if (
    s.data.total !==
    t.data.series.reduce(
      (a, r) => a + r.successful + r.partial + r.unsuccessful,
      0,
    )
  )
    throw Error("Filtered totals disagree");
}
const client = adminService();
const q = buildAnalyticsSql("scan-summary", auth.user_id, auth.id, f, "day");
const cal = buildAnalyticsSql("scan-calendar", auth.user_id, auth.id, f, "day");
const checks = `DO $scan_check$ DECLARE qr text; before_count integer; before_identities integer; had_scans boolean; scan_output jsonb; BEGIN
 SELECT q.id INTO qr FROM qr_stickers q JOIN qr_assignments a ON a.qr_id=q.id AND a.ended_at IS NULL JOIN vehicles v ON v.id=a.vehicle_id WHERE a.user_id=${literal(auth.user_id)} AND v.user_id=${literal(auth.user_id)} AND v.deleted_at IS NULL AND v.status<>'DELETED' LIMIT 1;
 SELECT data INTO scan_output FROM (${format(q)}) x; before_count:=(scan_output->>'total')::integer; before_identities:=(scan_output->>'identities')::integer;
 SELECT EXISTS(SELECT 1 FROM qr_scan_events e WHERE e.qr_id=qr AND e.created_at>=(${literal(f.from)}::timestamp AT TIME ZONE 'Asia/Kolkata') AND e.created_at<((${literal(to)}::date+1)::timestamp AT TIME ZONE 'Asia/Kolkata')) INTO had_scans;
 INSERT INTO qr_scan_events(id,qr_id,scan_type,result,state,city,created_at) VALUES('qse_qa_'||gen_random_uuid(),qr,'PUBLIC_RESOLVE','RESOLVED_ACTIVE','Andhra Pradesh','Recorded QA city',(${literal(to)}::timestamp AT TIME ZONE 'Asia/Kolkata')+interval '1 second'),('qse_qa_'||gen_random_uuid(),qr,'PUBLIC_RESOLVE','RESOLVED_INACTIVE','Telangana',NULL,(${literal(to)}::timestamp AT TIME ZONE 'Asia/Kolkata')+interval '12 hours'),('qse_qa_'||gen_random_uuid(),qr,'PUBLIC_RESOLVE','NOT_FOUND',NULL,NULL,(${literal(to)}::timestamp AT TIME ZONE 'Asia/Kolkata')+interval '23 hours');
 SELECT data INTO scan_output FROM (${format(q)}) x;IF (scan_output->>'total')::integer<>before_count+3 THEN RAISE EXCEPTION 'Boundary events did not count exactly once';END IF;
 IF (scan_output->>'identities')::integer<>before_identities+(CASE WHEN had_scans THEN 0 ELSE 1 END) THEN RAISE EXCEPTION 'Repeated scans inflated QR identity count'; END IF;
 SELECT data INTO scan_output FROM (${format(cal)}) x;IF (SELECT sum((r->>'count')::integer) FROM jsonb_array_elements(scan_output->'days') r)<>before_count+3 THEN RAISE EXCEPTION 'Calendar boundary disagreement';END IF;
 RAISE EXCEPTION 'SCAN_VERIFIED_ROLLBACK'; END $scan_check$;`;
const { error, data: rollback } = await client.rpc("exec_sql", {
  p_sql: checks,
});
const message =
  error?.message || rollback?.error?.message || rollback?.error || "";
if (message !== "SCAN_VERIFIED_ROLLBACK")
  throw Error(message || "Rollback verification failed");
console.log(
  "All scan totals reconcile; state, city, outcome and time filters, missing geography and India midnight verified. Test events rolled back.",
);
