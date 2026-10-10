# Vehicle sticker and inventory operations

Configured on 9 October 2026 at the user's request. Template `VS-VEHICLE-80X60-V1` is a new manufacturing specification; historical records are not retrospectively marked as using it.

| Element | Dimensions / position in millimetres |
|---|---|
| Finished sticker | 80 × 60 |
| Single PDF page including bleed | 84 × 64 |
| Bleed | 2 on each edge |
| Safe inset | 4 inside the trim |
| QR including four-module quiet zone | 36 × 36, x 6 / y 16 |
| Scratch coating area | 29 × 13, x 45 / y 36 |
| Layout | One sticker per PDF page, actual size / 100% |

Coordinates start at the top-left of the finished sticker. This layout does not impose stickers on A4 sheets or generate a roll layout. Print with “Fit to page” disabled, cut at the trim indicators, and apply opaque scratch foil over the printed activation credential. A physical proof should verify QR scanning, scratch coverage and the intended vehicle mounting surface before a manufacturing run.

The server uses the versioned database specification and one vector primitive scene for SVG previews and PDF output. Existing `qrcode` and `jspdf` libraries are reused. Safe previews contain only the public resolver identity and a masked scratch zone. SVG preview rendering rejects scenes containing private activation material.

Production print jobs require the existing OPS/SUPER role, a reason, and a fresh verified admin email OTP. Reprints require SUPER_ADMIN. The server checks the QR lifecycle, unbound ownership, activation-proof consumption, available encrypted recovery archive, batch lifecycle, unresolved jobs and previous output issuance. Activated, blocked, replaced, distributed, sold, closed or cancelled inventory is not printable. Each job is capped at 100 identities, with atomic locks and an idempotent request reference.

The original private activation code is recovered only on the server from the existing encrypted batch archive and verified against its canonical salted hash. Codes are never regenerated for a reprint. The PDF is encrypted in the configured private R2 bucket and is available through an owner-authorized POST endpoint for ten minutes. No public object URL or presigned credential-bearing link is returned. Expired access is denied even while encrypted evidence remains in R2. Browser-delivered manufacturing files must be handled within the approved print process; server expiry cannot retract a downloaded file.

Preparing a PDF does not mark inventory printed. Issuing a file records `PRINTING` and an audit event. The operator separately records the inspected physical outcome with a reason and fresh verification. Only confirmed completion changes canonical QR lifecycle to `PRINTED`; it creates no ownership binding or entitlement. Cancel or resolve an interrupted job before requesting new output. A previously issued artifact requires the controlled reprint path even if the physical print failed.

Inventory reads use a 50-row keyset over `(created_at, id)`, preserving timestamp precision. Aggregates are separate and cached in the current admin query cache; Load More does not recalculate facets. All-matching selection stores an expiring session-bound filter token, not a client array of every matching identity. State and eligibility are rechecked when the action executes.

Inventory exports reuse the existing report table, R2 export worker, CSV allowlist and masking/formula escaping. Inventory reports support filtered results and explicit or token-based selection. The existing export worker is currently disabled by configuration, so the UI returns a recoverable unavailability message rather than claiming an export succeeded. The worker changes must be deployed before enabling that flag.

Verified against 1,001 real identities: two consecutive 50-row pages without overlap, combined prefix/date/channel/print filters, private-table RLS and revoked customer/public privileges, and denial of a print request without an admin session. The cursor lookup used `qr_inventory_cursor` with an index-only scan of 51 rows and no heap fetches (0.116 ms database execution in this run). Larger datasets were not populated or benchmarked. The index bounds list reads; exact aggregate work grows with the matching set.

Local code and database migrations are configured; this does not deploy the admin frontend or export worker. Credential-bearing output requires actual fresh verification at use time. Physical manufacturing completion was not simulated during development.
