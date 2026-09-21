# Architecture Decisions & System Design

This document details the architectural boundaries of the VaahanSafe monorepo.

## 1. Domain Separation
- All 8 applications (`web`, `customer`, `activate`, `qr`, `admin`, `api`, `blog`, `status`) share a single product domain.
- Common business logic, contracts, and interfaces belong to `packages/*`.
- Applications NEVER import directly from other applications' source trees.

## 2. Infrastructure
- Cloudflare Workers using `vinext` for drop-in Next.js App Router support.
- Cloudflare D1 for relational persistence.
- Cloudflare R2 for files, documents, and media.
- Cloudflare Queues for asynchronous event processing.
- MSG91 for Indian transactional OTP and WhatsApp alerts.
- Cashfree for payment gateway integration.

## 3. UI and Icon Abstraction
- shadcn/ui shared primitives reside centrally in `packages/ui`.
- Hugeicons is the exclusive icon library via `@vaahansafe/icons`.
- Direct Lucide or random SVG icon imports in application code are strictly prohibited.
