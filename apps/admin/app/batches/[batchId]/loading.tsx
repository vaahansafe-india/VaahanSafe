export default function BatchDetailLoading() {
  return (
    <div className="batches-workspace batches-full-detail" aria-busy="true">
      <div style={{ width: 80, height: 14, background: "#eae8dd", borderRadius: 4, marginBottom: 16 }} />
      <div style={{ height: 60, background: "#fffefb", border: "1px solid #dedcd0", borderRadius: 8, marginBottom: 20 }} />
      <div style={{ height: 80, background: "#fbfaf6", border: "1px solid #dedcd0", borderRadius: 8, marginBottom: 20 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        <div style={{ height: 320, background: "#fffefb", border: "1px solid #dedcd0", borderRadius: 8 }} />
        <div style={{ height: 320, background: "#fffefb", border: "1px solid #dedcd0", borderRadius: 8 }} />
      </div>
    </div>
  );
}
