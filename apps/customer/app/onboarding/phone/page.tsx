import type { Metadata } from "next";
import * as React from "react";
import { redirect } from "next/navigation";
import { getAuthenticatedCustomer } from "../../../lib/session";
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
  const auth = await getAuthenticatedCustomer();

  // If user already has a verified phone, proceed to destination
  if (auth?.user?.phone) {
    redirect(params?.returnUrl || "/dashboard");
  }

  return (
    <AuthShell
      returnUrl={params?.returnUrl || "/dashboard"}
      mode="onboarding"
      userEmail={auth?.user?.email}
      userName={auth?.user?.name}
    />
  );
}
