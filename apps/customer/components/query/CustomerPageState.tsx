"use client";

import { AuthLoader } from "@/components/auth/AuthLoader";
import { VaahanIcon } from "@vaahansafe/icons";
import { Button } from "@/components/ui/button";

export function CustomerPageLoading() {
  return (
    <div
      className="flex min-h-[35vh] items-center justify-center gap-3 text-sm text-muted-foreground"
      role="status"
    >
      <AuthLoader />
      <span>Loading your information…</span>
    </div>
  );
}

export function CustomerPageError({ retry }: { retry: () => void }) {
  return (
    <div role="alert" className="py-12 text-center">
      <span className="mb-4 inline-flex rounded-xl bg-[#f3e5da] p-3 text-[#a9583e]">
        <VaahanIcon name="warning" size={28} />
      </span>
      <h1 className="font-serif text-3xl">We couldn't load this page.</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Please try again in a moment.
      </p>
      <Button
        type="button"
        onClick={retry}
        className="mt-5 bg-[#252320] text-[#faf9f5] hover:bg-[#3a3833]"
      >
        <VaahanIcon name="refresh" size={16} />
        Try again
      </Button>
    </div>
  );
}
