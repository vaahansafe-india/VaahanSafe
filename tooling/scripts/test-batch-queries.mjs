import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig("apps/customer", true);

const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

async function query(sql) {
  const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ p_sql: sql }),
  });
  return res.json();
}

async function main() {
  const summary = await query(`
    SELECT
      count(*)::int AS total_batches,
      coalesce(sum(quantity), 0)::bigint AS total_identities,
      count(*) FILTER (WHERE status = 'DRAFT')::int AS drafts,
      count(*) FILTER (WHERE status = 'GENERATING')::int AS generating,
      count(*) FILTER (WHERE status = 'PRINT_READY')::int AS print_ready,
      count(*) FILTER (WHERE status = 'PRINTED')::int AS printed,
      count(*) FILTER (WHERE status IN ('FAILED', 'QUARANTINED', 'VOIDED'))::int AS attention
    FROM qr_batches
  `);
  console.log("Summary:", summary);

  const batches = await query(`
    SELECT
      b.id,
      b.reference_code AS reference,
      b.inventory_channel AS channel,
      b.quantity,
      b.status,
      b.manufacturer_name AS "manufacturerName",
      b.created_at AS "createdAt",
      b.generated_at AS "generatedAt",
      b.printed_at AS "printedAt",
      b.updated_at AS "updatedAt",
      b.created_by AS "createdBy",
      u.email AS "creatorEmail",
      coalesce(s.gen_count, 0)::int AS "generatedCount",
      coalesce(s.val_count, 0)::int AS "validatedCount",
      coalesce(s.print_count, 0)::int AS "printedCount"
    FROM qr_batches b
    LEFT JOIN admin_users u ON u.id = b.created_by
    LEFT JOIN LATERAL (
      SELECT
        count(*)::int AS gen_count,
        count(activation_secret_hash)::int AS val_count,
        count(*) FILTER (WHERE status = 'PRINTED')::int AS print_count
      FROM qr_stickers qs
      WHERE qs.batch_id = b.id
    ) s ON true
    ORDER BY b.created_at DESC, b.id DESC
    LIMIT 25
  `);
  console.log("Batches:", batches);
}

main().catch(console.error);
