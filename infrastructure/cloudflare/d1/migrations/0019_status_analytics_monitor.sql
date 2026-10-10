-- Public capability metadata only; no business records or synthetic check history.
INSERT INTO status_services (id,public_id,slug,name,description,journey_stage,current_state,display_order,is_public)
VALUES ('srv_customer_analytics','vs_srv_customer_analytics','customer-analytics','Customer Analytics',
  'Availability of scan and document storage reporting queries.','ACCOUNT','UNKNOWN',7,1)
ON CONFLICT(slug) DO NOTHING;
