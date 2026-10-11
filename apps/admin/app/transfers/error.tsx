"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <section className="tr-workspace tr-error" role="alert">
      <h1>Unable to load transfers</h1>
      <p>We couldn&apos;t open this workspace right now. Please try again.</p>
      <button onClick={reset}>Try again</button>
    </section>
  );
}
