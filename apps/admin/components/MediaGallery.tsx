"use client";
import { useState } from "react";
import Image from "next/image";
import { VaahanIcon } from "@vaahansafe/icons";
import type { AdminRow } from "../lib/contracts";
import { CloudflareImageUploader } from "./CloudflareImageUploader";
export function MediaGallery({
  rows,
  onUpload,
}: {
  rows: AdminRow[];
  onUpload: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  return (
    <div className="admin-media-section">
      <div className="admin-panel-head">
        <div>
          <h2>Media library</h2>
          <p>Public images delivered from Cloudflare R2</p>
        </div>
        <button
          type="button"
          className="admin-button"
          onClick={() => setUploading((v) => !v)}
        >
          <VaahanIcon name="plus" size={14} />
          {uploading ? "Close upload" : "Upload image"}
        </button>
      </div>
      {uploading && (
        <div className="admin-panel-body">
          <CloudflareImageUploader
            label="Add to the media library"
            onChange={() => {
              onUpload();
              setUploading(false);
            }}
          />
        </div>
      )}
      {!!rows.length && (
        <div className="admin-media-grid">
          {rows.map((row) => (
            <figure key={String(row.id)}>
              {row.public_url && String(row.mime_type).startsWith("image/") ? (
                <a
                  href={String(row.public_url)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Image
                    unoptimized
                    width={400}
                    height={280}
                    loading="lazy"
                    src={String(row.public_url)}
                    alt={String(
                      row.alt_text || row.original_filename || "Media asset",
                    )}
                  />
                </a>
              ) : (
                <div className="admin-media-placeholder">
                  <VaahanIcon name="file" size={24} />
                  <span>
                    {row.visibility === "PRIVATE"
                      ? "Private asset"
                      : "Preview unavailable"}
                  </span>
                </div>
              )}
              <figcaption>
                <strong>
                  {String(row.original_filename || "Untitled asset")}
                </strong>
                <span>
                  {String(row.mime_type || "File")} ·{" "}
                  {row.size_bytes == null
                    ? "Size unavailable"
                    : `${Math.round(Number(row.size_bytes) / 1024)} KB`}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
