import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  getIndianStates,
  getDistrictsForState,
  matchIndianState,
  matchDistrict,
  lookupStateFromPincode,
  INDIAN_STATES_DATA,
} from "../apps/customer/lib/india-states-districts";

describe("Shipping Address Location Detection & Searchable Cascading Selectors", () => {
  describe("01. Indian States & Union Territories Master Data", () => {
    it("contains all 28 Indian States and 8 Union Territories (36 jurisdictions)", () => {
      const states = getIndianStates();
      expect(states.length).toBe(36);
      expect(states).toContain("Maharashtra");
      expect(states).toContain("Karnataka");
      expect(states).toContain("Delhi");
      expect(states).toContain("Tamil Nadu");
      expect(states).toContain("Uttar Pradesh");
      expect(states).toContain("Gujarat");
      expect(states).toContain("Telangana");
      expect(states).toContain("Kerala");
      expect(states).toContain("West Bengal");
    });

    it("ensures every state has valid district entries", () => {
      INDIAN_STATES_DATA.forEach((s) => {
        expect(s.code).toBeTruthy();
        expect(s.name).toBeTruthy();
        expect(s.districts.length).toBeGreaterThan(0);
      });
    });

    it("returns districts specific to Maharashtra", () => {
      const districts = getDistrictsForState("Maharashtra");
      expect(districts).toContain("Pune");
      expect(districts).toContain("Mumbai City");
      expect(districts).toContain("Mumbai Suburban");
      expect(districts).toContain("Nagpur");
      expect(districts).toContain("Nashik");
      expect(districts).toContain("Thane");
      expect(districts).not.toContain("Bengaluru Urban");
    });

    it("returns districts specific to Karnataka", () => {
      const districts = getDistrictsForState("Karnataka");
      expect(districts).toContain("Bengaluru Urban");
      expect(districts).toContain("Mysuru (Mysore)");
      expect(districts).not.toContain("Pune");
    });
  });

  describe("02. Fuzzy Matching & Offline Pincode Prefix Resolution", () => {
    it("fuzzy matches state names case-insensitively and with extra whitespace", () => {
      expect(matchIndianState("maharashtra")).toBe("Maharashtra");
      expect(matchIndianState("  DELHI  ")).toBe("Delhi");
      expect(matchIndianState("Karnataka")).toBe("Karnataka");
      expect(matchIndianState("Unknown Land")).toBeNull();
    });

    it("fuzzy matches district names within a state", () => {
      expect(matchDistrict("Maharashtra", "pune")).toBe("Pune");
      expect(matchDistrict("Maharashtra", "thane")).toBe("Thane");
      expect(matchDistrict("Karnataka", "bengaluru urban")).toBe("Bengaluru Urban");
    });

    it("resolves state from postal PIN code prefix", () => {
      expect(lookupStateFromPincode("110001")).toBe("Delhi");
      expect(lookupStateFromPincode("400050")).toBe("Maharashtra");
      expect(lookupStateFromPincode("411045")).toBe("Maharashtra");
      expect(lookupStateFromPincode("560001")).toBe("Karnataka");
      expect(lookupStateFromPincode("600001")).toBe("Tamil Nadu");
      expect(lookupStateFromPincode("380001")).toBe("Gujarat");
      expect(lookupStateFromPincode("700001")).toBe("West Bengal");
      expect(lookupStateFromPincode("000000")).toBeNull();
    });
  });

  describe("03. SearchableCombobox Component Architecture", () => {
    it("defines the SearchableCombobox with search input, keyboard navigation, and custom entry support", () => {
      const filePath = path.resolve(
        __dirname,
        "../apps/customer/components/ui/searchable-combobox.tsx"
      );
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("export function SearchableCombobox");
      expect(content).toContain("searchQuery");
      expect(content).toContain("filteredOptions");
      expect(content).toContain("handleKeyDown");
      expect(content).toContain("allowCustom");
    });
  });

  describe("04. NewOrderCheckout Integration", () => {
    it("integrates auto-location detection, landmark auto-fill, and searchable State & District comboboxes", () => {
      const filePath = path.resolve(
        __dirname,
        "../apps/customer/app/(app)/orders/new/NewOrderCheckout.tsx"
      );
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("handleDetectLocation");
      expect(content).toContain("LocateFixed");
      expect(content).toContain("Use Current Location");
      expect(content).toContain("handlePostalCodeChange");
      expect(content).toContain("SearchableCombobox");
      expect(content).toContain("allStates");
      expect(content).toContain("districtOptions");
      expect(content).toContain("resolvePincodeData");
      expect(content).toContain("res.landmark");
      expect(content).toContain("setLandmark(res.landmark)");
      expect(content).toContain("h-9 sm:h-10");
      expect(content).not.toContain("h-8.5");
      expect(content).not.toContain("Secure Gateway:");
      expect(content).not.toContain("Razorpay 256-Bit SSL");
    });

    it("verifies ReverseGeocodeResult contract includes landmark field", () => {
      const filePath = path.resolve(
        __dirname,
        "../apps/customer/lib/india-states-districts.ts"
      );
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("landmark?: string;");
      expect(content).toContain("poiCandidate");
      expect(content).toContain("Near ");
    });

    it("ensures actions.ts resiliently provisions standard products when D1 catalog is empty", () => {
      const actionsPath = path.resolve(
        __dirname,
        "../apps/customer/app/(app)/orders/new/actions.ts"
      );
      const content = fs.readFileSync(actionsPath, "utf-8");

      expect(content).toContain("prod_qr_sticker_kit");
      expect(content).toContain("PROD_QR_STICKER_INDIVIDUAL");
      expect(content).toContain("INSERT OR IGNORE INTO products");
    });
  });
});
