"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

interface ArticleShareProps {
  title: string;
  url?: string;
}

export function ArticleShare({ title, url }: ArticleShareProps) {
  const [copied, setCopied] = React.useState(false);
  const [shareUrl, setShareUrl] = React.useState<string>(url || "");

  React.useEffect(() => {
    if (!url && typeof window !== "undefined") {
      setShareUrl(window.location.href);
    }
  }, [url]);

  const handleCopy = async () => {
    try {
      const target = shareUrl || (typeof window !== "undefined" ? window.location.href : "");
      if (target && typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(target);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  const tweetHref = shareUrl
    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`
    : `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}`;

  return (
    <div className="flex items-center gap-3 font-mono text-[10px] text-[#8e8b82]">
      <span>SHARE ESSAY:</span>
      <button
        type="button"
        onClick={handleCopy}
        className="
          inline-flex items-center gap-1.5 rounded-lg border border-[#e6dfd8]
          bg-[#f5f0e8]/50 px-3 py-1.5 uppercase tracking-wider
          text-[#3d3d3a] hover:border-[#cc785c] hover:text-[#cc785c] transition-colors
          dark:border-[#2e2b27] dark:bg-[#1f1e1b] dark:text-[#a09d96] dark:hover:text-[#faf9f5]
        "
        aria-label="Copy link to clipboard"
      >
        <VaahanIcon name="copy" size={12} aria-hidden="true" />
        <span>{copied ? "COPIED" : "COPY LINK"}</span>
      </button>

      <a
        href={tweetHref}
        target="_blank"
        rel="noopener noreferrer"
        className="
          inline-flex items-center gap-1.5 rounded-lg border border-[#e6dfd8]
          bg-[#f5f0e8]/50 px-3 py-1.5 uppercase tracking-wider
          text-[#3d3d3a] hover:border-[#cc785c] hover:text-[#cc785c] transition-colors
          dark:border-[#2e2b27] dark:bg-[#1f1e1b] dark:text-[#a09d96] dark:hover:text-[#faf9f5]
        "
        aria-label="Share on X / Twitter"
      >
        <span>POST</span>
      </a>
    </div>
  );
}
