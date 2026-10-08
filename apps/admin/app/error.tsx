"use client";
export default function AdminErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="admin-empty">
      <h3>We couldn&apos;t open this workspace right now.</h3>
      <p>Please try again. Your records are kept securely on the server.</p>
      <button
        className="admin-button"
        onClick={reset}
        style={{ marginTop: 20 }}
      >
        Try again
      </button>
    </div>
  );
}
