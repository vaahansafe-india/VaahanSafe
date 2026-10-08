import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET as healthHandler } from "../apps/api/app/health/route";
import { GET as resolveHandler } from "../apps/api/app/v1/qr/resolve/[publicId]/route";
import { POST as scanHandler } from "../apps/api/app/v1/qr/scan/route";
import { POST as activateHandler } from "../apps/api/app/v1/qr/activate/route";
import { POST as emergencyAlertHandler } from "../apps/api/app/v1/emergency/alert/route";
import { GET as emergencyProfileHandler } from "../apps/api/app/v1/emergency/profile/[publicId]/route";
import { POST as createOrderHandler } from "../apps/api/app/v1/payments/create-order/route";
import { GET as verifyPaymentHandler } from "../apps/api/app/v1/payments/verify/[orderId]/route";
import { GET as adminMetricsHandler } from "../apps/api/app/v1/admin/metrics/route";
import { GET as getBatchesHandler, POST as createBatchHandler } from "../apps/api/app/v1/admin/qr/batches/route";
import { GET as getInventoryHandler } from "../apps/api/app/v1/admin/qr/inventory/route";

describe("Central Backend API (apps/api) — Production Endpoints Suite", () => {
  // ---------------------------------------------------------------------------
  // 1. Health Endpoint
  // ---------------------------------------------------------------------------
  it("GET /health returns HTTP 200 with service identity", async () => {
    const res = await healthHandler();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.service).toBe("vaahansafe-api");
    expect(body.status).toBe("ok");
  });

  // ---------------------------------------------------------------------------
  // 2. QR Resolver & Privacy Safety
  // ---------------------------------------------------------------------------
  it("GET /v1/qr/resolve/:publicId rejects malformed public identifiers with HTTP 400", async () => {
    const req = new NextRequest("https://api.vaahansafe.com/v1/qr/resolve/invalid%20id%20with%20spaces");
    const res = await resolveHandler(req, {
      params: Promise.resolve({ publicId: "bad id!" }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("ERR_INVALID_PUBLIC_ID");
  });

  it("GET /v1/qr/resolve/:publicId returns 404 for non-existent public IDs", async () => {
    const req = new NextRequest("https://api.vaahansafe.com/v1/qr/resolve/NONEXIST99");
    const res = await resolveHandler(req, {
      params: Promise.resolve({ publicId: "NONEXIST99" }),
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.status).toBe("NOT_FOUND");
    // Ensure no internal database keys are leaked
    expect(body.id).toBeUndefined();
    expect(body.user_id).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // 3. Scan Telemetry Logging
  // ---------------------------------------------------------------------------
  it("POST /v1/qr/scan rejects malformed publicId format", async () => {
    const req = new NextRequest("https://api.vaahansafe.com/v1/qr/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId: "??malformed??" }),
    });

    const res = await scanHandler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("ERR_INVALID_PUBLIC_ID");
  });

  // ---------------------------------------------------------------------------
  // 4. Retail Activation Hard Gate
  // ---------------------------------------------------------------------------
  it("POST /v1/qr/activate rejects incomplete payloads with HTTP 400", async () => {
    const req = new NextRequest("https://api.vaahansafe.com/v1/qr/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId: "7F3K9021" }), // Missing scratchCode, vehicleId, userId
    });

    const res = await activateHandler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("ERR_VALIDATION_FAILED");
  });

  it("POST /v1/qr/activate rejects non-existent stickers with HTTP 404", async () => {
    const req = new NextRequest("https://api.vaahansafe.com/v1/qr/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publicId: "NONEXISTENT99",
        scratchCode: "PIN12345",
        vehicleId: "veh_123",
        userId: "usr_123",
      }),
    });

    const res = await activateHandler(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe("ERR_QR_NOT_FOUND");
  });

  // ---------------------------------------------------------------------------
  // 5. Emergency Alerts & Incidents
  // ---------------------------------------------------------------------------
  it("POST /v1/emergency/alert rejects invalid alertType with HTTP 400", async () => {
    const req = new NextRequest("https://api.vaahansafe.com/v1/emergency/alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publicId: "7F3K9021",
        alertType: "UNKNOWN_TYPE_XYZ",
      }),
    });

    const res = await emergencyAlertHandler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("ERR_VALIDATION_FAILED");
  });

  it("GET /v1/emergency/profile/:publicId rejects malformed public identifiers", async () => {
    const req = new NextRequest("https://api.vaahansafe.com/v1/emergency/profile/invalid%20public%20id");
    const res = await emergencyProfileHandler(req, {
      params: Promise.resolve({ publicId: "invalid/id" }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("ERR_INVALID_PUBLIC_ID");
  });

  // ---------------------------------------------------------------------------
  // 6. Commerce & Payments (Rule 08 & Rule 04/09)
  // ---------------------------------------------------------------------------
  it("POST /v1/payments/create-order rejects missing product with HTTP 400", async () => {
    const req = new NextRequest("https://api.vaahansafe.com/v1/payments/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "usr_1" }), // Missing productId
    });

    const res = await createOrderHandler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("ERR_VALIDATION_FAILED");
  });

  it("GET /v1/payments/verify/:orderId returns 404 for unknown order", async () => {
    const req = new NextRequest("https://api.vaahansafe.com/v1/payments/verify/ord_nonexistent_99");
    const res = await verifyPaymentHandler(req, {
      params: Promise.resolve({ orderId: "ord_nonexistent_99" }),
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe("ERR_ORDER_NOT_FOUND");
  });

  // ---------------------------------------------------------------------------
  // 7. Operations & Fleet Metrics
  // ---------------------------------------------------------------------------
  it("GET /v1/admin/metrics returns structured operations summary", async () => {
    const req = new NextRequest("https://api.vaahansafe.com/v1/admin/metrics");
    const res = await adminMetricsHandler(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(typeof body.metrics.totalStickersPrinted).toBe("number");
    expect(typeof body.metrics.activeSubscriptions).toBe("number");
    expect(typeof body.metrics.retailActivations).toBe("number");
    expect(typeof body.metrics.emergencyAlerts24h).toBe("number");
  });

  it("GET /v1/admin/qr/inventory handles pagination parameters safely", async () => {
    const req = new NextRequest("https://api.vaahansafe.com/v1/admin/qr/inventory?page=1&limit=10");
    const res = await getInventoryHandler(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.limit).toBe(10);
  });
});
