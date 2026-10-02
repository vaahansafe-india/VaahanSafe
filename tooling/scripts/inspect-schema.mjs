const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zpjwrptrqgpeyvlvscpv.supabase.co"}/rest/v1/rpc/exec_sql`;

async function inspect() {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`
    },
    body: JSON.stringify({
      p_sql: `SELECT table_name, column_name, data_type, udt_name 
              FROM information_schema.columns 
              WHERE table_schema = 'public' 
              ORDER BY table_name, ordinal_position`
    })
  });
  const data = await res.json();
  if (!Array.isArray(data)) {
    console.error("Error inspecting schema:", data);
    return;
  }
  const byTable = {};
  for (const col of data) {
    if (!byTable[col.table_name]) byTable[col.table_name] = [];
    byTable[col.table_name].push(`${col.column_name} (${col.data_type} / ${col.udt_name})`);
  }
  for (const [table, cols] of Object.entries(byTable)) {
    console.log(`\nTABLE: ${table}`);
    cols.forEach(c => console.log(`  - ${c}`));
  }
}

inspect().catch(console.error);
