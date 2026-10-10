"use client";
export default function RetailerError({ reset }: { reset: () => void }) {
  return (
    <section className="dist-workspace">
      <header className="dist-header">
        <h1>Retailers</h1>
      </header>
      <div className="dist-error" role="alert">
        We couldn&apos;t load the retail workspace right now.{" "}
        <button onClick={reset}>Try again</button>
      </div>
    </section>
  );
}
