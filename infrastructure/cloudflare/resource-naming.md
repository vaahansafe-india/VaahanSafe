# Cloudflare Resource Naming Strategy — VaahanSafe

Physical Cloudflare resource names vary deterministically by environment. Application code never interacts with physical resource names; it binds exclusively to stable logical identifiers.

---

## 1. Naming Syntax

```
vaahansafe-{env}-{resource}
```

Where `{env}` is one of:
- `dev` (Local emulation & shared engineering development)
- `staging` (Pre-production QA & integration testing)
- `prod` (Live customer production)

---

## 2. Resource Name Matrix

### Cloudflare D1 Databases (Relational SQL)
- **Development:** `vaahansafe-dev-db`
- **Staging:** `vaahansafe-staging-db`
- **Production:** `vaahansafe-prod-db`

*Application Binding:* `DB`

### Cloudflare R2 Object Storage Buckets

#### Public Storage
- **Development:** `vaahansafe-dev-public`
- **Staging:** `vaahansafe-staging-public`
- **Production:** `vaahansafe-prod-public`

*Application Binding:* `PUBLIC_STORAGE`

#### Private Storage
- **Development:** `vaahansafe-dev-private`
- **Staging:** `vaahansafe-staging-private`
- **Production:** `vaahansafe-prod-private`

*Application Binding:* `PRIVATE_STORAGE`

#### Export Storage
- **Development:** `vaahansafe-dev-exports`
- **Staging:** `vaahansafe-staging-exports`
- **Production:** `vaahansafe-prod-exports`

*Application Binding:* `EXPORT_STORAGE`

### Cloudflare Queues (Asynchronous Events)

#### Notifications Queue
- **Development:** `vaahansafe-dev-notifications`
- **Staging:** `vaahansafe-staging-notifications`
- **Production:** `vaahansafe-prod-notifications`

*Application Binding:* `NOTIFICATION_QUEUE`

#### Analytics Queue
- **Development:** `vaahansafe-dev-analytics-events`
- **Staging:** `vaahansafe-staging-analytics-events`
- **Production:** `vaahansafe-prod-analytics-events`

*Application Binding:* `ANALYTICS_QUEUE`

#### Commerce Queue
- **Development:** `vaahansafe-dev-commerce-events`
- **Staging:** `vaahansafe-staging-commerce-events`
- **Production:** `vaahansafe-prod-commerce-events`

*Application Binding:* `COMMERCE_QUEUE`

#### Dead-Letter Queues (DLQ)
- **Development:** `vaahansafe-dev-dlq`
- **Staging:** `vaahansafe-staging-dlq`
- **Production:** `vaahansafe-prod-dlq`

---

## 3. Invariant Rule

1. **Zero Data Crossover**: Production databases, buckets, and queues must NEVER be targeted by development or staging workloads.
2. **Stable Code Bindings**: Code uses `env.DB` or `env.PUBLIC_STORAGE`, never `vaahansafe-prod-db`.
