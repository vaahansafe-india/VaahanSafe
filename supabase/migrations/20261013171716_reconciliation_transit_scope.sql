-- Dispatched units remain accountable in Transfers, not a source physical count.
BEGIN;
CREATE OR REPLACE FUNCTION public.reconciliation_stock(p_partner text,p_batches text[] DEFAULT '{}') RETURNS SETOF public.qr_stickers LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT q.* FROM public.qr_stickers q WHERE q.user_id IS NULL AND q.vehicle_id IS NULL AND q.activated_at IS NULL
 AND (cardinality(p_batches)=0 OR q.batch_id=ANY(p_batches))
 AND NOT EXISTS(SELECT 1 FROM public.admin_stock_transfer_items i JOIN public.admin_stock_transfers t ON t.id=i.transfer_id WHERE i.qr_id=q.id AND i.released_at IS NULL AND t.status IN ('IN_TRANSIT','PARTIALLY_RECEIVED','DISCREPANCY'))
 AND ((p_partner IS NULL AND q.current_distributor_id IS NULL AND q.current_retailer_id IS NULL AND q.status='PRINTED' AND public.retail_stock_ready(q.id))
 OR (q.current_retailer_id=p_partner AND q.status='WITH_RETAILER')
 OR (q.current_distributor_id=p_partner AND q.current_retailer_id IS NULL AND q.status='WITH_DISTRIBUTOR'));
$$;
REVOKE ALL ON FUNCTION public.reconciliation_stock(text,text[]) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reconciliation_stock(text,text[]) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
