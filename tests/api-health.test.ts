import { describe, it, expect } from "vitest";
import { GET } from "../apps/api/app/health/route";

describe("API Service Health Endpoint (GET /health)", () => {
  it("should return HTTP 200 with structured JSON { service: 'vaahansafe-api', status: 'ok' }", async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({
      service: "vaahansafe-api",
      status: "ok",
    });
    // Ensure no secrets or sensitive diagnostic dumps are present
    expect(data.env).toBeUndefined();
    expect(data.secrets).toBeUndefined();
  });
});
