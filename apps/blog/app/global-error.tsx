"use client";

import * as React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("[Journal Global Error]", error?.digest || error?.message);
    }
  }, [error]);

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
        {/* Minimal masthead */}
        <header
          style={{
            borderBottom: "1px solid #e6dfd8",
            padding: "16px 24px",
            fontFamily: "monospace",
            fontSize: "11px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#141413",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>VAAHANSAFE / JOURNAL</span>
          <span style={{ color: "#c64545" }}>SYSTEM FAULT</span>
        </header>

        {/* Center state */}
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
              ● CRITICAL / 500 • ROOT SYSTEM INTERRUPTED
            </div>

            <div
              style={{
                fontFamily: "monospace",
                fontSize: "48px",
                color: "rgba(20,20,19,0.25)",
                lineHeight: 1,
                marginBottom: "12px",
              }}
            >
              500
            </div>

            <h1
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: "36px",
                fontWeight: "normal",
                lineHeight: 1.15,
                margin: "0 0 24px 0",
              }}
            >
              The Journal couldn&apos;t complete this request.
            </h1>

            {/* Pure SVG Interrupted Signal Rail */}
            <div style={{ margin: "24px 0" }}>
              <svg
                width="100%"
                height="36"
                viewBox="0 0 360 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <text
                  x="0"
                  y="12"
                  fontFamily="monospace"
                  fontSize="9"
                  fill="#141413"
                  fontWeight="bold"
                >
                  REQUEST
                </text>
                <circle cx="56" cy="9" r="4" fill="#cc785c" />
                <line x1="60" y1="9" x2="220" y2="9" stroke="#e6dfd8" strokeWidth="1" />
                <circle cx="224" cy="9" r="4" fill="#c64545" />
                <text
                  x="234"
                  y="12"
                  fontFamily="monospace"
                  fontSize="9"
                  fill="#c64545"
                  fontWeight="bold"
                >
                  PROCESS
                </text>
                <line
                  x1="224"
                  y1="13"
                  x2="244"
                  y2="30"
                  stroke="#c64545"
                  strokeWidth="1.5"
                />
                <text
                  x="250"
                  y="32"
                  fontFamily="monospace"
                  fontSize="9"
                  fill="#c64545"
                  fontWeight="bold"
                >
                  &times; INTERRUPTED
                </text>
              </svg>
            </div>

            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.6,
                color: "#6c6a64",
                margin: "0 0 32px 0",
              }}
            >
              The root application environment encountered an unrecoverable rendering
              event. The browser does not need to reload repeatedly.
              {error?.digest && (
                <span
                  style={{
                    display: "block",
                    marginTop: "8px",
                    fontFamily: "monospace",
                    fontSize: "11px",
                  }}
                >
                  Reference: {error.digest}
                </span>
              )}
            </p>

            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
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

              <a
                href="/"
                style={{
                  fontFamily: "monospace",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#6c6a64",
                  textDecoration: "none",
                }}
              >
                Journal Home →
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
