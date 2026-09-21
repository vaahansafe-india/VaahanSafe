/**
 * @vaahansafe/notifications
 *
 * Production Notification Platform: In-App, WhatsApp, Email,
 * Template Registry, Channel Matrix, and Idempotent Queue Processing.
 *
 * INVARIANT: Notifications are side effects. Business state is authoritative.
 * OTP belongs to authentication and is never routed through the notification queue.
 */

export * from "./domain";
export * from "./events";
export * from "./templates";
export * from "./preferences";
export * from "./destination";
export * from "./emergency";
export * from "./ports";
export * from "./queue";
export * from "./adapters";
export * from "./errors";
export * from "./otp";
export * from "./email";
