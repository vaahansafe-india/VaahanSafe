# Local Development Guide

## Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0

## Root Scripts
- `npm run dev`: Runs all applications in parallel using Turborepo.
- `npm run dev:web`: http://localhost:3000
- `npm run dev:app`: http://localhost:3001
- `npm run dev:activate`: http://localhost:3002
- `npm run dev:qr`: http://localhost:3003
- `npm run dev:admin`: http://localhost:3004
- `npm run dev:api`: http://localhost:3005
- `npm run dev:blog`: http://localhost:3006
- `npm run dev:status`: http://localhost:3007

## Code Quality
- `npm run typecheck`: Strict TypeScript checking across all workspaces.
- `npm run lint`: ESLint across all workspaces.
- `npm run test`: Vitest test execution.
- `npm run build`: Full Turborepo production build.
- `npm run format`: Prettier formatting.
