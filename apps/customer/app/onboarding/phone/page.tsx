import type { Metadata } from "next";
import * as React from "react";
import { AuthShell } from "../../../components/auth/AuthShell";

export const metadata: Metadata = {
  title: "Verify Mobile Number — VaahanSafe",
  description: "Verify your mobile number to complete your vehicle safety identity.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function OnboardingPhonePage({
  searchParams,
}: {
  searchParams?: Promise<{ returnUrl?: string }>;
}) {
  const params = await searchParams;
  return <AuthShell returnUrl={params?.returnUrl || "/dashboard"} />;
}
