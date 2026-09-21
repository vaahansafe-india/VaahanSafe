export default function ApiIndexPage() {
  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>VaahanSafe Central API (api.vaahansafe.com)</h1>
      <p style={{ fontSize: "0.875rem", color: "#94a3b8", marginBottom: "1.5rem" }}>
        Port 3005 &bull; Stage 01 Core API Surface
      </p>
      <div style={{ border: "1px solid #334155", borderRadius: "8px", padding: "1rem", backgroundColor: "#1e293b" }}>
        <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem" }}>
          Active Stage 01 Endpoints:
        </p>
        <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.875rem" }}>
          <li>
            <a href="/health" style={{ color: "#38bdf8", textDecoration: "none" }}>
              GET /health
            </a>{" "}
            &rarr; <code>{`{ "service": "vaahansafe-api", "status": "ok" }`}</code>
          </li>
        </ul>
      </div>
    </div>
  );
}
