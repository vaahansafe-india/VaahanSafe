import { afterEach, describe, expect, it, vi } from "vitest";
import { OtpRequestGuard, serializeOtpCookie } from "../packages/auth/src/otp/request-guard";
afterEach(() => vi.unstubAllEnvs());
const phone = "+919876543210";
function setup() {
  vi.stubEnv("SESSION_SECRET", "unit-test-security-key-at-least-16");
  const store = { reserve: vi.fn().mockResolvedValue(true), finishDispatch: vi.fn().mockResolvedValue(true), claimVerification: vi.fn(), finishVerification: vi.fn().mockResolvedValue(true) };
  return { store, guard: new OtpRequestGuard(store,"CUSTOMER"), request: new Request("https://app.vaahansafe.com/api/auth/send-otp",{headers:{"cf-connecting-ip":"192.0.2.1"}}) };
}
describe("server-owned OTP request guard", () => {
  it("stores only hashes and issues a secure, HttpOnly challenge cookie", async () => {
    const {guard,store,request}=setup();
    const result = await guard.reserve(phone,request,"WHATSAPP");
    expect(result.token).toHaveLength(72);
    const stored=store.reserve.mock.calls[0][0];
    expect(stored).toMatchObject({surface:"CUSTOMER",channel:"WHATSAPP"});
    for(const key of ["tokenHash","phoneHash","ipHash"]) expect(stored[key]).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(stored)).not.toContain(phone);
    expect(JSON.stringify(stored)).not.toContain(result.token);
    expect(serializeOtpCookie("CUSTOMER",result.token,request)).toContain("HttpOnly; SameSite=Lax; Path=/; Max-Age=300; Secure");
  });
  it("fails closed when rate limits deny a reservation or storage is unavailable", async () => {
    const {guard,store,request}=setup(); store.reserve.mockResolvedValueOnce(false).mockRejectedValueOnce(new Error("Database unavailable"));
    await expect(guard.reserve(phone,request)).rejects.toMatchObject({status:429});
    await expect(guard.reserve(phone,request)).rejects.toThrow("Database unavailable");
  });
  it("never calls MSG91 without a matching server challenge", async () => {
    const {guard,request}=setup(); const verify=vi.fn();
    expect(await guard.verify(phone,request,verify)).toEqual({success:false}); expect(verify).not.toHaveBeenCalled();
  });
  it("claims and consumes a challenge once using the stored provider reference", async () => {
    const {guard,store,request}=setup(); const {token}=await guard.reserve(phone,request);
    store.claimVerification.mockResolvedValueOnce({id:"otp-request",channel:"WHATSAPP",provider_request_id:"provider-reference"}).mockResolvedValueOnce(null);
    const verificationRequest=new Request(request.url,{headers:{cookie:`vs_customer_otp=${token}`}});
    const verify=vi.fn().mockResolvedValue({success:true});
    expect(await guard.verify(phone,verificationRequest,verify)).toEqual({success:true});
    expect(await guard.verify(phone,verificationRequest,verify)).toEqual({success:false}); expect(verify).toHaveBeenCalledTimes(1);
    expect(verify).toHaveBeenCalledWith({channel:"WHATSAPP",requestId:"provider-reference"});
    expect(store.finishVerification).toHaveBeenLastCalledWith("otp-request",true);
  });
  it("restores retryable challenge state on provider failure", async () => {
    const {guard,store,request}=setup(); const {token}=await guard.reserve(phone,request);
    store.claimVerification.mockResolvedValue({id:"otp-request",channel:"SMS",provider_request_id:"provider-reference"});
    await expect(guard.verify(phone,new Request(request.url,{headers:{cookie:`vs_customer_otp=${token}`}}),async()=>{throw new Error("provider unavailable");})).rejects.toThrow();
    expect(store.finishVerification).toHaveBeenLastCalledWith("otp-request",false);
  });
  it("uses the platform-verified Vercel IP and ignores user forwarded headers", async()=>{
    const {guard,store,request}=setup(); vi.stubEnv("VERCEL","1");
    await guard.reserve(phone,new Request(request.url,{headers:{"x-vercel-forwarded-for":"192.0.2.2","cf-connecting-ip":"192.0.2.10","x-forwarded-for":"192.0.2.11"}}));
    await guard.reserve(phone,new Request(request.url,{headers:{"x-vercel-forwarded-for":"192.0.2.2","cf-connecting-ip":"192.0.2.20","x-forwarded-for":"192.0.2.21"}}));
    expect(store.reserve.mock.calls[0][0].ipHash).toBe(store.reserve.mock.calls[1][0].ipHash);
  });
});
