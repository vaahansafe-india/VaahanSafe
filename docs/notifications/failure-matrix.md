# Notification Failure & Recovery Matrix

| Scenario | Authoritative State | Retry Action | User Impact | Operator Action |
|---|---|---|---|---|
| **Business Commit Succeeds / Intent Write Fails** | Business state committed (e.g. Payment SUCCESS, QR ACTIVATED) | Outbox / transaction retry | Notification delayed | Check D1 write latency/availability |
| **Intent Saved / Queue Publish Fails** | Intent status `PENDING` in D1 | Recovered by background worker `republishPendingIntents` | Notification delayed by ~1-5m | Monitor queue publish health; worker automatically republishes |
| **Queue Duplicate Message Received** | Checked against `intent.status === 'PROCESSED'` and delivery status | Skipped safely (no duplicate send) | Zero impact | None (expected queue behavior) |
| **Queue Message Malformed** | Rejected by Zod runtime validation | Nack / DLQ | Sender alerted | Inspect queue message producer format |
| **MSG91 WhatsApp Timeout** | Marked `FAILED_RETRYABLE` in delivery | Bounded backoff retry (up to 3 attempts) | WhatsApp message delayed | Monitor MSG91 API status |
| **WhatsApp Permanent Error (Invalid Number)** | Marked `FAILED_PERMANENT` | Do not retry | User alerted in in-app notification | Prompt user in portal to update verified phone |
| **Email Provider 5xx / Timeout** | Marked `FAILED_RETRYABLE` in delivery | Bounded backoff retry | Email delayed | Monitor email provider status |
| **Email Fails / WhatsApp & In-App Succeed** | In-app & WhatsApp `DELIVERED`, Email `FAILED` | Email retries; WhatsApp not resent | In-app/WA delivered immediately | None (channel isolation works as designed) |
| **Max Retries Exhausted** | Marked `DEAD_LETTERED` in D1 | Emitted to DLQ | User sees in-app only | Admin review & manual replay from console |
| **Rapid Repeated QR Scans (Alert Storm)** | First scan triggers alert; subsequent suppressed by cooldown | Deduplicated by 15m window | Only 1 alert sent | None (storm protection operating normally) |
| **OTP Provider Outage** | Auth returns safe provider-unavailable | Immediate sync retry in auth UX | User told to retry in 30s | Monitor MSG91 OTP endpoint health |
