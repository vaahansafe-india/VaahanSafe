import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
const auth = vi.hoisted(() => vi.fn());
vi.mock("../apps/api/app/v1/_auth", () => ({ requireUserSession: auth }));
import { POST as authorize } from "../apps/api/app/v1/media/uploads/authorize/route";
import { POST as upload } from "../apps/api/app/v1/media/uploads/server/route";
import { POST as complete } from "../apps/api/app/v1/media/uploads/[uploadId]/complete/route";
import { GET as download } from "../apps/api/app/v1/media/[assetId]/download/route";
import { getStorageActor, canAccessStorageOwner } from "../apps/api/app/v1/media/_helpers";

beforeEach(() => {
  auth.mockReset();
  auth.mockResolvedValue(NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 }));
});
const request = () => new Request("https://api.vaahansafe.com/v1/media/uploads/server?actorRole=ADMIN&actorId=owner", {
  method: "POST", headers: { "Content-Type": "application/json", "x-actor-id": "owner", "x-actor-role": "ADMIN" },
  body: JSON.stringify({ actor: { id: "owner", role: "ADMIN" }, dataBase64: "dGVzdA==" }),
});

describe("Media uses authenticated server identity", () => {
  it("rejects forged body, query, and header identities before storage access", async () => {
    expect((await authorize(request())).status).toBe(401);
    expect((await upload(request())).status).toBe(401);
    expect((await complete(request(), { params: Promise.resolve({ uploadId: "asset" }) })).status).toBe(401);
    expect((await download(request(), { params: Promise.resolve({ assetId: "asset" }) })).status).toBe(401);
  });
  it("returns only the server session actor, ignoring claimed administrator identity", async () => {
    auth.mockResolvedValue({ user: { id: "customer", role: "CUSTOMER", phone: "+919876543210" } });
    expect(await getStorageActor(request())).toEqual({ id: "customer", role: "CUSTOMER" });
  });
  it("requires mobile verification before private storage access", async () => {
    auth.mockResolvedValue({ user: { id: "customer", role: "CUSTOMER" } });
    const response = await getStorageActor(request()) as NextResponse;
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { code: "PHONE_REQUIRED" } });
  });
  it("blocks customer access to another profile and administrative owner types", async () => {
    expect(await canAccessStorageOwner("USER", "owner", "customer", "CUSTOMER")).toBe(false);
    expect(await canAccessStorageOwner("USER", "customer", "customer", "CUSTOMER")).toBe(true);
    expect(await canAccessStorageOwner("QR_BATCH", "batch", "customer", "CUSTOMER")).toBe(false);
  });
});
