import { describe, it, expect } from "vitest";
import {
  adminCredentials,
  isAdminWorkEmail,
} from "../apps/admin/lib/password-policy";

describe("Admin credential boundary", () => {
  it("normalizes email while preserving the exact password", () => {
    expect(
      adminCredentials({
        email: " Admin@VaahanSafe.com ",
        password: "  Secret passphrase  ",
      }),
    ).toEqual({
      email: "admin@vaahansafe.com",
      password: "  Secret passphrase  ",
    });
  });
  it("rejects missing, non-string and malformed credentials", () => {
    for (const body of [
      null,
      {},
      { email: "bad", password: "secret" },
      { email: "a@b.com", password: "" },
      { email: "a@b.com", password: 123456 },
      { email: ["a@b.com"], password: "secret" },
    ])
      expect(adminCredentials(body)).toBeNull();
  });
  it("rejects oversized inputs and ignores client claims of authority", () => {
    expect(
      adminCredentials({
        email: `${"a".repeat(250)}@b.com`,
        password: "secret",
      }),
    ).toBeNull();
    expect(
      adminCredentials({
        email: "a@vaahansafe.com",
        password: "x".repeat(129),
      }),
    ).toBeNull();
    expect(
      adminCredentials({
        email: "a@vaahansafe.com",
        password: "secret",
        role: "SUPER_ADMIN",
        phoneVerified: true,
      }),
    ).toEqual({ email: "a@vaahansafe.com", password: "secret" });
  });
  it("requires the exact company domain and rejects suffix tricks", () => {
    expect(isAdminWorkEmail(" Admin@VAAHANSAFE.com ")).toBe(true);
    for (const email of [
      "admin@gmail.com",
      "admin@vaahansafe.com.evil.com",
      "admin@evilvaahansafe.com",
      "admin@sub.vaahansafe.com",
      "admin@vaahansafe.com@evil.com",
      "vaahansafe.com@gmail.com",
    ]) {
      expect(isAdminWorkEmail(email)).toBe(false);
      expect(adminCredentials({ email, password: "secret" })).toBeNull();
    }
  });
});
