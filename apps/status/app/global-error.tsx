"use client";

import * as React from "react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#faf9f5",
          color: "#141413",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header
          style={{
            borderBottom: "1px solid #e6dfd8",
            padding: "16px 24px",
            fontFamily: "monospace",
            fontSize: "11px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>VAAHANSAFE / STATUS</span>
          <span style={{ color: "#c64545" }}>ROOT FAULT</span>
        </header>

        <main
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 24px",
          }}
        >
          <div style={{ maxWidth: "560px", width: "100%" }}>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "10px",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "#c64545",
                marginBottom: "16px",
              }}
            >
              ● CRITICAL / 500 &bull; STATUS SURFACE UNAVAILABLE
            </div>

            <h1
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: "36px",
                fontWeight: "normal",
                lineHeight: 1.15,
                margin: "0 0 16px 0",
              }}
            >
              Status surface is currently unavailable.
            </h1>

            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.6,
                color: "#6c6a64",
                margin: "0 0 32px 0",
              }}
            >
              The status reporting surface encountered an isolated failure. Core
              VaahanSafe emergency resolver networks remain independently active.
            </p>

            <button
              type="button"
              onClick={() => reset()}
              style={{
                height: "44px",
                padding: "0 24px",
                borderRadius: "9999px",
                backgroundColor: "#141413",
                color: "#faf9f5",
                border: "none",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
