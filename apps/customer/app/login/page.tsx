import type { Metadata } from "next";
import * as React from "react";
import { AuthShell } from "../../components/auth/AuthShell";

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
  const returnUrl = params?.returnUrl || "/";

  return <AuthShell returnUrl={returnUrl} />;
}
