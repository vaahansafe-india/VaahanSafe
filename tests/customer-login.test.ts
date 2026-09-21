import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const customerAppDir = path.resolve(__dirname, "../apps/customer");
const authComponentsDir = path.resolve(customerAppDir, "components/auth");
const authApiDir = path.resolve(customerAppDir, "app/api/auth");

describe("Centered Customer Login Screen (app.vaahansafe.com/login)", () => {
  describe("01. Architecture & File Structure", () => {
    it("has the /login route entrypoint and metadata", () => {
      const pagePath = path.join(customerAppDir, "app/login/page.tsx");
      expect(fs.existsSync(pagePath)).toBe(true);

      const pageContent = fs.readFileSync(pagePath, "utf-8");
      expect(pageContent).toContain("title: \"Sign in — VaahanSafe\"");
      expect(pageContent).toContain("AuthShell");
    });

    it("implements all required auth components in components/auth", () => {
      const expectedComponents = [
        "AuthShell.tsx",
        "AuthCard.tsx",
        "AuthBrand.tsx",
        "GoogleSignInButton.tsx",
        "MobileSignInForm.tsx",
        "OtpVerificationForm.tsx",
        "AuthProgressRail.tsx",
        "AuthLegalNotice.tsx",
        "AuthIdentityField.tsx",
      ];

      for (const comp of expectedComponents) {
        const compPath = path.join(authComponentsDir, comp);
        expect(fs.existsSync(compPath), `Expected ${comp} to exist`).toBe(true);
      }
    });

    it("implements required auth API route handlers", () => {
      const expectedRoutes = [
        "send-otp/route.ts",
        "verify-otp/route.ts",
        "google/route.ts",
        "session/route.ts",
      ];

      for (const route of expectedRoutes) {
        const routePath = path.join(authApiDir, route);
        expect(fs.existsSync(routePath), `Expected ${route} to exist`).toBe(true);
      }
    });
  });

  describe("02. Layout, Canvas & Card Geometry Constraints", () => {
    it("AuthShell uses 100dvh viewport and zinc background", () => {
      const shellContent = fs.readFileSync(
        path.join(authComponentsDir, "AuthShell.tsx"),
        "utf-8"
      );
      expect(shellContent).toContain("min-h-[100dvh]");
      expect(shellContent).toContain("bg-background");
      expect(shellContent).toContain("AuthIdentityField");
      expect(shellContent).toContain("AuthCard");
      expect(shellContent).toContain("AuthLegalNotice");
    });

    it("AuthCard adheres to the 420-440px desktop width and 16px radius", () => {
      const cardContent = fs.readFileSync(
        path.join(authComponentsDir, "AuthCard.tsx"),
        "utf-8"
      );
      // max-w-[430px] strictly fits the 420-440px requirement
      expect(cardContent).toContain("max-w-[430px]");
      expect(cardContent).toContain("rounded-2xl"); // 16px radius
      expect(cardContent).toContain("border-border");
      expect(cardContent).toContain("bg-card");
    });

    it("AuthIdentityField is decorative with aria-hidden='true' and subtle opacity", () => {
      const identityContent = fs.readFileSync(
        path.join(authComponentsDir, "AuthIdentityField.tsx"),
        "utf-8"
      );
      expect(identityContent).toContain('aria-hidden="true"');
      expect(identityContent).toContain("ALL_CORNERS_PATH");
      expect(identityContent).toContain("VEHICLE_BODY_PATH");
      expect(identityContent).toContain("#cc785c"); // Coral identity point
    });
  });

  describe("03. Typography, Brand Header & Identity Rail", () => {
    it("AuthBrand includes Cormorant Garamond heading and vehicle identity copy", () => {
      const brandContent = fs.readFileSync(
        path.join(authComponentsDir, "AuthBrand.tsx"),
        "utf-8"
      );
      expect(brandContent).toContain("Welcome to VaahanSafe.");
      expect(brandContent).toContain(
        "Sign in to access and manage your vehicle identity."
      );
      expect(brandContent).toContain("VEHICLE IDENTITY");
      expect(brandContent).toContain("font-serif");

      // Critical constraint: Never say "dashboard" or "workspace"
      expect(brandContent.toLowerCase()).not.toContain("dashboard");
      expect(brandContent.toLowerCase()).not.toContain("workspace");
    });

    it("AuthProgressRail displays 01 SIGN IN, 02 VERIFY, 03 IDENTITY", () => {
      const railContent = fs.readFileSync(
        path.join(authComponentsDir, "AuthProgressRail.tsx"),
        "utf-8"
      );
      expect(railContent).toContain("01 SIGN IN");
      expect(railContent).toContain("02 VERIFY");
      expect(railContent).toContain("03 IDENTITY");
      expect(railContent).toContain("#cc785c");
    });
  });

  describe("04. Google & Mobile Form Specifications", () => {
    it("GoogleSignInButton displays Continue with Google with official 4-color SVG", () => {
      const googleContent = fs.readFileSync(
        path.join(authComponentsDir, "GoogleSignInButton.tsx"),
        "utf-8"
      );
      expect(googleContent).toContain("Continue with Google");
      expect(googleContent).toContain("Connecting...");
      expect(googleContent).toContain("#4285F4"); // Google blue
      expect(googleContent).toContain("#34A853"); // Google green
      expect(googleContent).toContain("#FBBC05"); // Google yellow
      expect(googleContent).toContain("#EA4335"); // Google red
    });

    it("MobileSignInForm has +91 prefix, accessible tel input, and Continue button", () => {
      const mobileContent = fs.readFileSync(
        path.join(authComponentsDir, "MobileSignInForm.tsx"),
        "utf-8"
      );
      expect(mobileContent).toContain("+91");
      expect(mobileContent).toContain('type="tel"');
      expect(mobileContent).toContain('inputMode="numeric"');
      expect(mobileContent).toContain("Mobile number");
      expect(mobileContent).toContain("Continue");
      expect(mobileContent).toContain("Sending code...");
    });

    it("OtpVerificationForm implements 6-digit boxes, resend cooldown, and change number", () => {
      const otpContent = fs.readFileSync(
        path.join(authComponentsDir, "OtpVerificationForm.tsx"),
        "utf-8"
      );
      expect(otpContent).toContain("OTP_LENGTH = 6");
      expect(otpContent).toContain("Verify & Continue");
      expect(otpContent).toContain("Resend code");
      expect(otpContent).toContain("Change number");
      expect(otpContent).toContain("one-time-code");
    });
  });

  describe("05. Legal Notices & Out-of-Card Minimalist Footer", () => {
    it("AuthLegalNotice provides terms, privacy, and back to website link", () => {
      const legalContent = fs.readFileSync(
        path.join(authComponentsDir, "AuthLegalNotice.tsx"),
        "utf-8"
      );
      expect(legalContent).toContain("Terms of Service");
      expect(legalContent).toContain("Privacy Policy");
      expect(legalContent).toContain("VAAHANSAFE / VEHICLE SAFETY IDENTITY");
      expect(legalContent).toContain("Back to VaahanSafe");
    });
  });

  describe("06. Middleware & Protected Root Redirection", () => {
    it("apps/customer/middleware.ts guards protected routes and redirects unauthenticated users to /login", () => {
      const middlewarePath = path.resolve(
        __dirname,
        "../apps/customer/middleware.ts"
      );
      expect(fs.existsSync(middlewarePath)).toBe(true);
      const middlewareContent = fs.readFileSync(middlewarePath, "utf-8");
      expect(middlewareContent).toContain("CUSTOMER_SESSION_COOKIE_NAME");
      expect(middlewareContent).toContain("/login");
      expect(middlewareContent).toContain("NextResponse.redirect");
    });

    it("apps/customer/app/page.tsx redirects unauthenticated visitors to /login", () => {
      const pagePath = path.resolve(
        __dirname,
        "../apps/customer/app/page.tsx"
      );
      const pageContent = fs.readFileSync(pagePath, "utf-8");
      expect(pageContent).toContain('redirect("/login")');
      expect(pageContent).not.toContain("Sign In Disabled (Stage 01)");
    });
  });
});
