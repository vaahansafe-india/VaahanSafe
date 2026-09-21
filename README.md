# VaahanSafe — Production Monorepo Foundation (V1.1)

> **VaahanSafe** is a QR-based vehicle safety and emergency identification platform designed for the Indian automotive ecosystem. It bridges physical retail sticker activation, instant emergency contact notifications, and permanent public QR vehicle profile resolution.

---

## 1. Monorepo Architecture Overview

This repository is built using an **npm workspaces** and **Turborepo** monorepo structure. It unifies 8 distinct applications and 18 domain/infrastructure packages into a single cohesive engineering workspace.

```
vaahansafe/
├── apps/
│   ├── web/             # vaahansafe.com — Public portal & design system preview (Port 3000)
│   ├── customer/        # app.vaahansafe.com — Authenticated customer portal (Port 3001)
│   ├── activate/        # activate.vaahansafe.com — Retail QR sticker activation (Port 3002)
│   ├── qr/              # qr.vaahansafe.com — High-uptime permanent QR resolver (Port 3003)
│   ├── admin/           # admin.vaahansafe.com — Operations & fleet admin console (Port 3004)
│   ├── api/             # api.vaahansafe.com — Central backend REST API (Port 3005)
│   ├── blog/            # blog.vaahansafe.com — Road safety & vehicle editorial (Port 3006)
│   └── status/          # status.vaahansafe.com — Public platform health & incident SLA (Port 3007)
├── packages/
│   ├── ui/              # @vaahansafe/ui — shadcn/ui components, design tokens, and UI patterns
│   ├── icons/           # @vaahansafe/icons — Unified <VaahanIcon /> abstraction on Hugeicons
│   ├── database/        # @vaahansafe/database — Cloudflare D1 client & repository contracts
│   ├── auth/            # @vaahansafe/auth — Session contracts, OTP adapters & onboarding guards
│   ├── config/          # @vaahansafe/config — Typed environment & domain URL constants
│   ├── types/           # @vaahansafe/types — Central domain models & entity interfaces
│   ├── validation/      # @vaahansafe/validation — Zod schemas (Indian phone, RC plate, QR IDs)
│   ├── security/        # @vaahansafe/security — Sensitive masking, token helpers & Turnstile
│   ├── qr/              # @vaahansafe/qr-core — QR lifecycle state machine & resolver contracts
│   ├── commerce/        # @vaahansafe/commerce — Cart, product catalog & checkout contracts
│   ├── subscriptions/   # @vaahansafe/subscriptions — Subscription lifecycle & renewal plans
│   ├── payments/        # @vaahansafe/payments — Cashfree payment integration & webhook verifiers
│   ├── notifications/   # @vaahansafe/notifications — MSG91 OTP/WhatsApp & transactional email
│   ├── storage/         # @vaahansafe/storage — Cloudflare R2 object storage abstractions
│   ├── shipping/        # @vaahansafe/shipping — Courier partners & QR sticker fulfillment
│   ├── content/         # @vaahansafe/content — Blog & CMS content interfaces
│   ├── analytics/       # @vaahansafe/analytics — Privacy-preserving scan telemetry
│   └── observability/   # @vaahansafe/observability — Structured JSON logger & ERR/... error codes
├── database/            # D1 migrations & development seeds
├── infrastructure/      # Cloudflare Workers, vinext, and Wrangler environment configurations
└── tooling/             # Shared TypeScript and ESLint configurations
```

---

## 2. Prerequisites & Installation

- **Node.js:** `>= 20.0.0` (LTS recommended)
- **npm:** `>= 10.0.0`

Clone the repository and install all workspace dependencies:

```bash
npm install
```

Copy the environment template:

```bash
cp .env.example .env
```

---

## 3. Local Development Experience

Run all applications concurrently or launch a specific workspace on its deterministic port:

| Command | Workspace | Target Domain | Local URL |
|---|---|---|---|
| `npm run dev` | **All Applications** | Turborepo parallel | *Various* |
| `npm run dev:web` | `@vaahansafe/web` | `vaahansafe.com` | [http://localhost:3000](http://localhost:3000) |
| `npm run dev:app` | `@vaahansafe/customer` | `app.vaahansafe.com` | [http://localhost:3001](http://localhost:3001) |
| `npm run dev:activate` | `@vaahansafe/activate` | `activate.vaahansafe.com` | [http://localhost:3002](http://localhost:3002) |
| `npm run dev:qr` | `@vaahansafe/qr` | `qr.vaahansafe.com` | [http://localhost:3003](http://localhost:3003) |
| `npm run dev:admin` | `@vaahansafe/admin` | `admin.vaahansafe.com` | [http://localhost:3004](http://localhost:3004) |
| `npm run dev:api` | `@vaahansafe/api` | `api.vaahansafe.com` | [http://localhost:3005](http://localhost:3005) |
| `npm run dev:blog` | `@vaahansafe/blog` | `blog.vaahansafe.com` | [http://localhost:3006](http://localhost:3006) |
| `npm run dev:status` | `@vaahansafe/status` | `status.vaahansafe.com` | [http://localhost:3007](http://localhost:3007) |

---

## 4. Build, Lint, Typecheck & Testing

```bash
# Build all workspaces
npm run build

# Build individual applications
npm run build:web
npm run build:app
npm run build:activate
npm run build:qr
npm run build:admin
npm run build:api
npm run build:blog
npm run build:status

# Quality & Verification
npm run typecheck    # Strict TypeScript checks across all 8 apps & 18 packages
npm run lint         # ESLint checks
npm run test         # Vitest test suite execution
npm run format       # Prettier code formatting
npm run clean        # Clean build artifacts & node_modules
```

---

## 5. UI Architecture & shadcn/ui Monorepo Rules

- **Shared Components:** All reusable UI components live in `packages/ui/src/components/`. Applications never create isolated duplicate `Button`, `Input`, or `Card` components.
- **Adding Components:** When installing new shadcn/ui primitives, route them to `packages/ui` using the workspace-aware CLI.
- **Hugeicons Exclusivity:** Lucide, Heroicons, or ad-hoc SVGs are strictly forbidden. All icons are rendered via the semantic `<VaahanIcon name="..." />` component exported by `@vaahansafe/icons`.

---

## 6. Cloudflare Deployment (`vinext`)

Cloudflare recommends **`vinext`** for Next.js App Router deployments on Workers.
- **Config:** `infrastructure/cloudflare/environments/wrangler.dev.toml` & `wrangler.prod.toml`
- **Bindings:**
  - `DB` &rarr; Cloudflare D1
  - `PUBLIC_STORAGE` & `PRIVATE_STORAGE` &rarr; Cloudflare R2
  - `QUEUE_NOTIFICATIONS` & `QUEUE_ANALYTICS` &rarr; Cloudflare Queues
