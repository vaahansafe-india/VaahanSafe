import type { Metadata } from "next";
import * as React from "react";
import { redirect } from "next/navigation";
import { AuthShell } from "../../components/auth/AuthShell";
import { getAuthenticatedCustomer } from "../../lib/session";

export const metadata: Metadata = {
  title: "Sign in — VaahanSafe",
  description: "Sign in to access and manage your vehicle safety identity.",
  robots: {
    index: false,
    follow: false,
  },
};

interface LoginPageProps {
  searchParams?: Promise<{
    returnUrl?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const returnUrl = params?.returnUrl || "/dashboard";

  // If user already has an authoritatively valid session in Cloudflare D1, forward to dashboard
  const auth = await getAuthenticatedCustomer();
  if (auth) {
    redirect(returnUrl.startsWith("/") ? returnUrl : "/dashboard");
  }

  return <AuthShell returnUrl={returnUrl} />;
}

