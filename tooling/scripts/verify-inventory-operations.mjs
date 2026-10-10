process.loadEnvFile("apps/admin/.env.local");
const base = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.SUPABASE_SERVICE_ROLE_KEY;
async function sql(query) {
  const r = await fetch(`${base}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_sql: query }),
  });
  const body = await r.json();
  if (!r.ok)
    throw new Error(`Database check failed: ${body.code}: ${body.message}`);
  return body;
}
if (process.argv.includes("--schema")) {
  console.log(
    JSON.stringify(
      await sql(
        "SELECT c.relname,pg_get_constraintdef(con.oid) AS definition FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid WHERE c.relname IN ('qr_status_history','admin_audit_logs','qr_batches') ORDER BY c.relname",
      ),
      null,
      2,
    ),
  );
} else {
  const sessions = await sql(
    "SELECT s.id FROM admin_sessions s JOIN admin_users a ON a.id=s.admin_id WHERE s.revoked_at IS NULL AND s.expires_at>now() AND s.created_at>now()-interval '4 hours' AND s.email_verified_at IS NOT NULL AND a.status='ACTIVE' AND a.role IN ('SUPER_ADMIN','OPS_ADMIN','READ_ONLY_ANALYST') ORDER BY s.created_at DESC LIMIT 1",
  );
  if (!sessions?.length)
    throw new Error(
      "Sign in to the admin before running the authenticated inventory checks.",
    );
  const sid = sessions[0].id,
    filters = JSON.stringify({
      q: "",
      statuses: [],
      lifecycles: [],
      sort: "newest",
    });
  const all = await sql(
    `SELECT public.admin_inventory_facets('${sid}','${filters}'::jsonb) AS facets, public.admin_inventory_list('${sid}','${filters}'::jsonb,NULL) AS rows`,
  );
  const first = all[0],
    rows = first.rows,
    last = rows[49];
  const next = await sql(
    `SELECT public.admin_inventory_list('${sid}','${filters}'::jsonb,'${JSON.stringify({ createdAt: last.createdAt, id: last.id })}'::jsonb) AS rows`,
  );
  const ids = new Set(rows.slice(0, 50).map((r) => r.id));
  if (next[0].rows.some((r) => ids.has(r.id)))
    throw new Error("Cursor pagination duplicated an identity");
  const safe = JSON.stringify([first, next]);
  if (/activation_secret|secret_hash|activationCode|ciphertext/.test(safe))
    throw new Error("Inventory projection contains private print material");
  const access = await sql(
    "SELECT relname,relrowsecurity AS rls,has_table_privilege('anon',c.oid,'SELECT') AS anon_read,has_table_privilege('authenticated',c.oid,'SELECT') AS customer_read FROM pg_class c WHERE relname IN ('qr_print_templates','qr_print_jobs','qr_print_items','admin_inventory_selections')",
  );
  if (access.some((t) => !t.rls || t.anon_read || t.customer_read))
    throw new Error("Private print storage has public/customer access");
  const template = await sql(
    "SELECT version,specification FROM qr_print_templates WHERE active",
  );
  const contexts = await sql(
    "SELECT count(*) FILTER(WHERE public.inventory_printable_qr(id))::integer AS printable,count(*) FILTER(WHERE status='ACTIVATED' AND public.inventory_printable_qr(id))::integer AS activated_printable FROM qr_stickers",
  );
  if (contexts[0].activated_printable !== 0)
    throw new Error("Activated identity is printable");
  let denied = false;
  try {
    await sql(
      `SELECT public.admin_inventory_create_print_job(NULL,'{"mode":"ids","ids":["${rows[0].id}"]}'::jsonb,'PRINT','Unauthorized security check',gen_random_uuid())`,
    );
  } catch (e) {
    denied = /ADMIN_REQUIRED/.test(e.message);
  }
  if (!denied) throw new Error("Missing session did not deny print creation");
  const filtered = await sql(
    `SELECT public.admin_inventory_facets('${sid}','{"q":"VS-BF42","statuses":["INVENTORY"],"channel":"OFFLINE_RETAIL","print":"unrecorded","activation":"inactive","from":"2026-10-09","to":"2026-10-09"}'::jsonb) AS facets`,
  );
  if (filtered[0].facets.total !== 1)
    throw new Error(
      "Combined prefix/date/channel/print filters returned an unexpected count",
    );
  let plan;
  try {
    // The controlled exception returns a read-only EXPLAIN result through the existing SQL RPC.
    // It creates no temporary tables/functions and changes no production records.
    await sql(
      "DO $audit$ DECLARE p jsonb; BEGIN EXECUTE 'EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) SELECT id,created_at FROM qr_stickers WHERE (created_at,id)<(now(),''zzzz'') ORDER BY created_at DESC,id DESC LIMIT 51' INTO p; RAISE EXCEPTION 'INVENTORY_PLAN:%',p::text; END $audit$",
    );
  } catch (e) {
    const match = e.message.match(/INVENTORY_PLAN:(\[.*\])/s);
    if (!match) throw e;
    plan = JSON.parse(match[1]);
  }
  console.log(
    JSON.stringify(
      {
        total: first.facets.total,
        available: first.facets.available,
        firstPage: 50,
        secondPage: next[0].rows.slice(0, 50).length,
        noDuplicates: true,
        safeProjection: true,
        privateTables: access,
        template: template[0],
        contexts: contexts[0],
        unauthorizedPrintDenied: denied,
        combinedFiltersVerified: true,
        queryPlan: {
          scan: plan[0].Plan.Plans[0]["Node Type"],
          index: plan[0].Plan.Plans[0]["Index Name"],
          rows: plan[0].Plan["Actual Rows"],
          executionMs: plan[0]["Execution Time"],
          heapFetches: plan[0].Plan.Plans[0]["Heap Fetches"],
        },
      },
      null,
      2,
    ),
  );
}
