import React from "react";

export default function ApiIndexPage() {
  return (
    <div style={{ maxWidth: "620px", margin: "3.5rem auto", padding: "0 1rem" }}>
      <main
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E5E0D8",
          borderRadius: "4px", // rounded-sm
          padding: "2.5rem 2.25rem",
          boxShadow: "0 1px 3px rgba(37, 35, 32, 0.03)",
          textAlign: "center",
        }}
      >
        {/* Status Indicator */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.45rem",
            fontSize: "0.76rem",
            fontWeight: 600,
            color: "#275A38",
            backgroundColor: "#EEF5F0",
            border: "1px solid #D6E8DC",
            padding: "3px 10px",
            borderRadius: "3px", // rounded-sm
            marginBottom: "1.25rem",
            letterSpacing: "0.02em",
          }}
        >
          <span>●</span>
          <span>Platform Operational</span>
        </div>

        <div
          style={{
            fontSize: "0.8rem",
            fontWeight: 500,
            color: "#8C867D",
            marginBottom: "0.35rem",
          }}
        >
          v1.0 Production API &bull; <code style={{ color: "#252320", fontWeight: 600 }}>api.vaahansafe.com</code>
        </div>

        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "#252320",
            margin: "0 0 0.75rem 0",
          }}
        >
          VaahanSafe Central API
        </h1>

        <p
          style={{
            fontSize: "0.9rem",
            color: "#6B6760",
            margin: "0 auto 1.75rem auto",
            maxWidth: "460px",
            lineHeight: 1.55,
          }}
        >
          Authoritative edge boundary connecting customer portal, retail activation,
          QR resolver, roadside emergency routing, and fleet operations.
        </p>

        {/* Action Controls */}
        <div
          style={{
            display: "inline-flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "0.65rem",
            marginBottom: "1.75rem",
          }}
        >
          <a
            href="/health"
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: "0.82rem",
              fontWeight: 500,
              color: "#252320",
              backgroundColor: "#FAF9F5",
              border: "1px solid #E0DAD0",
              padding: "6px 14px",
              borderRadius: "3px", // rounded-sm
              textDecoration: "none",
            }}
          >
            Probe Health &rarr;
          </a>
        </div>

        {/* Security Notice */}
        <div
          style={{
            backgroundColor: "#FAF9F6",
            border: "1px solid #EBE6DE",
            borderRadius: "4px", // rounded-sm
            padding: "0.85rem 1rem",
            fontSize: "0.78rem",
            color: "#736B63",
            lineHeight: 1.45,
            textAlign: "left",
          }}
        >
          <strong>Security Notice:</strong> All API operations are strictly scoped to authenticated
          sessions (<code style={{ color: "#252320" }}>vs_session</code>), cryptographic webhook signatures,
          or Cloudflare Turnstile bot challenges. Internal route paths are shielded from public discovery.
        </div>

        {/* Editorial Footer */}
        <footer
          style={{
            marginTop: "2rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid #EFEBE4",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.75rem",
            color: "#8C867D",
          }}
        >
          <span>&copy; {new Date().getFullYear()} VaahanSafe Technologies India Pvt Ltd.</span>
          <span>Cloudflare D1 Authoritative</span>
        </footer>
      </main>
    </div>
  );
}
