import { describe, it, expect } from "vitest";
import {
  NOTIFICATION_EVENT_TYPES,
  DedupeKeys,
  EVENT_CATALOG,
  getEventCatalogEntry,
  listAllEventCatalogEntries,
  getTemplateDefinition,
  renderTemplate,
  escapeHtml,
  TemplateValidationError,
} from "@vaahansafe/notifications";

describe("Notification Domain Foundation", () => {
  describe("Event Catalog & Dedupe Keys", () => {
    it("should list all 10 canonical event types", () => {
      expect(NOTIFICATION_EVENT_TYPES).toHaveLength(10);
      expect(NOTIFICATION_EVENT_TYPES).toContain("ACCOUNT_WELCOME");
      expect(NOTIFICATION_EVENT_TYPES).toContain("QR_ACTIVATED");
      expect(NOTIFICATION_EVENT_TYPES).toContain("PAYMENT_SUCCEEDED");
      expect(NOTIFICATION_EVENT_TYPES).toContain("SUBSCRIPTION_RENEWED");
      expect(NOTIFICATION_EVENT_TYPES).toContain("SUBSCRIPTION_RENEWAL_FAILED");
      expect(NOTIFICATION_EVENT_TYPES).toContain("SHIPMENT_UPDATED");
      expect(NOTIFICATION_EVENT_TYPES).toContain("REPLACEMENT_APPROVED");
      expect(NOTIFICATION_EVENT_TYPES).toContain("EMERGENCY_SCAN_ALERT");
      expect(NOTIFICATION_EVENT_TYPES).toContain("SECURITY_CHANGED");
      expect(NOTIFICATION_EVENT_TYPES).toContain("SUPPORT_UPDATED");
    });

    it("should strictly exclude OTP from NotificationEvent catalog", () => {
      expect((NOTIFICATION_EVENT_TYPES as readonly string[]).includes("OTP")).toBe(false);
      expect((NOTIFICATION_EVENT_TYPES as readonly string[]).includes("MOBILE_OTP")).toBe(false);
      expect((NOTIFICATION_EVENT_TYPES as readonly string[]).includes("OTP_REQUESTED")).toBe(false);
    });

    it("should generate deterministic dedupe keys without PII", () => {
      const qrDedupe = DedupeKeys.qrActivated("assign_123");
      expect(qrDedupe).toBe("qr-activated:assign_123");

      const payDedupe = DedupeKeys.paymentSuccess("pay_456");
      expect(payDedupe).toBe("payment-success:pay_456");

      const renewalDedupe = DedupeKeys.subscriptionRenewed("subev_789");
      expect(renewalDedupe).toBe("renewal:subev_789");

      const securityDedupe = DedupeKeys.securityChanged("audit_001");
      expect(securityDedupe).toBe("security-change:audit_001");

      const scanDedupe = DedupeKeys.emergencyScanAlert("veh_999", 900, 1700000000000);
      const expectedBucket = Math.floor(1700000000000 / (900 * 1000));
      expect(scanDedupe).toBe(`scan-alert:veh_999:${expectedBucket}`);

      // Ensure no phone numbers or emails exist in dedupe keys
      expect(qrDedupe).not.toMatch(/\+91|@/);
      expect(payDedupe).not.toMatch(/\+91|@/);
    });

    it("should retrieve valid metadata for each catalog entry", () => {
      const entries = listAllEventCatalogEntries();
      expect(entries).toHaveLength(10);

      for (const entry of entries) {
        const retrieved = getEventCatalogEntry(entry.eventType);
        expect(retrieved.displayName).toBeDefined();
        expect(retrieved.templateKey).toBeDefined();
        expect(retrieved.category).toBeDefined();
        expect(retrieved.defaultPriority).toBeDefined();
      }
    });
  });

  describe("Template Registry & Safe Rendering", () => {
    it("should render QR_ACTIVATED_V1 template safely", () => {
      const tpl = getTemplateDefinition("QR_ACTIVATED_V1");
      expect(tpl).toBeDefined();

      const rendered = renderTemplate(tpl, {
        publicId: "7F3K9021",
        vehicleRegMasked: "DL-01-**-1234",
      });

      expect(rendered.inApp.title).toBe("QR Sticker Activated");
      expect(rendered.inApp.body).toContain("7F3K9021");
      expect(rendered.inApp.actionType).toBe("VIEW_QR");
      expect(rendered.inApp.actionTarget).toBe("7F3K9021");

      expect(rendered.whatsApp.templateName).toBe("vhn_qr_activated_v1");
      expect(rendered.whatsApp.parameters.public_id).toBe("7F3K9021");

      expect(rendered.email.subject).toContain("DL-01-**-1234");
      expect(rendered.email.html).toContain("7F3K9021");
      expect(rendered.email.text).toContain("7F3K9021");
    });

    it("should reject rendering if required template variables are missing", () => {
      const tpl = getTemplateDefinition("PAYMENT_SUCCESS_V1");

      expect(() => {
        renderTemplate(tpl, {
          orderId: "ord_1",
          // missing orderNumber, amountDisplay, paymentId
        });
      }).toThrow(TemplateValidationError);
    });

    it("should escape HTML entities to prevent malicious markup injection / XSS", () => {
      const rawMalicious = "<script>alert('pwned');</script> & \"hello\" 'world'";
      const escaped = escapeHtml(rawMalicious);

      expect(escaped).not.toContain("<script>");
      expect(escaped).toContain("&lt;script&gt;");
      expect(escaped).toContain("&amp;");
      expect(escaped).toContain("&quot;hello&quot;");
      expect(escaped).toContain("&#039;world&#039;");

      const tpl = getTemplateDefinition("ACCOUNT_WELCOME_V1");
      const rendered = renderTemplate(tpl, {
        displayName: "<img src=x onerror=alert(1)>",
        accountCreatedDate: "2026-09-17",
      });

      expect(rendered.email.html).not.toContain("<img src=x onerror=alert(1)>");
      expect(rendered.email.html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    });

    it("should render non-alarming copy for EMERGENCY_SCAN_ALERT_V1", () => {
      const tpl = getTemplateDefinition("EMERGENCY_SCAN_ALERT_V1");
      const rendered = renderTemplate(tpl, {
        vehicleMaskedReg: "KA-01-**-5678",
        scannedAtFormatted: "10:30 AM IST",
        approximateLocation: "Indiranagar, Bangalore",
      });

      // Must never claim "Your vehicle is in an accident"
      expect(rendered.inApp.body).toContain("was scanned");
      expect(rendered.inApp.body).not.toContain("accident");
      expect(rendered.email.text).toContain("A scan alone does not indicate an accident");
    });
  });
});
