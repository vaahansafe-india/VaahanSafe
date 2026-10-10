"use client";
import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { VaahanIcon } from "@vaahansafe/icons";
import { pdfLibrary, pdfAssets } from "./pdf";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { VaultIconButton } from "./VaultIconButton";
export function DocumentViewer({
  url,
  mime,
  download,
  title,
  onExpired,
}: {
  url: string;
  mime: string;
  download?: () => void;
  title: string;
  onExpired?: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [width, setWidth] = useState(700);
  const [fullscreen, setFullscreen] = useState(false);
  const menuContainer = fullscreen ? root.current : undefined;
  useEffect(() => {
    if (!root.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(root.current);
    const updateFullscreen = () =>
      setFullscreen(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", updateFullscreen);
    return () => {
      observer.disconnect();
      document.removeEventListener("fullscreenchange", updateFullscreen);
    };
  }, []);
  function fit() {
    setZoom(1);
    setRotation(0);
  }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement === root.current)
        await document.exitFullscreen();
      else await root.current?.requestFullscreen();
    } catch {
      setError("Full screen is unavailable in this browser.");
    }
  }
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setPage(1);
    setPdf(null);
    if (mime !== "application/pdf") return;
    let task:
      | ReturnType<Awaited<ReturnType<typeof pdfLibrary>>["getDocument"]>
      | undefined;
    void pdfLibrary()
      .then((lib) => {
        if (!active) return;
        task = lib.getDocument({
          url,
          ...pdfAssets,
          enableXfa: false,
          disableAutoFetch: true,
        });
        return task.promise;
      })
      .then((doc) => {
        if (active && doc) {
          setPdf(doc);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError(
            "This PDF could not be opened. Try reopening it or download the original.",
          );
          setLoading(false);
        }
      });
    return () => {
      active = false;
      if (task) void task.destroy();
    };
  }, [url, mime]);
  useEffect(() => {
    if (!pdf || !canvas.current) return;
    let active = true;
    let render:
      | ReturnType<Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]>
      | undefined;
    setLoading(true);
    void pdf
      .getPage(page)
      .then((p) => {
        if (!active || !canvas.current) return;
        const base = p.getViewport({ scale: 1, rotation });
        const pageWidth = Math.max(220, Math.min(900, width - 48));
        const viewport = p.getViewport({
          scale: Math.min(3, pageWidth / base.width) * zoom,
          rotation,
        });
        const c = canvas.current;
        const ctx = c.getContext("2d");
        if (!ctx) throw new Error();
        c.width = viewport.width;
        c.height = viewport.height;
        render = p.render({ canvas: c, canvasContext: ctx, viewport });
        return render.promise;
      })
      .then(() => {
        if (active) setLoading(false);
      })
      .catch((e) => {
        if (active && e?.name !== "RenderingCancelledException") {
          setError("Preview unavailable. Open the document again.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
      render?.cancel();
    };
  }, [pdf, page, zoom, rotation, width]);
  return (
    <div
      ref={root}
      className="vault-document-viewer flex min-h-80 flex-col overflow-hidden rounded-md border border-border bg-muted/40"
    >
      <div
        role="group"
        aria-label="Document viewer controls"
        className="flex shrink-0 flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-border bg-background p-2"
      >
        {pdf && (
          <div className="flex items-center">
            <VaultIconButton
              portalContainer={menuContainer}
              icon="chevron-left"
              label="Previous page"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            />
            <span
              aria-live="polite"
              aria-atomic="true"
              className="min-w-10 text-center text-xs tabular-nums"
            >
              {page} / {pdf.numPages}
            </span>
            <VaultIconButton
              portalContainer={menuContainer}
              icon="chevron-right"
              label="Next page"
              disabled={page >= pdf.numPages}
              onClick={() => setPage((p) => p + 1)}
            />
          </div>
        )}
        <div className="flex items-center">
          <VaultIconButton
            portalContainer={menuContainer}
            icon="zoom-out"
            label="Zoom out"
            disabled={zoom <= 0.5}
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Zoom: ${Math.round(zoom * 100)} percent`}
                className="h-11 px-2 text-xs tabular-nums"
              >
                {Math.round(zoom * 100)}%{" "}
                <VaahanIcon name="chevron-down" size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              portalContainer={menuContainer}
              align="center"
              className="w-40"
            >
              <DropdownMenuRadioGroup
                value={String(zoom)}
                onValueChange={(value) => setZoom(Number(value))}
                aria-label="Zoom level"
              >
                {[0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3].map((level) => (
                  <DropdownMenuRadioItem
                    key={level}
                    value={String(level)}
                    className="min-h-11"
                  >
                    {level * 100}%
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="min-h-11" onSelect={fit}>
                <VaahanIcon name="fit-to-screen" />
                Fit to width
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <VaultIconButton
            portalContainer={menuContainer}
            icon="zoom-in"
            label="Zoom in"
            disabled={zoom >= 3}
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <VaultIconButton
              portalContainer={menuContainer}
              icon="adjustments"
              label="View options"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            portalContainer={menuContainer}
            align="end"
            className="w-52"
          >
            <DropdownMenuItem className="min-h-11" onSelect={fit}>
              <VaahanIcon name="fit-to-screen" />
              Fit to width
            </DropdownMenuItem>
            <DropdownMenuItem
              className="min-h-11"
              onSelect={() => setRotation((r) => (r + 90) % 360)}
            >
              <VaahanIcon name="rotate-right" />
              Rotate right
            </DropdownMenuItem>
            <DropdownMenuItem
              className="min-h-11"
              onSelect={() => void toggleFullscreen()}
            >
              <VaahanIcon
                name={fullscreen ? "exit-fullscreen" : "fullscreen"}
              />
              {fullscreen ? "Exit full screen" : "Full screen"}
            </DropdownMenuItem>
            {download && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="min-h-11" onSelect={download}>
                  <VaahanIcon name="download" />
                  Download original
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="vault-preview-body relative min-h-72 flex-1 overflow-auto p-3 sm:p-6">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xs p-6 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-border/80 bg-background shadow-xs mb-3">
              <VaahanIcon
                name="loading-02"
                size={28}
                className="animate-spin text-[#cc785c] motion-reduce:animate-none"
              />
            </div>
            <p className="text-xs sm:text-sm font-medium text-foreground">
              Loading document…
            </p>
          </div>
        )}
        {error ? (
          <div role="alert" className="space-y-3 text-sm">
            <p>{error}</p>
            {onExpired && (
              <Button variant="outline" onClick={onExpired}>
                Reopen document
              </Button>
            )}
          </div>
        ) : mime === "application/pdf" ? (
          <canvas
            ref={canvas}
            aria-label={`${title}, page ${page}`}
            className="mx-auto max-w-none bg-white shadow-sm"
          />
        ) : (
          // Private access must never enter the image optimizer's shared cache.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={title}
            className="mx-auto max-w-full object-contain"
            style={{
              transform: `rotate(${rotation}deg) scale(${zoom})`,
              transformOrigin: "center",
            }}
            onLoad={() => setLoading(false)}
            onError={() => {
              setError("This document access has expired. Open it again.");
              setLoading(false);
            }}
          />
        )}
      </div>
      <p className="border-t border-border p-2 text-xs text-muted-foreground">
        Stored copy · Additional access controls cannot prevent screenshots or
        saving visible content.
      </p>
    </div>
  );
}
