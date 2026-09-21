export type AnalyticsEventType =
  | "QR_RESOLVE_SUCCESS"
  | "QR_RESOLVE_NOT_FOUND"
  | "EMERGENCY_CALL_INITIATED"
  | "ACTIVATION_FLOW_STEP"
  | "CHECKOUT_INITIATED";

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  timestamp: string;
  properties?: Record<string, string | number | boolean>;
  anonymousId?: string;
}

export interface IAnalyticsTracker {
  track(event: AnalyticsEvent): Promise<void>;
}

export class ConsoleAnalyticsTracker implements IAnalyticsTracker {
  async track(event: AnalyticsEvent): Promise<void> {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[Analytics] ${event.type}`, event.properties);
    }
  }
}
