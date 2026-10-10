import {adminService,executeAdminSql} from './admin-service.mjs';
const [doc]=await executeAdminSql("SELECT d.id,d.owner_user_id,d.current_version FROM customer_documents d WHERE d.status='READY' AND d.deleted_at IS NULL AND EXISTS(SELECT 1 FROM customer_storage_originals o WHERE o.document_id=d.id) LIMIT 1");if(!doc)throw Error('A finalized real document is needed');
const literal=v=>`'${String(v).replaceAll("'","''")}'`;
const client=adminService();
const scenarios=[
 ['retained bytes and deferred final state',`UPDATE customer_document_versions SET file_size_bytes=file_size_bytes+17 WHERE document_id=${literal(doc.id)} AND version_number=${doc.current_version}; UPDATE customer_documents SET expires_at=current_date+15 WHERE id=${literal(doc.id)};`],
 ['unfinished current version exclusion',`UPDATE customer_document_versions SET status='PENDING_UPLOAD' WHERE document_id=${literal(doc.id)} AND version_number=${doc.current_version};`],
 ['deleted document exclusion',`UPDATE customer_documents SET deleted_at=clock_timestamp() WHERE id=${literal(doc.id)};`],
];
for(const [label,mutation] of scenarios){const {error,data}=await client.rpc('exec_sql',{p_sql:`DO $snapshot_check$ DECLARE before_count integer; expected_bytes bigint; snapshot uuid; BEGIN
 SELECT count(*) INTO before_count FROM customer_storage_snapshots WHERE owner_user_id=${literal(doc.owner_user_id)}::uuid;
 ${mutation}
 IF (SELECT count(*) FROM customer_storage_snapshots WHERE owner_user_id=${literal(doc.owner_user_id)}::uuid)<>before_count THEN RAISE EXCEPTION 'Premature snapshot'; END IF;
 SELECT coalesce(sum(file_size_bytes),0) INTO expected_bytes FROM customer_storage_originals WHERE owner_user_id=${literal(doc.owner_user_id)}::uuid;
 SET CONSTRAINTS customer_documents_storage_snapshot,customer_versions_storage_snapshot,customer_vehicle_storage_snapshot IMMEDIATE;
 IF (SELECT count(*) FROM customer_storage_snapshots WHERE owner_user_id=${literal(doc.owner_user_id)}::uuid)<>before_count+1 THEN RAISE EXCEPTION 'Duplicate or missing snapshot'; END IF;
 SELECT id INTO snapshot FROM customer_storage_snapshots WHERE owner_user_id=${literal(doc.owner_user_id)}::uuid AND transaction_key=pg_current_xact_id()::text;
 IF (SELECT coalesce(sum(bytes),0) FROM customer_storage_snapshot_items WHERE snapshot_id=snapshot)<>expected_bytes THEN RAISE EXCEPTION 'Snapshot is not final transaction state'; END IF;
 PERFORM record_customer_storage_snapshot(${literal(doc.owner_user_id)}::uuid);
 IF (SELECT count(*) FROM customer_storage_snapshots WHERE owner_user_id=${literal(doc.owner_user_id)}::uuid)<>before_count+1 THEN RAISE EXCEPTION 'Snapshot replay not idempotent'; END IF;
 RAISE EXCEPTION 'SNAPSHOT_VERIFIED_ROLLBACK'; END $snapshot_check$;`});const message=error?.message||data?.error?.message||data?.error||'';if(message!=='SNAPSHOT_VERIFIED_ROLLBACK')throw Error(`${label}: ${message||'Verification failed'}`);console.log(`${label}: final-state snapshot, transaction deduplication and replay checked; changes rolled back.`);}
