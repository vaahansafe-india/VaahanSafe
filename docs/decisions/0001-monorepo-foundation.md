# ADR 0001: Monorepo Foundation & Tooling

## Status
Accepted

## Context
VaahanSafe consists of 8 distinct web applications sharing common design tokens, authentication flows, database schemas, and external integrations. Separate repositories would cause package drift, duplicate models, and operational friction.

## Decision
1. Use an npm workspaces + Turborepo monorepo.
2. Standardize on Next.js App Router for all web applications.
3. Centralize shadcn/ui components in `packages/ui` and Hugeicons in `packages/icons`.
4. Deploy to Cloudflare Workers with `vinext`, Cloudflare D1 for SQLite persistence, and Cloudflare R2 for object storage.
