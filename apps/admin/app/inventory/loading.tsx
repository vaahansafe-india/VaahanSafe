export default function Loading() {
  return (
    <div
      className="inventory-skeleton"
      role="status"
      aria-label="Loading inventory"
    >
      {[0, 1, 2, 3].map((i) => (
        <div key={i} />
      ))}
      <span className="sr-only">Loading inventory…</span>
    </div>
  );
}
