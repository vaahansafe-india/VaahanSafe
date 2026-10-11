# Retail sale recording

## Activation account reuse

Activation continues with the account in the validated server session when its current mobile has a matching, verified `PHONE` identity. The page explicitly explains why another OTP is unnecessary. A saved phone number or onboarding flag alone cannot satisfy this gate. Signed-out users complete the real mobile OTP flow, which reuses their existing phone account or creates one after verification. Signed-in users without verified mobile complete verification on that account; conflicting accounts are never silently merged.

Vehicle listing, vehicle creation and final activation independently enforce this mobile gate. The atomic claim also checks the verified phone identity, active account and unexpired challenge. Verification: ten activation tests, type checking, lint and production build passed; a fresh local browser session confirmed account reuse, and a read-only backend query and anonymous endpoint check confirmed the configured identity predicate and sign-in requirement.

The local admin retailer detail page now has **Record retail sale** and a **Sales** history tab. This writes the existing QR lifecycle from `WITH_RETAILER` to `SOLD`, using the configured authoritative Supabase backend. The Cloudflare resolver, private R2 print assets, customer activation proof, ownership and entitlement gates remain separate.

## Required operations

1. Generate the protected print output and physically inspect the stickers, QR scans and scratch coverage. Use **Record verified printing** on the print-job page.
2. On a completed `PRINT` job, use **Release verified stickers** to release only its inspected units for distribution. Supply an operational reason, explicitly confirm inspection and complete fresh work-email verification if requested. Draft/generated/exported batches keep their existing status and their unprinted units remain unavailable. Whole batches already recorded as `PRINTED`, `RECEIVED` or `CLOSED` retain their existing verified-print eligibility.
3. Record actual distributor receipt and retailer receipt through Transfers. Eligible sale stock must be `WITH_RETAILER`, with matching active distributor custody and an active, verified outlet.
4. Open the retailer, choose **Record retail sale**, select the actual stickers sold, supply the existing receipt/sales-register reference and operational reason, confirm the sale, and complete fresh work-email verification when requested.
5. The customer can then recognize the retail identity, verify its private activation proof, authenticate with a verified mobile number and bind an authorized vehicle through the existing atomic activation flow.

Current manufactured activation proofs contain 16 characters, displayed as four groups. The activation form accepts the complete printed value, with optional spaces or hyphens. The client and verification endpoint normalize separators before the existing full-secret hash comparison. Shorter previously issued codes remain supported; the form must never silently slice a proof to 12 characters or instruct customers to enter only six. The `activation-proof-input` tests verify grouped-code compatibility with the existing cryptographic hash and confirm that a truncated value cannot verify. No stored secret, hash, failed-attempt policy or acquisition gate changes.

Activation recognition and proof verification share the same exact public-ID / visible-ID lookup. Opaque uppercase and mixed-case public identifiers must retain their stored case; legacy `vs_` aliases can resolve through the unique visible ID. Challenge restore/attachment and recent-attempt windows use PostgreSQL timestamps when the configured adapter reports `dialect: postgres`, while the existing D1 syntax is retained for D1 callers. Migration `20261011202225_activation_proof_lookup_and_audit.sql` adds the private reason-code and one-way fingerprint/IP digest fields expected by the existing audit repository. `verify-activation-proof-backend.mjs` verifies audit insertion, lookup, expiry and attempt windows using rollback-only fixtures. It reads no actual activation proof and commits no claim, challenge, ownership, failed-attempt or entitlement changes.

Preparing/downloading a PDF does not confirm physical printing. Printing does not record a sale. A sale does not activate the sticker, assign a customer, consume the private proof, confirm a Cashfree payment, create an entitlement or unlock a subscription.

When a distributor has no eligible stock, record **Central inventory → Distributor** first, including approval, physical dispatch and acknowledged receipt. Only then can the distributor supply its verified retailer. The Transfers wizard can switch to checking central stock for the selected distributor. The older distributor and retailer dialogs use the same authoritative stock selector and preserve the entered details during fresh email verification. Identical retries reuse an actor-bound request ID.

Receipt fields accept the printed `VS-` VaahanSafe IDs; descriptions of physical condition belong in **Operational reason**. The receipt screen validates the ID format, duplicates across categories and the remaining quantity before submission. API validation normalizes case and typographic dashes and rejects prose. The database still checks each ID against the real reserved manifest and receipt state. **Final receipt** warns when unlisted pending units will become missing. When every unit is already accounted for and missing units remain, **Resolve** becomes the next action. Enter physically recovered stickers under **Found and received QR codes**; submitting another receipt cannot recover an already missing identity. These interface changes do not alter custody records themselves.

Migration `20261011185525_verified_print_stock_release.sql` adds immutable, private print-job release manifests, a shared `retail_stock_ready` gate and per-unit checks during transfer approval/dispatch and retail sale. It checks the real completed job, inspected print items, offline retail channel, central custody, unused unlocked proof, absence of assignments/reservations, role and fresh verification. Release changes no QR lifecycle, batch state, custody, ownership, proof consumption or entitlement. Quarantine still blocks previously released units.

`node tooling/scripts/verify-print-stock-release.mjs` tests authorization, incomplete printing, reprints, custody, quarantine, consumed/locked proof, whole-job completeness, duplicate/conflicting requests, immutable evidence and the full release → distributor receipt → retailer receipt → sale flow inside a rolled-back transaction. The original sale and transfer rollback checks also pass against the installed update; security advisors report no errors. No real sticker has been released, dispatched, received or sold by these checks.

## Backend

Migration: `supabase/migrations/20261011181950_retail_sale_recording.sql`.

`admin_retail_sales` and `admin_retail_sale_items` retain immutable actor, outlet, supplying distributor, receipt and identity evidence with restrictive foreign keys. RLS is enabled; access is restricted to the server service role. RPCs are security invoker and independently validate the real admin session, role and fresh verification for writes.

The sale transaction locks partners, batches and QR rows in a stable order, then rechecks eligibility. Any invalid identity rejects the complete selection. Reserved, unprinted, online-channel, quarantined, damaged, sold, assigned or activated stock is excluded. The sale does not consume the private activation proof. The unique QR sale-item constraint prevents a second sale; each receipt reference is unique within an outlet. Actor-bound request IDs return the original result on identical retries and reject changed payloads. Inventory lifecycle and retailer audit records are inserted in the same transaction.

Lists are bounded and cursor-paginated. The picker exposes visible IDs and batch references only. It never returns activation proof hashes, plaintext codes or customer details. Read-only administrators can view sales, with operational reasons withheld.

## Validation

Run `npm exec vitest -- run tests/retail-sale.test.ts tests/transfer-control.test.ts`, admin type checking/build, and `node tooling/scripts/verify-retail-sale.mjs`.

The database verification uses an existing authenticated session and isolated fixtures inside a rollback subtransaction. It checks permissions, fresh verification, custody, printed evidence, reservations, quarantine, channel, proof readiness, duplicate sale/receipt rejection, retry conflicts, atomic failure, immutable evidence, audit coverage and no customer assignment/entitlement creation. No fixture or sale is committed. The installed migration passed this verification and the database security advisor reported no errors.

At implementation time, `VS-BF42R86V` remained `INVENTORY` in draft batch `B001`, without recorded physical printing or retailer custody. It was not force-sold or activated. The real retailer picker correctly showed no eligible stock.
