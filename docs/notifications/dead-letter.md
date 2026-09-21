# Notification Dead-Letter Queue (DLQ) Architecture

## 1. Dead-Letter Policy

When a notification delivery exhausts all permitted retry attempts (default: 3 attempts):
1. Status is updated to `DEAD_LETTERED` in `notification_deliveries`.
2. A `DeadLetterRecord` is emitted to the dead-letter handler:
   ```typescript
   export interface DeadLetterRecord {
     intentId: string;
     deliveryId: string;
     channel: NotificationChannel;
     normalizedError: string;
     attemptCount: number;
     lastAttemptAt: string;
     correlationId?: string;
   }
   ```
3. **No Sensitive PII**: DLQ records never contain recipient phone numbers, email bodies, passwords, or OTP secrets.
4. **Operator Visibility**: Operators can inspect dead-lettered records from the admin console and initiate an authorized manual replay.
