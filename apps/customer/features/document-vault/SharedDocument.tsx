"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
const Viewer = dynamic(
  () => import("./DocumentViewer").then((m) => m.DocumentViewer),
  { ssr: false },
);
interface ShareInfo {
  title: string;
  expires: string;
  passcode: boolean;
  download: boolean;
}
interface ShareAccess {
  url: string;
  mime: string;
  downloadUrl: string | null;
  expiresAt: string;
  title: string;
}
async function request<T>(action: string, token: string, password = "") {
  const res = await fetch("/api/document-shares/access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, token, password }),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data as T;
}
export function SharedDocument() {
  const [token, setToken] = useState("");
  const [info, setInfo] = useState<ShareInfo | null>(null);
  const [access, setAccess] = useState<ShareAccess | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const value = location.hash.slice(1);
    setToken(value);
    void request<ShareInfo>("info", value)
      .then(setInfo)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (!access) return;
    const timer = setTimeout(
      () => {
        setAccess(null);
        setError(
          "Preview access expired. Open the document again if the shared link is still available.",
        );
      },
      Math.max(0, Date.parse(access.expiresAt) - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [access]);
  async function open() {
    setBusy(true);
    setError("");
    try {
      setAccess(await request<ShareAccess>("open", token, password));
      setPassword("");
    } catch (e) {
      setAccess(null);
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto min-h-screen max-w-5xl space-y-6 px-4 py-8 sm:px-8">
      <header className="border-b border-border pb-5">
        <p className="font-serif text-2xl">VaahanSafe</p>
        <p className="mt-2 text-sm text-muted-foreground">
          A private stored copy has been shared with you.
        </p>
      </header>
      {info && (
        <>
          <h1 className="font-serif text-2xl">{info.title}</h1>
          <p className="text-xs text-muted-foreground">
            Link expires{" "}
            {new Date(info.expires).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
            })}{" "}
            IST · Downloads {info.download ? "allowed" : "disabled"}
          </p>
          {!access && (
            <div className="max-w-sm space-y-4">
              {info.passcode && (
                <label className="grid gap-2 text-sm">
                  Access passcode
                  <Input
                    type="password"
                    autoComplete="off"
                    value={password}
                    maxLength={128}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
              )}
              <Button disabled={busy} onClick={() => void open()}>
                {busy ? "Authorizing…" : "View document"}
              </Button>
            </div>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {access && (
        <Viewer
          title={access.title}
          url={access.url}
          mime={access.mime}
          download={
            access.downloadUrl
              ? () => {
                  const link = document.createElement("a");
                  link.href = access.downloadUrl!;
                  link.rel = "noreferrer";
                  link.click();
                }
              : undefined
          }
          onExpired={() => {
            setAccess(null);
            setError("Open this document again to request fresh access.");
          }}
        />
      )}
      <p className="text-xs text-muted-foreground">
        User-uploaded copy. No government verification is implied. Visible
        content can be saved or photographed.
      </p>
    </main>
  );
}
