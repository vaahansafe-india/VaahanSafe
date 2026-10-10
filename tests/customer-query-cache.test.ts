import { describe, expect, it } from "vitest";
import { customerQuerySearch } from "../apps/customer/lib/customer-query-contract";
import { customerQueryOptions } from "../apps/customer/lib/customer-queries";

describe("Customer query isolation and filters", () => {
  it("separates caches by validated session scope", () => {
    expect(customerQueryOptions("scope-a", "vehicles").queryKey)
      .not.toEqual(customerQueryOptions("scope-b", "vehicles").queryKey);
  });
  it("ignores client account selectors and UI-only settings categories", () => {
    expect(customerQuerySearch("settings", "category=security&userId=another&isPaid=true")).toBe("");
  });
  it("uses identical keys for the same filters in any order", () => {
    expect(customerQueryOptions("scope", "dashboard", "range=7d&vehicle=selected").queryKey)
      .toEqual(customerQueryOptions("scope", "dashboard", "vehicle=selected&range=7d").queryKey);
  });
  it("keeps distinct data filters in separate cache entries", () => {
    expect(customerQueryOptions("scope", "scan-history", "period=7D").queryKey)
      .not.toEqual(customerQueryOptions("scope", "scan-history", "period=30D").queryKey);
  });
  it("keeps a requested finder report in the server query while ignoring account overrides",()=>{
    const params=new URLSearchParams(customerQuerySearch('scan-history','period=90D&report=report_current&userId=another'));
    expect(params.get('report')).toBe('report_current');expect(params.has('userId')).toBe(false);
  });
  it("bounds query search text before sending it to the server", () => {
    expect(new URLSearchParams(customerQuerySearch("notifications", `q=${"x".repeat(1000)}`)).get("q")?.length).toBe(200);
  });
  it("keeps financial and entitlement displays fresh", () => {
    expect(customerQueryOptions("scope", "payments").staleTime).toBe(5_000);
    expect(customerQueryOptions("scope", "qr").staleTime).toBe(5_000);
    expect(customerQueryOptions("scope", "vehicles").staleTime).toBe(30_000);
  });
});
