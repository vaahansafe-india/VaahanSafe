import type { Filters, Section } from "./types";
export interface AnalyticsSql {
  sql: string;
  params: unknown[];
}
// Every source is scoped before aggregation. EXISTS avoids multiplying events
// when an identity has more than one assignment record. One persisted event ID
// is one scan, matching the existing resolver/history source (no guessed dedup).
export function buildAnalyticsSql(
  section: Section | "storage-export" | "scan-export",
  owner: string,
  session: string,
  f: Filters,
  bucket: string,
  cursor?: { timestamp: string; id: string },
): AnalyticsSql {
  const days =
    Math.round((Date.parse(f.to) - Date.parse(f.from)) / 86400000) + 1;
  const previous = new Date(Date.parse(f.from) - days * 86400000)
    .toISOString()
    .slice(0, 10);
  const params: unknown[] = [
    owner,
    session,
    f.from,
    f.to,
    previous,
    bucket,
    f.vehicle,
    f.qr,
    f.outcome,
    f.category,
    f.device,
    f.region,
    f.event,
    f.compare,
    f.file || "",
    f.validity || "",
    f.protection || "",
    f.documentActivity || "",
    f.state || "",
    f.city || "",
    f.weekday || "",
    f.hour || "",
  ];
  const base = `WITH p AS (
    SELECT ?::text AS owner,?::uuid AS session,?::date AS first,?::date AS last,?::date AS previous,?::text AS bucket,
    ?::text AS vehicle,?::text AS qr,?::text AS outcome,?::text AS category,?::text AS device,?::text AS region,?::text AS event,?::boolean AS compare,
    ?::text AS mime,?::text AS validity,?::text AS protection,?::text AS document_activity,
    ?::text AS state,?::text AS city,?::text AS weekday,?::text AS hour
  ), auth AS (
    SELECT p.owner FROM p JOIN sessions s ON s.id=p.session AND s.user_id::text=p.owner
    JOIN users u ON u.id=s.user_id WHERE s.revoked_at IS NULL AND s.expires_at>now() AND u.status='ACTIVE' AND u.deleted_at IS NULL
    AND EXISTS(SELECT 1 FROM auth_identities i WHERE i.user_id=u.id AND i.provider='PHONE' AND i.provider_user_id=u.phone AND i.verified_at IS NOT NULL)
  ), owned_vehicles AS (
    SELECT v.id,left(v.registration_number,2)||'••••'||right(v.registration_number,4) AS label,v.make||' '||v.model AS name
    FROM vehicles v JOIN auth ON auth.owner=v.user_id WHERE v.deleted_at IS NULL AND v.status<>'DELETED'
  ), all_qrs AS (
    SELECT DISTINCT ON (q.id) q.id,a.vehicle_id,coalesce(q.visible_code,'QR identity') AS label,q.activated_at
    FROM qr_stickers q JOIN qr_assignments a ON a.qr_id=q.id AND a.ended_at IS NULL
    JOIN auth ON auth.owner=a.user_id JOIN owned_vehicles v ON v.id=a.vehicle_id
    ORDER BY q.id,a.assigned_at DESC,a.id DESC
  ), qrs AS (
    SELECT q.id,q.vehicle_id,q.label,q.activated_at FROM all_qrs q CROSS JOIN p
    WHERE (p.vehicle='' OR q.vehicle_id=p.vehicle) AND (p.qr='' OR q.id=p.qr)
  ), scan_source AS (
    SELECT e.id,e.qr_id,q.vehicle_id,e.created_at,e.result,coalesce(nullif(e.state,''),nullif(e.region,''),'Not recorded') AS region,
    nullif(e.city,'') AS city,e.user_agent_family AS device,e.referrer_class AS referrer,
    CASE WHEN coalesce(nullif(upper(e.country),''),'IN') NOT IN ('IN','INDIA') THEN 'UNKNOWN' ELSE CASE regexp_replace(lower(coalesce(nullif(e.state,''),e.region,'')),'[^a-z]','','g')
      WHEN 'andhrapradesh' THEN 'IN-AP' WHEN 'ap' THEN 'IN-AP' WHEN 'telangana' THEN 'IN-TG' WHEN 'telengana' THEN 'IN-TG' WHEN 'tg' THEN 'IN-TG' WHEN 'ts' THEN 'IN-TG'
      WHEN 'tamilnadu' THEN 'IN-TN' WHEN 'tn' THEN 'IN-TN' WHEN 'karnataka' THEN 'IN-KA' WHEN 'ka' THEN 'IN-KA'
      WHEN 'maharashtra' THEN 'IN-MH' WHEN 'mh' THEN 'IN-MH' WHEN 'kerala' THEN 'IN-KL' WHEN 'kl' THEN 'IN-KL'
      WHEN 'andamannicobarislands' THEN 'IN-AN' WHEN 'andamanandnicobarislands' THEN 'IN-AN' WHEN 'andamannicobarisland' THEN 'IN-AN'
      WHEN 'arunachalpradesh' THEN 'IN-AR' WHEN 'arunanchalpradesh' THEN 'IN-AR' WHEN 'assam' THEN 'IN-AS' WHEN 'bihar' THEN 'IN-BR'
      WHEN 'chandigarh' THEN 'IN-CH' WHEN 'chhattisgarh' THEN 'IN-CG' WHEN 'chattisgarh' THEN 'IN-CG'
      WHEN 'dadraandnagarhavelianddamananddiu' THEN 'IN-DH' WHEN 'dadranagarhaveli' THEN 'IN-DH' WHEN 'dadraandnagarhaveli' THEN 'IN-DH' WHEN 'damandiu' THEN 'IN-DH' WHEN 'damananddiu' THEN 'IN-DH'
      WHEN 'delhi' THEN 'IN-DL' WHEN 'nctofdelhi' THEN 'IN-DL' WHEN 'goa' THEN 'IN-GA' WHEN 'gujarat' THEN 'IN-GJ' WHEN 'haryana' THEN 'IN-HR'
      WHEN 'himachalpradesh' THEN 'IN-HP' WHEN 'jammuandkashmir' THEN 'IN-JK' WHEN 'jammukashmir' THEN 'IN-JK' WHEN 'ladakh' THEN 'IN-LA'
      WHEN 'jharkhand' THEN 'IN-JH' WHEN 'lakshadweep' THEN 'IN-LD' WHEN 'madhyapradesh' THEN 'IN-MP' WHEN 'manipur' THEN 'IN-MN'
      WHEN 'meghalaya' THEN 'IN-ML' WHEN 'mizoram' THEN 'IN-MZ' WHEN 'nagaland' THEN 'IN-NL' WHEN 'odisha' THEN 'IN-OD' WHEN 'orissa' THEN 'IN-OD'
      WHEN 'puducherry' THEN 'IN-PY' WHEN 'pondicherry' THEN 'IN-PY' WHEN 'punjab' THEN 'IN-PB' WHEN 'rajasthan' THEN 'IN-RJ'
      WHEN 'sikkim' THEN 'IN-SK' WHEN 'tripura' THEN 'IN-TR' WHEN 'uttarpradesh' THEN 'IN-UP' WHEN 'uttarakhand' THEN 'IN-UK' WHEN 'uttaranchal' THEN 'IN-UK' WHEN 'westbengal' THEN 'IN-WB'
      ELSE 'UNKNOWN' END END AS state_code
    FROM qr_scan_events e JOIN qrs q ON q.id=e.qr_id
  ), scans AS (
    SELECT e.id,e.qr_id,e.vehicle_id,e.created_at,e.result,e.region,e.city,e.device,e.referrer,e.state_code FROM scan_source e CROSS JOIN p
    WHERE e.created_at >= (CASE WHEN p.compare THEN p.previous ELSE p.first END::timestamp AT TIME ZONE 'Asia/Kolkata')
    AND e.created_at < ((p.last+1)::timestamp AT TIME ZONE 'Asia/Kolkata')
    AND (p.outcome='' OR e.result=p.outcome OR (p.outcome='NON_ACTIVE' AND e.result IS DISTINCT FROM 'RESOLVED_ACTIVE') OR (p.outcome='NOT_RESOLVED' AND e.result IS DISTINCT FROM 'RESOLVED_ACTIVE' AND e.result IS DISTINCT FROM 'RESOLVED_INACTIVE')) AND (p.region='' OR e.region=p.region)
    AND (p.state='' OR e.state_code=p.state) AND (p.city='' OR e.city=p.city)
    AND (p.weekday='' OR extract(isodow FROM e.created_at AT TIME ZONE 'Asia/Kolkata')::integer-1=nullif(p.weekday,'')::integer)
    AND (p.hour='' OR extract(hour FROM e.created_at AT TIME ZONE 'Asia/Kolkata')::integer=nullif(p.hour,'')::integer)
  ), selected_scans AS (
    SELECT e.id,e.qr_id,e.vehicle_id,e.created_at,e.result,e.region,e.city,e.device,e.referrer,e.state_code FROM scans e CROSS JOIN p
    WHERE e.created_at >= (p.first::timestamp AT TIME ZONE 'Asia/Kolkata')
  ), docs AS (
    SELECT d.id,d.title,d.vehicle_id,d.category,d.expires_at,d.created_at,d.current_version,d.status
    FROM customer_documents d JOIN auth ON d.owner_user_id::text=auth.owner CROSS JOIN p
    WHERE d.status='READY' AND d.deleted_at IS NULL AND (d.vehicle_id IS NULL OR EXISTS(SELECT 1 FROM owned_vehicles v WHERE v.id=d.vehicle_id))
    AND EXISTS(SELECT 1 FROM customer_document_versions r WHERE r.document_id=d.id AND r.version_number=d.current_version AND r.status='READY')
    AND (p.vehicle='' OR d.vehicle_id=p.vehicle) AND (p.category='' OR d.category=p.category)
    AND (p.protection='' OR d.security_mode=p.protection)
    AND (p.mime='' OR EXISTS(SELECT 1 FROM public.customer_storage_originals o WHERE o.document_id=d.id AND (o.mime_type=p.mime OR (p.mime='image/*' AND o.mime_type LIKE 'image/%'))))
    AND (p.validity='' OR (p.validity='NONE' AND d.expires_at IS NULL)
      OR (p.validity='EXPIRED' AND d.expires_at<(now() AT TIME ZONE 'Asia/Kolkata')::date)
      OR (p.validity='EXPIRING' AND d.expires_at BETWEEN (now() AT TIME ZONE 'Asia/Kolkata')::date AND (now() AT TIME ZONE 'Asia/Kolkata')::date+30)
      OR (p.validity='CURRENT' AND (d.expires_at IS NULL OR d.expires_at>(now() AT TIME ZONE 'Asia/Kolkata')::date+30)))
  ), doc_originals AS (
    SELECT o.document_id,o.version_id,o.version_number,o.mime_type,o.file_size_bytes,o.version_created_at AS created_at,o.is_current
    FROM public.customer_storage_originals o JOIN docs d ON d.id=o.document_id CROSS JOIN p WHERE p.mime='' OR (o.mime_type=p.mime OR (p.mime='image/*' AND o.mime_type LIKE 'image/%'))
  ), event_docs AS (
    SELECT d.id,d.title,d.vehicle_id FROM customer_documents d JOIN auth ON d.owner_user_id::text=auth.owner CROSS JOIN p
    WHERE (d.vehicle_id IS NULL OR EXISTS(SELECT 1 FROM owned_vehicles v WHERE v.id=d.vehicle_id))
      AND (p.vehicle='' OR d.vehicle_id=p.vehicle) AND (p.category='' OR d.category=p.category) AND (p.protection='' OR d.security_mode=p.protection)
      AND (p.mime='' OR EXISTS(SELECT 1 FROM customer_document_versions r WHERE r.document_id=d.id AND (r.mime_type=p.mime OR (p.mime='image/*' AND r.mime_type LIKE 'image/%'))))
      AND (p.validity='' OR (p.validity='NONE' AND d.expires_at IS NULL)
        OR (p.validity='EXPIRED' AND d.expires_at<(now() AT TIME ZONE 'Asia/Kolkata')::date)
        OR (p.validity='EXPIRING' AND d.expires_at BETWEEN (now() AT TIME ZONE 'Asia/Kolkata')::date AND (now() AT TIME ZONE 'Asia/Kolkata')::date+30)
        OR (p.validity='CURRENT' AND (d.expires_at IS NULL OR d.expires_at>(now() AT TIME ZONE 'Asia/Kolkata')::date+30)))
  ), doc_events AS (
    SELECT e.id,e.event_type,e.created_at,d.vehicle_id,d.title,d.id AS document_id FROM customer_document_events e JOIN event_docs d ON d.id=e.document_id CROSS JOIN p
    WHERE e.created_at >= (p.first::timestamp AT TIME ZONE 'Asia/Kolkata') AND e.created_at < ((p.last+1)::timestamp AT TIME ZONE 'Asia/Kolkata')
    AND (p.document_activity='' OR lower(e.event_type)=CASE p.document_activity WHEN 'UPLOAD' THEN 'uploaded' WHEN 'REPLACE' THEN 'replaced' WHEN 'PREVIEW' THEN 'previewed' WHEN 'DOWNLOAD' THEN 'downloaded' WHEN 'SHARE' THEN 'secure link created' WHEN 'DELETE' THEN 'deleted' END)
  ), ticks AS (
    SELECT generate_series(date_trunc(p.bucket,p.first::timestamp),date_trunc(p.bucket,p.last::timestamp+interval '23 hours'),('1 '||p.bucket)::interval) AS tick FROM p
  )`;
  const arr = (sql: string) => `coalesce((${sql}),'[]'::jsonb)`;
  const series = (source: string, value: string, extra = "") =>
    arr(
      `SELECT jsonb_agg(jsonb_build_object('timestamp',to_char(t.tick,'YYYY-MM-DD"T"HH24:MI:SS')||'+05:30','value',coalesce(a.value,0)${extra}) ORDER BY t.tick) FROM ticks t LEFT JOIN (${source}) a ON a.tick=t.tick`,
    );
  let select: string;
  switch (section) {
    case "scan-summary":
    case "scan-timeline": {
      const timeline =
        arr(`SELECT jsonb_agg(jsonb_build_object('timestamp',to_char(t.tick,'YYYY-MM-DD"T"HH24:MI:SS')||'+05:30','successful',coalesce(a.successful,0),'partial',coalesce(a.partial,0),'unsuccessful',coalesce(a.unsuccessful,0)) ORDER BY t.tick) FROM ticks t LEFT JOIN (
        SELECT date_trunc(p.bucket,e.created_at AT TIME ZONE 'Asia/Kolkata') AS tick,count(*) FILTER(WHERE e.result='RESOLVED_ACTIVE')::integer AS successful,count(*) FILTER(WHERE e.result='RESOLVED_INACTIVE')::integer AS partial,count(*) FILTER(WHERE e.result IS DISTINCT FROM 'RESOLVED_ACTIVE' AND e.result IS DISTINCT FROM 'RESOLVED_INACTIVE')::integer AS unsuccessful FROM selected_scans e CROSS JOIN p GROUP BY 1
      ) a ON a.tick=t.tick`);
      select =
        section === "scan-timeline"
          ? `jsonb_build_object('series',${timeline})`
          : `jsonb_build_object('total',(SELECT count(*) FROM selected_scans),'identities',(SELECT count(DISTINCT qr_id) FROM selected_scans),
        'previousIdentities',(SELECT count(DISTINCT e.qr_id) FROM scans e CROSS JOIN p WHERE e.created_at<(p.first::timestamp AT TIME ZONE 'Asia/Kolkata')),
        'successful',(SELECT count(*) FROM selected_scans WHERE result='RESOLVED_ACTIVE'),'partial',(SELECT count(*) FROM selected_scans WHERE result='RESOLVED_INACTIVE'),'unsuccessful',(SELECT count(*) FROM selected_scans WHERE result IS DISTINCT FROM 'RESOLVED_ACTIVE'),
        'previousTotal',(SELECT count(*) FROM scans e CROSS JOIN p WHERE e.created_at<(p.first::timestamp AT TIME ZONE 'Asia/Kolkata')),
        'previousSuccessful',(SELECT count(*) FROM scans e CROSS JOIN p WHERE e.created_at<(p.first::timestamp AT TIME ZONE 'Asia/Kolkata') AND result='RESOLVED_ACTIVE'),
        'previousPartial',(SELECT count(*) FROM scans e CROSS JOIN p WHERE e.created_at<(p.first::timestamp AT TIME ZONE 'Asia/Kolkata') AND result='RESOLVED_INACTIVE'),
        'previousUnsuccessful',(SELECT count(*) FROM scans e CROSS JOIN p WHERE e.created_at<(p.first::timestamp AT TIME ZONE 'Asia/Kolkata') AND result IS DISTINCT FROM 'RESOLVED_ACTIVE'),'series',${timeline})`;
      break;
    }
    case "scan-flow":
      select = `jsonb_build_object('total',(SELECT count(*) FROM selected_scans),'rows',${arr(`SELECT jsonb_agg(jsonb_build_object('vehicle',vehicle,'vehicleLabel',vehicle_label,'name',name,'qr',qr,'qrLabel',qr_label,'outcome',outcome,'count',n) ORDER BY n DESC,qr,outcome) FROM (
        SELECT CASE WHEN e.qr_id IN (SELECT qr_id FROM selected_scans GROUP BY qr_id ORDER BY count(*) DESC,qr_id LIMIT 12) THEN v.id ELSE '' END AS vehicle,
          CASE WHEN e.qr_id IN (SELECT qr_id FROM selected_scans GROUP BY qr_id ORDER BY count(*) DESC,qr_id LIMIT 12) THEN v.label ELSE 'Other vehicles' END AS vehicle_label,
          CASE WHEN e.qr_id IN (SELECT qr_id FROM selected_scans GROUP BY qr_id ORDER BY count(*) DESC,qr_id LIMIT 12) THEN v.name ELSE 'Other vehicles' END AS name,
          CASE WHEN e.qr_id IN (SELECT qr_id FROM selected_scans GROUP BY qr_id ORDER BY count(*) DESC,qr_id LIMIT 12) THEN q.id ELSE '' END AS qr,
          CASE WHEN e.qr_id IN (SELECT qr_id FROM selected_scans GROUP BY qr_id ORDER BY count(*) DESC,qr_id LIMIT 12) THEN q.label ELSE 'Other QR identities' END AS qr_label,
          CASE WHEN e.result='RESOLVED_ACTIVE' THEN 'RESOLVED_ACTIVE' WHEN e.result='RESOLVED_INACTIVE' THEN 'RESOLVED_INACTIVE' ELSE 'OTHER' END AS outcome,count(*)::integer AS n
          FROM selected_scans e JOIN qrs q ON q.id=e.qr_id JOIN owned_vehicles v ON v.id=e.vehicle_id GROUP BY 1,2,3,4,5,6) x`)})`;
      break;
    case "scan-geography":
      select = `jsonb_build_object('total',(SELECT count(*) FROM selected_scans),'located',(SELECT count(*) FROM selected_scans WHERE state_code<>'UNKNOWN'),
      'states',${arr(`SELECT jsonb_agg(jsonb_build_object('code',state_code,'label',region,'count',n,'successful',successful,'topCity',top_city) ORDER BY n DESC,state_code) FROM (
        SELECT e.state_code,min(e.region) AS region,count(*)::integer AS n,count(*) FILTER(WHERE result='RESOLVED_ACTIVE')::integer AS successful,
        (SELECT city FROM selected_scans c WHERE c.state_code=e.state_code AND c.city IS NOT NULL GROUP BY city ORDER BY count(*) DESC,city LIMIT 1) AS top_city FROM selected_scans e GROUP BY state_code) x`)},
      'cities',${arr(`SELECT jsonb_agg(jsonb_build_object('state',state_code,'label',city,'count',n) ORDER BY n DESC,state_code,city) FROM (SELECT state_code,city,count(*)::integer AS n FROM selected_scans WHERE city IS NOT NULL GROUP BY state_code,city ORDER BY n DESC,state_code,city LIMIT 30) x`)})`;
      break;
    case "scan-heatmap":
      select = `jsonb_build_object('cells',${arr(`SELECT jsonb_agg(jsonb_build_object('day',day,'hour',hour,'count',n,'successful',successful) ORDER BY day,hour) FROM (SELECT extract(isodow FROM created_at AT TIME ZONE 'Asia/Kolkata')::integer-1 AS day,extract(hour FROM created_at AT TIME ZONE 'Asia/Kolkata')::integer AS hour,count(*)::integer AS n,count(*) FILTER(WHERE result='RESOLVED_ACTIVE')::integer AS successful FROM selected_scans GROUP BY 1,2) x`)})`;
      break;
    case "scan-rhythm":
      select = `jsonb_build_object('hours',${arr(`SELECT jsonb_agg(jsonb_build_object('hour',h,'count',coalesce(n,0)) ORDER BY h) FROM generate_series(0,23) h LEFT JOIN (SELECT extract(hour FROM created_at AT TIME ZONE 'Asia/Kolkata')::integer AS hour,count(*)::integer AS n FROM selected_scans GROUP BY 1) x ON x.hour=h`)})`;
      break;
    case "scan-top":
      select = `jsonb_build_object('total',(SELECT count(*) FROM selected_scans),'qrs',${arr(`SELECT jsonb_agg(jsonb_build_object('id',id,'label',label,'vehicle',vehicle_id,'vehicleLabel',vehicle_label,'count',n,'successful',successful) ORDER BY n DESC,id) FROM (SELECT q.id,q.label,q.vehicle_id,v.label AS vehicle_label,count(*)::integer AS n,count(*) FILTER(WHERE e.result='RESOLVED_ACTIVE')::integer AS successful FROM selected_scans e JOIN qrs q ON q.id=e.qr_id JOIN owned_vehicles v ON v.id=q.vehicle_id GROUP BY q.id,q.label,q.vehicle_id,v.label ORDER BY n DESC,q.id LIMIT 20) x`)})`;
      break;
    case "scan-calendar":
      select = `jsonb_build_object('days',${arr(`SELECT jsonb_agg(jsonb_build_object('date',to_char(d,'YYYY-MM-DD'),'count',coalesce(n,0),'successful',coalesce(successful,0)) ORDER BY d) FROM p CROSS JOIN generate_series(p.first::timestamp,p.last::timestamp,interval '1 day') d LEFT JOIN (SELECT (created_at AT TIME ZONE 'Asia/Kolkata')::date AS date,count(*)::integer AS n,count(*) FILTER(WHERE result='RESOLVED_ACTIVE')::integer AS successful FROM selected_scans GROUP BY 1) x ON x.date=d::date`)})`;
      break;
    case "scan-export":
    case "scan-recent": {
      const predicate = cursor
        ? "AND (e.created_at,e.id)<(?::timestamptz,?::text)"
        : "";
      if (cursor) params.push(cursor.timestamp, cursor.id);
      select = `jsonb_build_object('events',${arr(`SELECT jsonb_agg(jsonb_build_object('id',id,'timestamp',created_at,'qr',qr_id,'qrLabel',qr_label,'vehicle',vehicle_id,'vehicleLabel',vehicle_label,'vehicleName',vehicle_name,'result',result,'state',region,'city',city,'device',device,'referrer',referrer) ORDER BY created_at DESC,id DESC) FROM (
        SELECT e.id,e.created_at,e.qr_id,q.label AS qr_label,e.vehicle_id,v.label AS vehicle_label,v.name AS vehicle_name,e.result,e.region,e.city,e.device,e.referrer FROM selected_scans e JOIN qrs q ON q.id=e.qr_id JOIN owned_vehicles v ON v.id=e.vehicle_id WHERE true ${predicate} ORDER BY e.created_at DESC,e.id DESC LIMIT ${section === "scan-export" ? 1001 : 26}) x`)})`;
      break;
    }
    case "context":
      select = `jsonb_build_object('vehicles',${arr("SELECT jsonb_agg(jsonb_build_object('id',id,'label',label||' · '||name) ORDER BY label) FROM owned_vehicles")},'qrs',${arr("SELECT jsonb_agg(jsonb_build_object('id',id,'label',label,'vehicle',vehicle_id) ORDER BY label) FROM all_qrs")})`;
      break;
    case "scans": {
      const grouped = `SELECT date_trunc(p.bucket,(e.created_at AT TIME ZONE 'Asia/Kolkata') + CASE WHEN e.created_at<(p.first::timestamp AT TIME ZONE 'Asia/Kolkata') THEN make_interval(days=>${days}) ELSE interval '0 days' END) AS tick,
        count(*) FILTER(WHERE e.created_at>=(p.first::timestamp AT TIME ZONE 'Asia/Kolkata'))::integer AS value,
        count(*) FILTER(WHERE e.created_at>=(p.first::timestamp AT TIME ZONE 'Asia/Kolkata') AND e.result='RESOLVED_ACTIVE')::integer AS successful,
        count(*) FILTER(WHERE e.created_at<(p.first::timestamp AT TIME ZONE 'Asia/Kolkata'))::integer AS previous
        FROM scans e CROSS JOIN p GROUP BY 1`;
      select = `jsonb_build_object('total',(SELECT count(*) FROM selected_scans),'previousTotal',CASE WHEN (SELECT compare FROM p) THEN (SELECT count(*) FROM scans e CROSS JOIN p WHERE e.created_at<(p.first::timestamp AT TIME ZONE 'Asia/Kolkata')) END,
      'successful',(SELECT count(*) FROM selected_scans WHERE result='RESOLVED_ACTIVE'),
      'series',${series(grouped, "count", " ,'successful',coalesce(a.successful,0),'previous',CASE WHEN (SELECT compare FROM p) THEN coalesce(a.previous,0) END")},
      'rhythm',${arr("SELECT jsonb_agg(jsonb_build_object('day',day,'hour',hour,'count',n)) FROM (SELECT extract(isodow FROM created_at AT TIME ZONE 'Asia/Kolkata')::integer-1 AS day,extract(hour FROM created_at AT TIME ZONE 'Asia/Kolkata')::integer AS hour,count(*)::integer AS n FROM selected_scans GROUP BY 1,2) x")},
      'regions',${arr("SELECT jsonb_agg(jsonb_build_object('label',region,'count',n) ORDER BY n DESC) FROM (SELECT region,count(*)::integer AS n FROM selected_scans GROUP BY region ORDER BY n DESC LIMIT 30) x")},
      'outcomes',${arr("SELECT jsonb_agg(jsonb_build_object('label',coalesce(result,'Not recorded'),'count',n)) FROM (SELECT result,count(*)::integer AS n FROM selected_scans GROUP BY result) x")})`;
      break;
    }
    case "vehicles":
      select = `jsonb_build_object('vehicles',${arr(`SELECT jsonb_agg(jsonb_build_object('id',v.id,'label',v.label,'name',v.name,
      'qr',q.label,'activatedAt',q.activated_at,'scans',coalesce(s.n,0),'lastScan',s.latest,'documents',coalesce(d.n,0),'expiring',coalesce(d.expiring,0),'bytes',coalesce(b.bytes,0)) ORDER BY v.label)
      FROM owned_vehicles v CROSS JOIN p
      LEFT JOIN (SELECT vehicle_id,string_agg(label,' · ' ORDER BY label) AS label,min(activated_at) AS activated_at FROM qrs GROUP BY vehicle_id) q ON q.vehicle_id=v.id
      LEFT JOIN (SELECT vehicle_id,count(*)::integer AS n,max(created_at) AS latest FROM selected_scans GROUP BY vehicle_id) s ON s.vehicle_id=v.id
      LEFT JOIN (SELECT vehicle_id,count(*)::integer AS n,count(*) FILTER(WHERE expires_at BETWEEN (now() AT TIME ZONE 'Asia/Kolkata')::date AND (now() AT TIME ZONE 'Asia/Kolkata')::date+30)::integer AS expiring FROM docs GROUP BY vehicle_id) d ON d.vehicle_id=v.id
      LEFT JOIN (SELECT d.vehicle_id,sum(r.file_size_bytes) AS bytes FROM docs d JOIN doc_originals r ON r.document_id=d.id GROUP BY d.vehicle_id) b ON b.vehicle_id=v.id
      WHERE (p.vehicle='' OR v.id=p.vehicle) AND (p.qr='' OR EXISTS(SELECT 1 FROM qrs WHERE vehicle_id=v.id))`)},
      'ribbon',${arr(`SELECT jsonb_agg(jsonb_build_object('vehicle',vehicle_id,'timestamp',to_char(tick,'YYYY-MM-DD"T"HH24:MI:SS')||'+05:30','scans',scans,'documents',documents,'activations',activations) ORDER BY tick) FROM (
       SELECT vehicle_id,tick,sum(scans)::integer AS scans,sum(documents)::integer AS documents,sum(activations)::integer AS activations FROM (
        SELECT vehicle_id,date_trunc(p.bucket,created_at AT TIME ZONE 'Asia/Kolkata') AS tick,1 AS scans,0 AS documents,0 AS activations FROM selected_scans CROSS JOIN p
        UNION ALL SELECT vehicle_id,date_trunc(p.bucket,created_at AT TIME ZONE 'Asia/Kolkata'),0,1,0 FROM doc_events CROSS JOIN p
        UNION ALL SELECT vehicle_id,date_trunc(p.bucket,activated_at AT TIME ZONE 'Asia/Kolkata'),0,0,1 FROM qrs CROSS JOIN p WHERE activated_at >= (p.first::timestamp AT TIME ZONE 'Asia/Kolkata') AND activated_at<((p.last+1)::timestamp AT TIME ZONE 'Asia/Kolkata')
       ) u WHERE vehicle_id IS NOT NULL GROUP BY vehicle_id,tick ORDER BY tick DESC,vehicle_id LIMIT 400) x`)},
      'subscriptions',${arr("SELECT jsonb_agg(jsonb_build_object('vehicle',s.vehicle_id,'name',coalesce(pl.name,'Plan'),'status',s.status,'tier',s.tier)) FROM subscriptions s JOIN auth ON s.user_id=auth.owner LEFT JOIN plans pl ON pl.id=s.plan_id CROSS JOIN p WHERE (p.vehicle='' OR s.vehicle_id=p.vehicle) AND (s.vehicle_id IS NULL OR EXISTS(SELECT 1 FROM owned_vehicles WHERE id=s.vehicle_id))")})`;
      break;
    case "documents": {
      select = `jsonb_build_object('total',(SELECT count(*) FROM docs),'bytes',(SELECT coalesce(sum(r.file_size_bytes),0) FROM docs d JOIN doc_originals r ON r.document_id=d.id),
      'quotaBytes',(SELECT max_bytes FROM customer_vault_policy WHERE id=true),'reservedBytes',(SELECT coalesce(u.bytes,0) FROM auth LEFT JOIN customer_vault_usage u ON u.owner_user_id::text=auth.owner),
      'composition',${arr("SELECT jsonb_agg(jsonb_build_object('label',label,'bytes',bytes,'count',n)) FROM (SELECT CASE WHEN r.mime_type='application/pdf' THEN 'PDF' ELSE 'Images' END AS label,sum(r.file_size_bytes) AS bytes,count(*)::integer AS n FROM docs d JOIN doc_originals r ON r.document_id=d.id GROUP BY 1 UNION ALL SELECT replace(d.category,'_',' '),sum(r.file_size_bytes),count(*)::integer FROM docs d JOIN doc_originals r ON r.document_id=d.id GROUP BY d.category) x")},
      'byVehicle',${arr("SELECT jsonb_agg(jsonb_build_object('id',vehicle_id,'label',label,'name',name,'documents',documents,'bytes',bytes) ORDER BY bytes DESC) FROM (SELECT d.vehicle_id,coalesce(v.label,'Account documents') AS label,coalesce(v.name,'Account documents') AS name,count(DISTINCT d.id)::integer AS documents,sum(r.file_size_bytes) AS bytes FROM docs d JOIN doc_originals r ON r.document_id=d.id LEFT JOIN owned_vehicles v ON v.id=d.vehicle_id GROUP BY d.vehicle_id,v.label,v.name) x")},
      'expiry',${arr("SELECT jsonb_agg(jsonb_build_object('id',id,'title',title,'date',expires_at) ORDER BY expires_at) FROM (SELECT id,title,expires_at FROM docs WHERE expires_at IS NOT NULL ORDER BY expires_at,id LIMIT 50) x")},
      'activity',${arr("SELECT jsonb_agg(jsonb_build_object('label',event_type,'count',n) ORDER BY n DESC) FROM (SELECT event_type,count(*)::integer AS n FROM doc_events GROUP BY event_type) x")},
      'rhythm',${arr("SELECT jsonb_agg(jsonb_build_object('day',day,'hour',hour,'count',n)) FROM (SELECT extract(isodow FROM created_at AT TIME ZONE 'Asia/Kolkata')::integer-1 AS day,extract(hour FROM created_at AT TIME ZONE 'Asia/Kolkata')::integer AS hour,count(*)::integer AS n FROM doc_events GROUP BY 1,2) x")},
      'statuses',${arr("SELECT jsonb_agg(jsonb_build_object('label',label,'count',n)) FROM (SELECT CASE WHEN expires_at<(now() AT TIME ZONE 'Asia/Kolkata')::date THEN 'Expired' WHEN expires_at<=(now() AT TIME ZONE 'Asia/Kolkata')::date+30 THEN 'Expiring soon' ELSE 'Current' END AS label,count(*)::integer AS n FROM docs GROUP BY 1) x")},
      'allocation',${arr("SELECT jsonb_agg(jsonb_build_object('vehicle',vehicle_id,'category',category,'bytes',bytes,'documents',documents)) FROM (SELECT d.vehicle_id,d.category,sum(r.file_size_bytes) AS bytes,count(DISTINCT d.id)::integer AS documents FROM docs d JOIN doc_originals r ON r.document_id=d.id GROUP BY d.vehicle_id,d.category) x")},
      'versions',jsonb_build_object('currentBytes',(SELECT coalesce(sum(file_size_bytes) FILTER(WHERE is_current),0) FROM doc_originals),'previousBytes',(SELECT coalesce(sum(file_size_bytes) FILTER(WHERE NOT is_current),0) FROM doc_originals),'previousCount',(SELECT count(*) FILTER(WHERE NOT is_current) FROM doc_originals)),
      'expirySummary',jsonb_build_object('week',(SELECT count(*) FROM docs WHERE expires_at BETWEEN (now() AT TIME ZONE 'Asia/Kolkata')::date AND (now() AT TIME ZONE 'Asia/Kolkata')::date+7),'month',(SELECT count(*) FROM docs WHERE expires_at BETWEEN (now() AT TIME ZONE 'Asia/Kolkata')::date AND (now() AT TIME ZONE 'Asia/Kolkata')::date+30),'quarter',(SELECT count(*) FROM docs WHERE expires_at BETWEEN (now() AT TIME ZONE 'Asia/Kolkata')::date AND (now() AT TIME ZONE 'Asia/Kolkata')::date+90),'expired',(SELECT count(*) FROM docs WHERE expires_at<(now() AT TIME ZONE 'Asia/Kolkata')::date)),
      'series',${series("SELECT date_trunc(p.bucket,e.created_at AT TIME ZONE 'Asia/Kolkata') AS tick,count(*)::integer AS value FROM doc_events e CROSS JOIN p GROUP BY 1", "count")})`;
      break;
    }
    case "storage-history": {
      const measured = `SELECT t.tick,s.id,s.recorded_at FROM ticks t CROSS JOIN p LEFT JOIN LATERAL (
        SELECT s.id,s.recorded_at FROM public.customer_storage_snapshots s JOIN auth ON s.owner_user_id::text=auth.owner
        WHERE s.recorded_at<least(((t.tick+('1 '||p.bucket)::interval) AT TIME ZONE 'Asia/Kolkata'),((p.last+1)::timestamp AT TIME ZONE 'Asia/Kolkata'))
        ORDER BY s.recorded_at DESC,s.id DESC LIMIT 1
      ) s ON true`;
      const measurements = `SELECT m.tick,m.recorded_at,CASE WHEN m.id IS NULL THEN NULL ELSE coalesce((
        SELECT jsonb_object_agg(category,bytes) FROM (
          SELECT i.category,sum(i.bytes) AS bytes FROM public.customer_storage_snapshot_items i CROSS JOIN p
          WHERE i.snapshot_id=m.id AND (i.vehicle_id IS NULL OR EXISTS(SELECT 1 FROM owned_vehicles v WHERE v.id=i.vehicle_id))
          AND (p.vehicle='' OR i.vehicle_id=p.vehicle) AND (p.category='' OR i.category=p.category) AND (p.mime='' OR (i.mime_type=p.mime OR (p.mime='image/*' AND i.mime_type LIKE 'image/%'))) AND (p.protection='' OR i.security_mode=p.protection)
          AND (p.validity='' OR (p.validity='NONE' AND i.expires_at IS NULL)
            OR (p.validity='EXPIRED' AND i.expires_at<(now() AT TIME ZONE 'Asia/Kolkata')::date)
            OR (p.validity='EXPIRING' AND i.expires_at BETWEEN (now() AT TIME ZONE 'Asia/Kolkata')::date AND (now() AT TIME ZONE 'Asia/Kolkata')::date+30)
            OR (p.validity='CURRENT' AND (i.expires_at IS NULL OR i.expires_at>(now() AT TIME ZONE 'Asia/Kolkata')::date+30)))
          GROUP BY i.category
        ) x),'{}'::jsonb) END AS components FROM (${measured}) m`;
      select = `jsonb_build_object('startedAt',(SELECT min(s.recorded_at) FROM public.customer_storage_snapshots s JOIN auth ON s.owner_user_id::text=auth.owner),
        'growth',${arr(`SELECT jsonb_agg(jsonb_build_object('timestamp',to_char(tick,'YYYY-MM-DD"T"HH24:MI:SS')||'+05:30','values',components,'asOf',recorded_at) ORDER BY tick) FROM (${measurements}) m`)})`;
      break;
    }
    case "storage-access":
      select = `jsonb_build_object('series',${arr(`SELECT jsonb_agg(jsonb_build_object('timestamp',to_char(t.tick,'YYYY-MM-DD"T"HH24:MI:SS')||'+05:30','previews',coalesce(a.previews,0),'downloads',coalesce(a.downloads,0),'shares',coalesce(a.shares,0)) ORDER BY t.tick)
        FROM ticks t LEFT JOIN (SELECT date_trunc(p.bucket,e.created_at AT TIME ZONE 'Asia/Kolkata') AS tick,
          count(*) FILTER(WHERE lower(e.event_type) IN ('previewed','shared document opened'))::integer AS previews,
          count(*) FILTER(WHERE lower(e.event_type)='downloaded')::integer AS downloads,
          count(*) FILTER(WHERE lower(e.event_type)='secure link created')::integer AS shares
          FROM doc_events e CROSS JOIN p GROUP BY 1) a ON a.tick=t.tick`)})`;
      break;
    case "storage-details": {
      const projection = `jsonb_build_object('id',id,'title',title,'vehicle',vehicle_id,'vehicleLabel',vehicle_label,'category',category,'mime',mime,'bytes',bytes,'versions',versions,'documents',documents,'createdAt',created_at)`;
      select = `(WITH file_documents AS (
        SELECT d.id,d.title,d.vehicle_id,coalesce(v.label,'Account documents') AS vehicle_label,d.category,
          coalesce(max(r.mime_type) FILTER(WHERE r.is_current),max(r.mime_type)) AS mime,sum(r.file_size_bytes) AS bytes,count(*)::integer AS versions,1 AS documents,d.created_at
        FROM docs d JOIN doc_originals r ON r.document_id=d.id LEFT JOIN owned_vehicles v ON v.id=d.vehicle_id
        GROUP BY d.id,d.title,d.vehicle_id,v.label,d.category,d.created_at
      ), ranked AS (SELECT id,title,vehicle_id,vehicle_label,category,mime,bytes,versions,documents,created_at,row_number() OVER(ORDER BY bytes DESC,id) AS rank FROM file_documents), remaining AS (
        SELECT vehicle_id,vehicle_label,category,sum(bytes) AS bytes,sum(versions)::integer AS versions,count(*)::integer AS documents,row_number() OVER(ORDER BY sum(bytes) DESC,vehicle_id,category) AS rank
        FROM ranked WHERE rank>100 GROUP BY vehicle_id,vehicle_label,category
      ), atlas AS (
        SELECT id,title,vehicle_id,vehicle_label,category,mime,bytes,versions,documents,created_at FROM ranked WHERE rank<=100
        UNION ALL SELECT NULL,documents||' more documents',vehicle_id,vehicle_label,category,'Mixed',bytes,versions,documents,NULL FROM remaining WHERE rank<=50
        UNION ALL SELECT NULL,'Other storage groups',NULL,'Other vehicles','OTHER','Mixed',sum(bytes),sum(versions)::integer,sum(documents)::integer,NULL FROM remaining WHERE rank>50 HAVING count(*)>0
      ) SELECT jsonb_build_object(
        'distribution',${arr(`SELECT jsonb_agg(jsonb_build_object('label',label,'count',n,'bytes',bytes) ORDER BY band) FROM (
          SELECT band,label,count(r.version_id)::integer AS n,coalesce(sum(r.file_size_bytes),0) AS bytes
          FROM (VALUES(0,'< 500 KB',0::bigint,512000::bigint),(1,'500 KB – 1 MB',512000,1048576),(2,'1–5 MB',1048576,5242880),(3,'5–10 MB',5242880,10485760),(4,'10–20 MB',10485760,20971520),(5,'20 MB+',20971520,9223372036854775807)) b(band,label,minimum,maximum)
          LEFT JOIN doc_originals r ON r.file_size_bytes>=b.minimum AND r.file_size_bytes<b.maximum GROUP BY band,label) x`)},
        'median',(SELECT coalesce(percentile_cont(0.5) WITHIN GROUP(ORDER BY file_size_bytes),0) FROM doc_originals),
        'p90',(SELECT coalesce(percentile_cont(0.9) WITHIN GROUP(ORDER BY file_size_bytes),0) FROM doc_originals),
        'largestBytes',(SELECT coalesce(max(file_size_bytes),0) FROM doc_originals),
        'largest',${arr(`SELECT jsonb_agg(${projection} ORDER BY bytes DESC,id) FROM (SELECT id,title,vehicle_id,vehicle_label,category,mime,bytes,versions,documents,created_at FROM ranked WHERE rank<=20) x`)},
        'atlas',${arr(`SELECT jsonb_agg(${projection} ORDER BY bytes DESC,title) FROM atlas`)}))`;
      break;
    }
    case "storage-export":
      select = `jsonb_build_object('documents',${arr(`SELECT jsonb_agg(jsonb_build_object('id',id,'title',title,'vehicle',vehicle_id,'vehicleLabel',vehicle_label,'category',category,'mime',mime,'bytes',bytes,'versions',versions,'documents',1,'createdAt',created_at) ORDER BY bytes DESC,id) FROM (
        SELECT d.id,d.title,d.vehicle_id,coalesce(v.label,'Account documents') AS vehicle_label,d.category,coalesce(max(r.mime_type) FILTER(WHERE r.is_current),max(r.mime_type)) AS mime,
          sum(r.file_size_bytes) AS bytes,count(*)::integer AS versions,d.created_at
        FROM docs d JOIN doc_originals r ON r.document_id=d.id LEFT JOIN owned_vehicles v ON v.id=d.vehicle_id
        GROUP BY d.id,d.title,d.vehicle_id,v.label,d.category,d.created_at ORDER BY bytes DESC,d.id LIMIT 1001
      ) x`)})`;
      break;
    case "security": {
      const device = `CASE WHEN user_agent ~* 'ipad|tablet' THEN 'Tablet' WHEN user_agent ~* 'mobile|iphone|android' THEN 'Mobile' WHEN user_agent IS NULL OR user_agent='' THEN 'Unknown' ELSE 'Desktop' END`;
      const sessions = `SELECT s.created_at,s.last_seen_at,s.expires_at,s.revoked_at,s.id=p.session AS current,${device} AS device FROM sessions s JOIN auth ON s.user_id::text=auth.owner CROSS JOIN p`;
      select = `jsonb_build_object('activeSessions',(SELECT count(*) FROM (${sessions}) s CROSS JOIN p WHERE revoked_at IS NULL AND expires_at>now() AND (p.device='' OR s.device=p.device)),
      'lastLogin',(SELECT max(created_at) FROM (${sessions}) s CROSS JOIN p WHERE p.device='' OR s.device=p.device),
      'sessions',${arr(`SELECT jsonb_agg(jsonb_build_object('current',current,'device',device,'created',created_at,'lastSeen',last_seen_at,'expires',expires_at) ORDER BY last_seen_at DESC) FROM (SELECT s.created_at,s.last_seen_at,s.expires_at,s.current,s.device FROM (${sessions}) s CROSS JOIN p WHERE s.revoked_at IS NULL AND s.expires_at>now() AND (p.device='' OR s.device=p.device) ORDER BY last_seen_at DESC LIMIT 30) x`)},
      'series',${series(`SELECT date_trunc(p.bucket,s.created_at AT TIME ZONE 'Asia/Kolkata') AS tick,count(*)::integer AS value FROM (${sessions}) s CROSS JOIN p WHERE s.created_at >= (p.first::timestamp AT TIME ZONE 'Asia/Kolkata') AND s.created_at<((p.last+1)::timestamp AT TIME ZONE 'Asia/Kolkata') AND (p.device='' OR s.device=p.device) GROUP BY 1`, "count")},
      'events',${arr("SELECT jsonb_agg(jsonb_build_object('id',a.id,'title',CASE a.action WHEN 'SESSION_REVOKED' THEN 'Session signed out' WHEN 'PHONE_VERIFIED' THEN 'Mobile verified' WHEN 'GOOGLE_LINKED' THEN 'Google identity connected' ELSE 'Security settings updated' END,'timestamp',a.created_at) ORDER BY a.created_at DESC) FROM (SELECT a.id,a.action,a.created_at FROM audit_logs a JOIN auth ON a.user_id::text=auth.owner CROSS JOIN p WHERE a.action IN ('SESSION_REVOKED','PHONE_VERIFIED','GOOGLE_LINKED','PRIVACY_UPDATED','PASSWORD_CHANGED') AND a.created_at >= (p.first::timestamp AT TIME ZONE 'Asia/Kolkata') AND a.created_at<((p.last+1)::timestamp AT TIME ZONE 'Asia/Kolkata') ORDER BY a.created_at DESC LIMIT 30) a")})`;
      break;
    }
    case "network":
      select = `jsonb_build_object('observed',(SELECT count(*) FROM selected_scans WHERE result IS NOT NULL),'activeResolutions',(SELECT count(*) FROM selected_scans WHERE result='RESOLVED_ACTIVE'),
      'series',${series("SELECT date_trunc(p.bucket,e.created_at AT TIME ZONE 'Asia/Kolkata') AS tick,count(*)::integer AS value,count(*) FILTER(WHERE result='RESOLVED_ACTIVE')::integer AS successful FROM selected_scans e CROSS JOIN p GROUP BY 1", "count", ",'successful',coalesce(a.successful,0)")},
      'uploads',${arr("SELECT jsonb_agg(jsonb_build_object('label',status,'count',n)) FROM (SELECT r.status,count(*)::integer AS n FROM customer_document_versions r JOIN customer_documents d ON d.id=r.document_id JOIN auth ON d.owner_user_id::text=auth.owner CROSS JOIN p WHERE r.created_at >= (p.first::timestamp AT TIME ZONE 'Asia/Kolkata') AND r.created_at<((p.last+1)::timestamp AT TIME ZONE 'Asia/Kolkata') AND d.deleted_at IS NULL AND (d.vehicle_id IS NULL OR EXISTS(SELECT 1 FROM owned_vehicles WHERE id=d.vehicle_id)) AND (p.vehicle='' OR d.vehicle_id=p.vehicle) GROUP BY r.status) x")},
      'notifications',${arr("SELECT jsonb_agg(jsonb_build_object('label',status,'count',n)) FROM (SELECT nd.status,count(*)::integer AS n FROM notification_deliveries nd JOIN notifications n ON n.id=nd.notification_id JOIN auth ON n.user_id=auth.owner CROSS JOIN p WHERE nd.created_at >= (p.first::timestamp AT TIME ZONE 'Asia/Kolkata') AND nd.created_at<((p.last+1)::timestamp AT TIME ZONE 'Asia/Kolkata') AND p.vehicle='' AND p.qr='' GROUP BY nd.status) x")})`;
      break;
    case "activity": {
      const union = `SELECT 'scan:'||e.id AS id,'SCAN' AS type,e.created_at AS timestamp,'QR scanned' AS title,e.vehicle_id AS vehicle,v.label AS reference,'/scan-history' AS href FROM selected_scans e JOIN owned_vehicles v ON v.id=e.vehicle_id
      UNION ALL SELECT 'document:'||e.id,'DOCUMENT',e.created_at,e.event_type,e.vehicle_id,e.title,'/documents/'||e.document_id FROM doc_events e
      UNION ALL SELECT 'session:'||s.id,'ACCOUNT',s.created_at,'Signed in',NULL,'Account session','/settings/security' FROM sessions s JOIN auth ON s.user_id::text=auth.owner CROSS JOIN p WHERE p.vehicle='' AND p.qr='' AND s.created_at >= (p.first::timestamp AT TIME ZONE 'Asia/Kolkata') AND s.created_at<((p.last+1)::timestamp AT TIME ZONE 'Asia/Kolkata')
      UNION ALL SELECT 'notification:'||n.id,'NOTIFICATION',n.created_at,'Notification recorded',NULL,'Notification','/notifications' FROM notifications n JOIN auth ON n.user_id=auth.owner CROSS JOIN p WHERE p.vehicle='' AND p.qr='' AND n.created_at >= (p.first::timestamp AT TIME ZONE 'Asia/Kolkata') AND n.created_at<((p.last+1)::timestamp AT TIME ZONE 'Asia/Kolkata')
      UNION ALL SELECT 'activation:'||q.id,'ACTIVATION',q.activated_at,'QR activated',q.vehicle_id,q.label,'/qr' FROM qrs q CROSS JOIN p WHERE q.activated_at >= (p.first::timestamp AT TIME ZONE 'Asia/Kolkata') AND q.activated_at<((p.last+1)::timestamp AT TIME ZONE 'Asia/Kolkata')`;
      const predicate = cursor
        ? " AND (e.timestamp,e.id)<(?::timestamptz,?::text)"
        : "";
      if (cursor) params.push(cursor.timestamp, cursor.id);
      select = `jsonb_build_object('events',${arr(`SELECT jsonb_agg(jsonb_build_object('id',id,'type',type,'timestamp',timestamp,'title',title,'vehicle',vehicle,'reference',reference,'href',href) ORDER BY timestamp DESC,id DESC) FROM (SELECT e.id,e.type,e.timestamp,e.title,e.vehicle,e.reference,e.href FROM (${union}) e CROSS JOIN p WHERE (p.event='' OR e.type=p.event)${predicate} ORDER BY timestamp DESC,id DESC LIMIT 26) x`)})`;
      break;
    }
  }
  return {
    sql: `${base} SELECT ${select} AS data WHERE EXISTS(SELECT 1 FROM auth)`,
    params,
  };
}
