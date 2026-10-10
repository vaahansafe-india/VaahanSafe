export default function BatchesLoading() {
  return (
    <div className="batches-workspace" aria-busy="true">
      <header className="batches-header">
        <div>
          <div style={{ width: 140, height: 12, background: "#eae8dd", borderRadius: 4, marginBottom: 8 }} />
          <div style={{ width: 180, height: 32, background: "#eae8dd", borderRadius: 6, marginBottom: 8 }} />
          <div style={{ width: 260, height: 14, background: "#eae8dd", borderRadius: 4 }} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ width: 90, height: 38, background: "#eae8dd", borderRadius: 6 }} />
          <div style={{ width: 90, height: 38, background: "#eae8dd", borderRadius: 6 }} />
          <div style={{ width: 120, height: 38, background: "#eae8dd", borderRadius: 6 }} />
        </div>
      </header>

      {/* Summary Skeleton */}
      <div className="batches-summary" style={{ opacity: 0.6 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="batches-summary-card">
            <div style={{ width: 70, height: 10, background: "#dedcd0", borderRadius: 3, marginBottom: 8 }} />
            <div style={{ width: 60, height: 26, background: "#dedcd0", borderRadius: 4 }} />
          </div>
        ))}
      </div>

      {/* Grid Skeleton */}
      <div className="batches-body">
        <div className="batches-filter-rail" style={{ minHeight: 380, opacity: 0.6 }} />
        <div className="batches-content-area">
          <div style={{ height: 44, background: "#fbfaf6", border: "1px solid #dedcd0", borderRadius: 7, marginBottom: 16 }} />
          <div style={{ minHeight: 340, background: "#fffefb", border: "1px solid #dedcd0", borderRadius: 8, opacity: 0.6 }} />
        </div>
      </div>
    </div>
  );
}
