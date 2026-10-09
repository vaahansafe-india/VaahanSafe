"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Button, Input, Label, Badge } from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";

interface CloudflareImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  description?: string;
}

export function CloudflareImageUploader({
  value,
  onChange,
  folder = "editorial",
  label = "Featured Cover Image",
  description = "Stored securely in Cloudflare R2 and served via global Cloudflare Edge CDN",
}: CloudflareImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/avif",
        "image/gif",
      ].includes(file.type)
    ) {
      setUploadError("Choose a JPEG, PNG, WebP, AVIF or GIF image.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image size must be less than 10MB.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Cloudflare upload failed.");
      }

      // Authoritative Cloudflare asset URL
      const finalUrl = data.data.cdnUrl || data.data.url;
      onChange(finalUrl);
    } catch (err: unknown) {
      setUploadError(
        err instanceof Error
          ? err.message
          : "Failed to upload image to Cloudflare.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-semibold">{label}</Label>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
        <Badge
          variant="outline"
          className="text-[10px] text-sky-700 bg-sky-50 border-sky-200"
        >
          Cloudflare R2 Bucket
        </Badge>
      </div>

      {value ? (
        <div className="relative border rounded-lg overflow-hidden bg-slate-900 group">
          <div className="relative aspect-video w-full max-h-64 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Uploaded image preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback display if domain DNS not yet globally propagated
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
          <div className="p-3 bg-white border-t flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-mono text-muted-foreground truncate max-w-sm">
              {value}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => onChange("")}
                disabled={isUploading}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-sky-500 bg-sky-50/50"
              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
              <VaahanIcon name="server" size={20} />
            </div>
            <div className="text-sm font-medium">
              {isUploading
                ? "Uploading to Cloudflare R2..."
                : "Click to upload or drag & drop"}
            </div>
            <p className="text-xs text-muted-foreground">
              WEBP, PNG, JPG, or SVG up to 10MB
            </p>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml,image/gif"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
      />

      {/* Manual URL input fallback */}
      <div className="pt-1">
        <Label className="text-xs text-muted-foreground">
          Or paste Cloudflare asset URL directly:
        </Label>
        <div className="flex items-center gap-2 mt-1">
          <Input
            type="url"
            placeholder="https://assets.vaahansafe.com/blog/..."
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="text-xs font-mono h-8"
          />
        </div>
      </div>

      {uploadError && (
        <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
          {uploadError}
        </p>
      )}
    </div>
  );
}
