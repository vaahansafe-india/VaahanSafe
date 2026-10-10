"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@vaahansafe/ui";
import { VaahanIcon } from "@vaahansafe/icons";

/** Load through the owner-authorized endpoint, without a public image cache. */
export function ReportPhoto({ url, number }: { url: string; number: number }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading",
  );
  const [attempt, setAttempt] = useState(0);
  const image = useRef<HTMLImageElement>(null);
  const source = attempt
    ? `${url}${url.includes("?") ? "&" : "?"}retry=${attempt}`
    : url;
  useEffect(() => {
    // An image can finish before hydration attaches its load/error handlers.
    if (image.current?.complete)
      setStatus(image.current.naturalWidth > 0 ? "loaded" : "error");
  }, [source]);

  return (
    <figure className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-[4/3] bg-muted/40">
        {status !== "error" && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open finder-shared photo ${number}`}
            aria-hidden={status !== "loaded"}
            tabIndex={status === "loaded" ? 0 : -1}
            className={`absolute inset-0 block focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${status === "loaded" ? "" : "pointer-events-none"}`}
          >
            {/* Keep session cookies on the private route; bypass image optimization. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={image}
              key={attempt}
              src={source}
              alt={`Finder-shared vehicle or parking area photo ${number}`}
              onLoad={() => setStatus("loaded")}
              onError={() => setStatus("error")}
              className={`h-full w-full object-contain ${status === "loaded" ? "opacity-100" : "opacity-0"}`}
            />
          </a>
        )}
        {status === "loading" && (
          <div
            role="status"
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 text-muted-foreground"
          >
            <VaahanIcon
              name="loading-02"
              size={24}
              className="animate-spin motion-reduce:animate-none"
            />
            <p className="text-sm">Loading photo {number}…</p>
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 text-center">
            <VaahanIcon
              name="camera"
              size={28}
              className="text-muted-foreground"
            />
            <p role="status" className="text-sm text-muted-foreground">
              We couldn’t load photo {number} right now.
            </p>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              aria-label={`Retry photo ${number}`}
              onClick={() => {
                setStatus("loading");
                setAttempt((value) => value + 1);
              }}
            >
              Try again
            </Button>
          </div>
        )}
      </div>
      <figcaption className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground">
        <span>Photo {number} · Shared by finder</span>
        {status === "loaded" && <span>Tap to open</span>}
      </figcaption>
    </figure>
  );
}
