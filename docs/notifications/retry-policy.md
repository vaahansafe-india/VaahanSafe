# Notification Retry Policy & Error Classification

## 1. Classification Strategy

All notification errors are classified into two categories:

| Category | Typical Causes | Action |
|---|---|---|
| **RETRYABLE** | Network timeouts, provider HTTP 500/502/503/504, rate limits (HTTP 429), connection drops | Schedule bounded exponential backoff attempt |
| **PERMANENT** | Invalid phone format, invalid email address, template schema validation failure, missing recipient | Transition immediately to `FAILED_PERMANENT` without retry loops |

---

## 2. Bounded Exponential Backoff

```
Attempt 1: +30 seconds
Attempt 2: +60 seconds
Attempt 3: +120 seconds
Max Attempts: 3 (configurable)
Max Cap: 300 seconds (5 minutes)
```

When `attemptNumber >= maxAttempts`, delivery transitions to `DEAD_LETTERED`.
