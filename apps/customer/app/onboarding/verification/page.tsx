import { redirect } from "next/navigation";
import { getAuthenticatedCustomer } from "@/lib/session";
import { safeReturnUrl } from "@/lib/auth-navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { VerificationActions } from "@/components/auth/VerificationActions";

export default async function VerificationChoicePage({ searchParams }: { searchParams: Promise<{ returnUrl?: string }> }) {
  const auth = await getAuthenticatedCustomer();
  if (!auth) redirect("/login");
  const returnUrl = safeReturnUrl((await searchParams).returnUrl);
  if (auth.phoneVerified && auth.googleVerified) redirect(returnUrl);
  const needsPhone = !auth.phoneVerified;
  const verifyUrl = needsPhone
    ? `/onboarding/phone?returnUrl=${encodeURIComponent(returnUrl)}`
    : `/api/auth/google?link=1&returnUrl=${encodeURIComponent(returnUrl)}`;
  return <AuthShell>
    <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-[#325763]">You're signed in</p>
    <h1 className="mt-4 font-serif text-5xl leading-none tracking-tight text-[#1b1c1a]">A little more<br /><em className="text-[#a9583e]">peace of mind.</em></h1>
    <p className="mt-5 text-sm leading-relaxed text-[#615f59]">{needsPhone
      ? "Verify your mobile number with an SMS code for another way to sign in and receive the contact alerts you choose."
      : "Connect your Google account for another way to sign in to this same account."}</p>
    <p className="mt-3 text-sm text-[#615f59]">You can do this now or come back to it later.</p>
    <VerificationActions needsPhone={needsPhone} verifyUrl={verifyUrl} returnUrl={returnUrl} />
    <p className="mt-5 break-all text-xs text-[#77736c]">Signed in as {auth.user.email || auth.user.phone}</p>
  </AuthShell>;
}
