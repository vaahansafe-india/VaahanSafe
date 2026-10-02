import * as React from "react";
import Image from "next/image";
import { DOMAINS } from "@vaahansafe/config";
import { VaahanSafeLogo } from "@vaahansafe/ui/brand";
import { AuthCard } from "./AuthCard";
import { AuthLegalNotice } from "./AuthLegalNotice";
import { AuthVisualPanel } from "./AuthVisualPanel";

interface AuthShellProps {
  returnUrl?: string;
  mode?: "login" | "onboarding";
  userEmail?: string;
  userName?: string;
  children?: React.ReactNode;
}

export function AuthShell({
  returnUrl,
  mode = "login",
  userEmail,
  userName,
  children,
}: AuthShellProps) {
  const webUrl = DOMAINS.web || "https://vaahansafe.com";

  return (
    <main
      id="main-content"
      className="min-h-[100dvh] bg-[#faf9f5] text-[#1b1c1a] lg:h-[100dvh] lg:overflow-hidden"
      style={{ backgroundImage: "url('/images/auth/paper-texture.webp')", backgroundRepeat: "repeat", backgroundSize: "400px 400px" }}
    >
      <div className="grid min-h-[100dvh] lg:h-full lg:grid-cols-[minmax(0,1fr)_minmax(480px,0.9fr)]">
        <AuthVisualPanel>
          <div className="relative z-10 max-w-[610px] px-10 pt-[clamp(36px,7vh,96px)] xl:px-16">
            <p className="mb-5 flex items-center gap-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a9583e]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" aria-hidden="true" />
              Your vehicle safety identity
            </p>
            <h2 className="font-serif text-[clamp(3.4rem,5.4vw,6.5rem)] font-medium leading-[0.9] tracking-[-0.035em]">
              A clearer way <em className="font-normal text-[#a9583e]">forward.</em>
            </h2>
            <p className="mt-5 max-w-[420px] text-[15px] leading-relaxed text-[#615f59]">
              Manage your vehicle, your safety information, and the contact options you choose to make available.
            </p>
          </div>
          <div className="relative z-0 min-h-0 flex-1" aria-hidden="true">
            <Image src="/images/auth/parking-cars.png" alt="" fill priority draggable={false} sizes="(min-width: 1024px) 55vw, 0px" className="object-contain object-bottom px-4 pb-12 xl:px-8" />
          </div>
          <div className="relative z-10 mx-10 mb-[clamp(20px,4vh,52px)] flex items-center gap-4 border-t border-[#cfc6ba] pt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#615f59] xl:mx-16">
            <span>One vehicle</span><span className="h-px w-6 bg-[#cc785c]" aria-hidden="true" /><span>One identity</span>
          </div>
        </AuthVisualPanel>

        <div className="flex min-h-[100dvh] flex-col px-6 sm:px-10 lg:h-full lg:min-h-0 xl:px-16">
          <header className="flex min-h-[clamp(64px,10vh,88px)] items-center justify-between gap-4 border-b border-[#e2dcd2]">
            <a href={webUrl} aria-label="VaahanSafe home" className="inline-flex shrink-0 items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#cc785c]">
              <VaahanSafeLogo size="md" variant="brand" showTagline={false} aria-hidden="true" />
            </a>
            <a href={webUrl} className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#615f59] underline-offset-4 hover:text-[#a9583e] hover:underline">
              Back to website <span aria-hidden="true">↗</span>
            </a>
          </header>

          <div className="flex min-h-0 flex-1 items-center justify-center py-[clamp(12px,3vh,40px)]">
            <div className="w-full max-w-[430px]">
              {children || <AuthCard returnUrl={returnUrl} mode={mode} userEmail={userEmail} userName={userName} />}
            </div>
          </div>

          <AuthLegalNotice type="outside-card" />
        </div>
      </div>
    </main>
  );
}
