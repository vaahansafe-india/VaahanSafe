import { describe, it, expect } from "vitest";
import { publicMediaPreview } from "../apps/admin/lib/media-preview";
describe("Admin media delivery projection", () => {
  const row = {
    visibility: "PUBLIC",
    status: "READY",
    public_url: "https://assets.vaahansafe.com/editorial/photo.webp",
  };
  it("uses the configured public CDN", () =>
    expect(publicMediaPreview(row, "https://assets.vaahansafe.com")).toBe(
      row.public_url,
    ));
  it.each(["PRIVATE", "UNLISTED"])("withholds %s assets", (visibility) =>
    expect(
      publicMediaPreview(
        { ...row, visibility },
        "https://assets.vaahansafe.com",
      ),
    ).toBeNull(),
  );
  it("withholds unfinished assets", () =>
    expect(
      publicMediaPreview(
        { ...row, status: "PENDING" },
        "https://assets.vaahansafe.com",
      ),
    ).toBeNull());
  it.each([
    "javascript:alert(1)",
    "http://assets.vaahansafe.com/photo.webp",
    "https://evil.example/photo.webp",
    "https://assets.vaahansafe.com.evil.example/photo.webp",
    "https://user:pass@assets.vaahansafe.com/photo.webp",
  ])("rejects unsafe delivery URL %s", (public_url) =>
    expect(
      publicMediaPreview(
        { ...row, public_url },
        "https://assets.vaahansafe.com",
      ),
    ).toBeNull(),
  );
  it("does not guess a CDN when configuration is missing", () =>
    expect(publicMediaPreview(row, undefined)).toBeNull());
  it("honours a configured CDN path boundary", () =>
    expect(
      publicMediaPreview(row, "https://assets.vaahansafe.com/media"),
    ).toBeNull());
});
