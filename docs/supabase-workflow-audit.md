# Supabase workflow audit — 9 October 2026

The live public schema has 56 tables. This audit distinguishes application reads/writes from internal audit records and provider-owned state. A table does not require a customer CRUD screen merely because it exists. Server references below are a static source inventory, not proof of complete behavior.

## Verified repairs

- Database writes return affected-row counts; failed RPC responses fail closed. Bound parameters ignore quoted text/comments and transaction delimiters cannot be terminated by a bound value.
- Notification intents, deliveries, attempts and preferences now support leased claims, durable retries, duplicate suppression and provider delivery callbacks. New events are captured with the originating business write.
- Read/unread mutations now synchronize the compatibility columns correctly. Inbox totals use one owner-scoped SQL aggregate; displayed activity remains bounded to the latest 200 records.
- Preference writes batch atomically. TanStack mutations invalidate the affected session-scoped customer resources after server confirmation.
- The missing subscription_events table is added with an owned-account, transactional renewal-preference RPC. PostgreSQL booleans and overloaded date functions are handled correctly. Paid current-term coverage remains active when renewal preferences change.
- Browser clients cannot write verified contacts or scan telemetry, access the notification outbox, approve replacement requests, or read private QR inventory. Server-authorized app flows retain access.
- Admin support updates require a real linked customer account before they create customer notifications.

## Provider-dependent workflows

- Recurring provider billing is not configured by this change. Provider metadata does not create a billing agreement. The UI avoids claiming automatic renewal for internal/manual plans, and the plan enquiry link no longer routes to an unrelated sticker checkout.
- Renewal templates require a newly confirmed payment for an actual PLAN order item and a real period extension; a sticker purchase cannot trigger a plan renewal receipt.
- Shipment messages follow recorded shipment state; this change does not invent tracking updates or configure an unconnected courier.
- Replacement dispatch copy is held until SHIPPED/COMPLETED, rather than sent at approval/allocation.
- Authentication OTP remains in the existing MSG91 widget authentication flow, separate from transactional notification delivery.

## Table source inventory

| Live table | First server/domain references |
| --- | --- |
| `addresses` | `apps/customer/lib/payments-service.ts`, `apps/customer/lib/orders-service.ts`, `apps/customer/app/(app)/orders/new/page.tsx` |
| `admin_action_previews` | Database RPC / migration-owned; no direct TypeScript table reference found. Review the owning SQL function before exposing any API. |
| `admin_audit_logs` | `apps/admin/lib/operations.ts`, `apps/admin/lib/modules.ts`, `apps/admin/app/api/upload/route.ts` |
| `admin_auth_limits` | Database RPC / migration-owned; no direct TypeScript table reference found. Review the owning SQL function before exposing any API. |
| `admin_documents` | `apps/admin/lib/modules.ts` |
| `admin_export_jobs` | `apps/admin/lib/modules.ts`, `apps/admin/app/api/exports/[id]/route.ts` |
| `admin_feature_flags` | `apps/admin/lib/modules.ts` |
| `admin_incidents` | `apps/admin/lib/modules.ts` |
| `admin_partners` | `apps/admin/lib/modules.ts` |
| `admin_sessions` | `apps/admin/lib/session.ts`, `apps/admin/app/api/auth/otp/route.ts` |
| `admin_stock_reconciliations` | `apps/admin/lib/modules.ts` |
| `admin_stock_transfers` | `apps/admin/lib/modules.ts` |
| `admin_support_tickets` | `apps/admin/lib/modules.ts` |
| `admin_users` | `apps/admin/lib/session.ts`, `apps/admin/lib/operations.ts`, `apps/admin/app/api/auth/password/route.ts` |
| `audit_logs` | Database RPC / migration-owned; no direct TypeScript table reference found. Review the owning SQL function before exposing any API. |
| `auth_identities` | `packages/database/src/repositories/supabase-auth.repository.ts`, `packages/database/src/repositories/auth-identity.repository.ts`, `apps/api/app/v1/payments/create-order/route.ts` |
| `auth_otp_dispatches` | Database RPC / migration-owned; no direct TypeScript table reference found. Review the owning SQL function before exposing any API. |
| `auth_otp_requests` | Database RPC / migration-owned; no direct TypeScript table reference found. Review the owning SQL function before exposing any API. |
| `emergency_contacts` | `packages/database/src/repositories/emergency.repository.ts`, `packages/database/src/queries/public-emergency-profile.query.ts`, `packages/qr/src/resolver/resolve-public-qr.ts` |
| `emergency_profiles` | `packages/database/src/repositories/emergency.repository.ts`, `packages/database/src/queries/public-emergency-profile.query.ts`, `packages/qr/src/resolver/resolve-public-qr.ts` |
| `fulfilments` | `packages/database/src/repositories/fulfilment.repository.ts`, `apps/customer/lib/orders-service.ts`, `apps/customer/lib/orders-actions.ts` |
| `journal_articles` | `packages/database/src/repositories/supabase-journal.repository.ts`, `packages/database/src/repositories/journal.repository.ts` |
| `journal_authors` | `packages/database/src/repositories/journal.repository.ts` |
| `journal_categories` | `packages/database/src/repositories/supabase-journal.repository.ts`, `packages/database/src/repositories/journal.repository.ts` |
| `media_assets` | `packages/database/src/repositories/media-asset.repository.ts`, `apps/admin/lib/modules.ts`, `apps/admin/app/api/upload/route.ts` |
| `notification_deliveries` | `packages/database/src/repositories/notification.repository.ts`, `apps/admin/lib/modules.ts` |
| `notification_delivery_attempts` | `packages/database/src/repositories/notification.repository.ts` |
| `notification_intents` | `packages/database/src/repositories/notification.repository.ts`, `packages/database/src/notifications/dispatcher.ts`, `packages/qr/src/resolver/telemetry.ts` |
| `notification_preferences` | `packages/database/src/repositories/notification.repository.ts` |
| `notifications` | `packages/database/src/repositories/notification.repository.ts`, `packages/database/src/notifications/dispatcher.ts`, `packages/qr/src/resolver/telemetry.ts` |
| `order_items` | `packages/database/src/repositories/commerce.repository.ts`, `apps/customer/lib/payments-service.ts`, `apps/customer/lib/orders-service.ts` |
| `orders` | `packages/payments/src/webhook-service.ts`, `packages/database/src/repositories/commerce.repository.ts`, `apps/admin/lib/operations.ts` |
| `payment_events` | Database RPC / migration-owned; no direct TypeScript table reference found. Review the owning SQL function before exposing any API. |
| `payment_webhook_events` | `packages/payments/src/webhook-service.ts`, `apps/customer/app/api/webhooks/cashfree/route.ts`, `apps/api/app/v1/payments/webhook/route.ts` |
| `payments` | `packages/payments/src/webhook-service.ts`, `packages/database/src/repositories/commerce.repository.ts`, `apps/admin/lib/modules.ts` |
| `plans` | `packages/database/src/repositories/commerce.repository.ts`, `apps/admin/lib/modules.ts`, `apps/customer/lib/subscription-service.ts` |
| `products` | `packages/database/src/repositories/commerce.repository.ts`, `apps/customer/lib/qr-service.ts`, `apps/customer/app/(app)/orders/new/page.tsx` |
| `qr_activation_attempts` | `packages/database/src/repositories/qr-activation-attempt.repository.ts`, `apps/admin/lib/modules.ts`, `apps/customer/lib/qr-service.ts` |
| `qr_activation_challenges` | `packages/database/src/repositories/qr-activation-challenge.repository.ts`, `apps/activate/lib/activation-service.ts` |
| `qr_activation_secrets` | `packages/database/src/repositories/qr-activation-secret.repository.ts`, `packages/qr/src/entitlement/service-entitlement.ts`, `apps/activate/lib/activation-service.ts` |
| `qr_assignments` | `packages/database/src/repositories/qr.repository.ts`, `packages/database/src/repositories/fulfilment.repository.ts`, `packages/database/src/queries/public-emergency-profile.query.ts` |
| `qr_batches` | `packages/qr/src/entitlement/service-entitlement.ts`, `apps/admin/lib/modules.ts`, `apps/api/app/v1/admin/qr/inventory/route.ts` |
| `qr_reservations` | `packages/database/src/repositories/fulfilment.repository.ts` |
| `qr_scan_events` | `packages/qr/src/resolver/telemetry.ts`, `apps/admin/lib/operations.ts`, `apps/admin/lib/modules.ts` |
| `qr_status_history` | `packages/database/src/repositories/qr.repository.ts`, `packages/database/src/repositories/fulfilment.repository.ts`, `apps/activate/lib/activation-service.ts` |
| `qr_stickers` | `packages/database/src/repositories/qr.repository.ts`, `packages/database/src/repositories/fulfilment.repository.ts`, `packages/database/src/queries/public-emergency-profile.query.ts` |
| `refunds` | `apps/admin/lib/modules.ts` |
| `replacement_requests` | `packages/database/src/repositories/fulfilment.repository.ts`, `apps/admin/lib/modules.ts`, `apps/customer/lib/vehicle-service.ts` |
| `service_entitlements` | `packages/qr/src/resolver/resolve-public-qr.ts`, `packages/qr/src/entitlement/service-entitlement.ts`, `apps/activate/lib/activation-service.ts` |
| `sessions` | `packages/database/src/repositories/supabase-auth.repository.ts`, `packages/database/src/repositories/session.repository.ts` |
| `shipments` | `packages/database/src/repositories/fulfilment.repository.ts`, `apps/admin/lib/modules.ts`, `apps/customer/lib/orders-service.ts` |
| `status_heartbeats` | Database RPC / migration-owned; no direct TypeScript table reference found. Review the owning SQL function before exposing any API. |
| `sticker_replacements` | `packages/database/src/repositories/fulfilment.repository.ts` |
| `subscriptions` | `packages/database/src/repositories/supabase-data.repository.ts`, `packages/database/src/repositories/subscription.repository.ts`, `apps/admin/lib/operations.ts` |
| `users` | `packages/database/src/repositories/user.repository.ts`, `packages/database/src/repositories/supabase-auth.repository.ts`, `apps/admin/lib/operations.ts` |
| `vehicles` | `packages/database/src/repositories/vehicle.repository.ts`, `packages/database/src/queries/public-emergency-profile.query.ts`, `packages/qr/src/resolver/telemetry.ts` |
