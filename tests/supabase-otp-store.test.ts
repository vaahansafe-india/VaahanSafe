import { afterEach, describe, expect, it, vi } from "vitest";
const rpc=vi.hoisted(()=>vi.fn());
vi.mock("../packages/database/src/repositories/supabase-auth.repository",()=>({getSupabaseAdminClient:()=>({rpc})}));
import { SupabaseOtpRequestStore } from "../packages/database/src/repositories/supabase-otp.repository";
afterEach(()=>vi.resetAllMocks());
describe("Supabase OTP store",()=>{
  it("uses typed RPC parameters and rejects ambiguous success",async()=>{
    rpc.mockResolvedValueOnce({data:true,error:null}).mockResolvedValueOnce({data:{success:true},error:null});
    const store=new SupabaseOtpRequestStore();
    const input={id:"request",tokenHash:"token-hash",phoneHash:"phone-hash",ipHash:"ip-hash",surface:"CUSTOMER" as const,channel:"WHATSAPP" as const};
    expect(await store.reserve(input)).toBe(true);
    expect(rpc).toHaveBeenCalledWith("auth_otp_reserve",{p_id:"request",p_token_hash:"token-hash",p_phone_hash:"phone-hash",p_ip_hash:"ip-hash",p_surface:"CUSTOMER",p_channel:"WHATSAPP"});
    expect(await store.reserve(input)).toBe(false);
  });
  it("fails closed on unavailable storage",async()=>{
    rpc.mockResolvedValue({data:null,error:{code:"42501"}});
    await expect(new SupabaseOtpRequestStore().reserve({id:"request",tokenHash:"hash",phoneHash:"hash",ipHash:"hash",surface:"API",channel:"WHATSAPP"})).rejects.toThrow("OTP request storage unavailable");
  });
  it("clears provider references on failed dispatch",async()=>{
    rpc.mockResolvedValue({data:true,error:null});
    expect(await new SupabaseOtpRequestStore().finishDispatch("request",false,"reference")).toBe(true);
    expect(rpc).toHaveBeenCalledWith("auth_otp_finish_dispatch",{p_id:"request",p_success:false,p_request_id:null});
  });
  it("returns only the atomically claimed server challenge",async()=>{
    const row={id:"request",channel:"WHATSAPP",provider_request_id:"reference"};
    rpc.mockResolvedValueOnce({data:[row],error:null}).mockResolvedValueOnce({data:[],error:null});
    const store=new SupabaseOtpRequestStore(); const input={tokenHash:"hash",phoneHash:"hash",surface:"ACTIVATE" as const};
    expect(await store.claimVerification(input)).toEqual(row);
    expect(await store.claimVerification(input)).toBeNull();
  });
});
