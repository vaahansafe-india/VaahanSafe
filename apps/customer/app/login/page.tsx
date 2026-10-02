import type { Metadata } from "next";
import * as React from "react";
import { redirect } from "next/navigation";
import { AuthShell } from "../../components/auth/AuthShell";
import { getAuthenticatedCustomer } from "../../lib/session";
import { safeReturnUrl } from "@/lib/auth-navigation";

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
  const returnUrl = safeReturnUrl(params?.returnUrl);

  // An already validated Supabase server session can enter the account.
  const auth = await getAuthenticatedCustomer();
  if (auth) {
    redirect(returnUrl);
  }

  return <AuthShell returnUrl={returnUrl} />;
}
