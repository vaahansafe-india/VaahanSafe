import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  query: vi.fn(),
  queryFirst: vi.fn(),
  execute: vi.fn(),
}));
vi.mock("@vaahansafe/database", () => ({
  getAuthoritativeDatabaseClient: () => ({
    query: mocks.query,
    queryFirst: mocks.queryFirst,
    execute: mocks.execute,
  }),
  createInAppNotification: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ getAuthenticatedCustomer: mocks.auth }));
vi.mock("../apps/customer/lib/session", () => ({
  getAuthenticatedCustomer: mocks.auth,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/contacts-service", async () => await import("../apps/customer/lib/contacts-service"));
import { getReusableContacts } from "../apps/customer/lib/reusable-contacts";
import { getReusableContactsAction } from "../apps/customer/lib/reusable-contacts-actions";
import { addSafetyContactAction } from "../apps/customer/lib/contacts-actions";
import { POST as saveVehicleContact } from "../apps/customer/app/api/vehicles/[vehicleId]/contacts/route";
import type { DatabaseClient } from "../packages/database/src/client/d1";

const account = {
  user: { id: "owner_session", name: "Owner" },
  phoneVerified: true,
};
const input = {
  name: "Family contact",
  phone: "+91 9876543210",
  relationshipLabel: "Sibling",
  role: "SIBLING" as const,
  vehicleIds: ["vehicle_destination"],
  allowCall: false,
  allowMessage: true,
  isPubliclyAvailable: false,
};
beforeEach(() => {
  mocks.auth.mockReset().mockResolvedValue(account);
  mocks.query.mockReset();
  mocks.queryFirst.mockReset();
  mocks.execute
    .mockReset()
    .mockResolvedValue({ success: true, rowsAffected: 1 });
});
describe("Saved emergency contact reuse", () => {
  it("denies unsigned and unverified accounts before listing any private contacts", async () => {
    for (const auth of [null, { ...account, phoneVerified: false }]) {
      mocks.auth.mockResolvedValueOnce(auth);
      expect(await getReusableContactsAction()).toHaveProperty("error");
    }
    expect(mocks.query).not.toHaveBeenCalled();
  });
  it("queries only session-owned, current vehicles and keeps source vehicle permissions separate", async () => {
    const row = {
      id: "contact_a",
      name: "Family contact",
      phone: "+919876543210",
      relationship_label: "Sibling",
      vehicle_id: "vehicle_a",
      registration_number: "AP20EF2345",
      make: "Hyundai",
      model: "Creta",
      is_enabled: 0,
      allow_call: 0,
      allow_message: 1,
    };
    mocks.query.mockResolvedValue([
      row,
      {
        ...row,
        id: "contact_b",
        phone: "9876543210",
        vehicle_id: "vehicle_b",
        allow_call: 1,
        allow_message: 0,
      },
    ]);
    const result = await getReusableContacts(
      { query: mocks.query } as unknown as DatabaseClient,
      account.user.id,
    );
    expect(mocks.query.mock.calls[0]![1]).toEqual([account.user.id]);
    expect(mocks.query.mock.calls[0]![0]).toContain("v.deleted_at IS NULL");
    expect(result[0]).toMatchObject({
      linkedVehicleIds: ["vehicle_a", "vehicle_b"],
      isEnabled: false,
      allowCall: false,
      allowMessage: true,
    });
    expect(result[1]).toMatchObject({ allowCall: true, allowMessage: false });
    expect(result[0]!.maskedPhone).not.toContain("9876543210");
    expect(result[0]!.sourceVehicleLabel).toContain("Creta");
  });
  it("returns a recoverable service error without exposing private database details", async () => {
    mocks.query.mockRejectedValue(new Error("internal secret detail"));
    const result = await getReusableContactsAction();
    expect(result).toHaveProperty("error");
    expect(result).not.toHaveProperty("contacts");
    expect(result.error).not.toContain("internal secret");
  });
  it("rejects a foreign destination before changing contacts", async () => {
    mocks.query.mockResolvedValue([{ id: "vehicle_destination" }]);
    const result = await addSafetyContactAction({
      ...input,
      vehicleIds: ["vehicle_destination", "foreign_vehicle"],
    });
    expect(result.success).toBe(false);
    expect(mocks.execute).not.toHaveBeenCalled();
  });
  it("preserves an existing association and primary priority when that number is already linked", async () => {
    mocks.query.mockResolvedValue([{ id: "vehicle_destination" }]);
    mocks.queryFirst
      .mockResolvedValueOnce({ id: "profile_destination" })
      .mockResolvedValueOnce({ id: "already_linked" });
    expect(
      (await addSafetyContactAction({ ...input, isPrimary: true })).success,
    ).toBe(true);
    expect(mocks.execute).not.toHaveBeenCalled();
  });
  it("creates a separate contact record for the destination with the explicitly reviewed permissions", async () => {
    mocks.query.mockResolvedValue([{ id: "vehicle_destination" }]);
    mocks.queryFirst
      .mockResolvedValueOnce({ id: "profile_destination" })
      .mockResolvedValueOnce(null);
    expect((await addSafetyContactAction(input)).success).toBe(true);
    expect(mocks.execute).toHaveBeenCalledTimes(1);
    const [sql, params] = mocks.execute.mock.calls[0]!;
    expect(sql).toContain("INSERT INTO emergency_contacts");
    expect(params.slice(1, 9)).toEqual([
      "profile_destination",
      "Family contact",
      "Sibling",
      "9876543210",
      2,
      0,
      0,
      1,
    ]);
    expect(sql).not.toContain("UPDATE");
  });
  it("rejects a duplicate phone in the vehicle API without changing the original", async () => {
    mocks.queryFirst.mockResolvedValueOnce({ id: "vehicle_destination" }).mockResolvedValueOnce({ id: "profile_destination" }).mockResolvedValueOnce({ id: "existing_contact" });
    const response = await saveVehicleContact(new NextRequest("https://app.vaahansafe.com/api/vehicles/vehicle_destination/contacts", { method: "POST", body: JSON.stringify({ name: input.name, phone: input.phone }) }), { params: Promise.resolve({ vehicleId: "vehicle_destination" }) });
    expect(response.status).toBe(409); expect(mocks.execute).not.toHaveBeenCalled();
  });
  it("keeps disabled public visibility and action permissions when saving a copied vehicle contact", async () => {
    mocks.queryFirst.mockResolvedValueOnce({ id: "vehicle_destination", registration_number: "AP20EF2345" }).mockResolvedValueOnce({ id: "profile_destination" }).mockResolvedValueOnce(null).mockResolvedValueOnce({ total: 0 });
    const response = await saveVehicleContact(new NextRequest("https://app.vaahansafe.com/api/vehicles/vehicle_destination/contacts", { method: "POST", body: JSON.stringify({ name: input.name, phone: input.phone, relationship: "Sibling", priority: 2, isEnabled: false, allowCall: false, allowMessage: true }) }), { params: Promise.resolve({ vehicleId: "vehicle_destination" }) });
    expect(response.status).toBe(200);
    const [, params] = mocks.execute.mock.calls[0]!;
    expect(params.slice(1, 9)).toEqual(["profile_destination", "Family contact", "Sibling", "9876543210", 2, 0, 0, 1]);
  });
});
