import { afterEach, describe, expect, it, vi } from "vitest";
import { OtpRequestGuard, serializeOtpCookie } from "../packages/auth/src/otp/request-guard";
afterEach(() => vi.unstubAllEnvs());
const phone = "+919876543210";
function setup() {
  vi.stubEnv("SESSION_SECRET", "unit-test-security-key-at-least-16");
  const db = { execute: vi.fn().mockResolvedValue({success:true,rowsAffected:1}), queryFirst: vi.fn() };
  return { db, guard: new OtpRequestGuard(db,"CUSTOMER"), request: new Request("https://app.vaahansafe.com/api/auth/send-otp",{headers:{"cf-connecting-ip":"192.0.2.1"}}) };
}
describe("D1-owned OTP request guard", () => {
  it("reserves atomically, stores hashes and applies shared phone and IP limits", async () => {
    const {guard,db,request}=setup();
    const result = await guard.reserve(phone,request);
    expect(result.token).toHaveLength(72);
    const [sql,params]=db.execute.mock.calls[0];
    expect(sql).toContain("NOT EXISTS"); expect(sql).toContain("< 5"); expect(sql).toContain("< 20");
    expect(params).not.toContain(phone); expect(params).not.toContain("192.0.2.1"); expect(params).not.toContain(result.token);
    expect(serializeOtpCookie("CUSTOMER",result.token,request)).toContain("HttpOnly; SameSite=Lax; Path=/; Max-Age=300; Secure");
  });
  it("rejects concurrent reservation and uncertain row counts", async () => {
    const {guard,db,request}=setup(); db.execute.mockResolvedValue({success:true,rowsAffected:0});
    await expect(guard.reserve(phone,request)).rejects.toMatchObject({status:429});
  });
  it("never calls MSG91 without a matching server challenge", async () => {
    const {guard,request}=setup(); const verify=vi.fn();
    expect(await guard.verify(phone,request,verify)).toEqual({success:false}); expect(verify).not.toHaveBeenCalled();
  });
  it("claims and consumes a challenge once without saving the code", async () => {
    const {guard,db,request}=setup(); const {token}=await guard.reserve(phone,request);
    db.queryFirst.mockResolvedValueOnce({id:"otp-request",channel:"SMS",provider_request_id:"provider-reference"}).mockResolvedValueOnce(null);
    const verificationRequest=new Request(request.url,{headers:{cookie:`vs_customer_otp=${token}`}});
    const verify=vi.fn().mockResolvedValue({success:true});
    expect(await guard.verify(phone,verificationRequest,verify)).toEqual({success:true});
    expect(await guard.verify(phone,verificationRequest,verify)).toEqual({success:false}); expect(verify).toHaveBeenCalledTimes(1);
    expect(db.execute.mock.calls.at(-1)?.[1][0]).toBe("VERIFIED");
  });
  it("restores retryable challenge state on provider failure", async () => {
    const {guard,db,request}=setup(); const {token}=await guard.reserve(phone,request);
    db.queryFirst.mockResolvedValue({id:"otp-request",channel:"SMS",provider_request_id:"provider-reference"});
    await expect(guard.verify(phone,new Request(request.url,{headers:{cookie:`vs_customer_otp=${token}`}}),async()=>{throw new Error("provider unavailable");})).rejects.toThrow();
    expect(db.execute.mock.calls.at(-1)?.[1][0]).toBe("SENT");
  });
});
