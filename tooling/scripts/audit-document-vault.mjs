import { executeAdminSql } from "./admin-service.mjs";
console.log(
  "columns",
  JSON.stringify(
    await executeAdminSql(
      "SELECT table_name,column_name,data_type FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('users','vehicles','sessions','auth_identities','media_assets') ORDER BY table_name,ordinal_position",
    ),
  ),
);
console.log(
  "existing vault",
  JSON.stringify(
    await executeAdminSql(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND (table_name LIKE '%document%' OR table_name LIKE '%vault%')",
    ),
  ),
);
console.log(
  "R2 policy",
  JSON.stringify(
    await executeAdminSql(
      "SELECT proname FROM pg_proc WHERE proname LIKE '%session%' OR proname LIKE '%rate%'",
    ),
  ),
);
