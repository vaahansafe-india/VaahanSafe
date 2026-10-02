"use client";
export default function CustomerError({ reset }: { error: Error; reset: () => void }) {
  return <main className="flex min-h-dvh items-center justify-center bg-background px-6 text-foreground">
    <div className="max-w-md border-t border-border py-7">
      <p className="paper-label">Please try again</p><h1 className="mt-4 font-serif text-4xl">We couldn't load your account right now.</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Please try again in a moment.</p>
      <button onClick={reset} className="paper-action paper-action-primary mt-6">Try again →</button>
    </div>
  </main>;
}
