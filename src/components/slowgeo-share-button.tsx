"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";

import { cn } from "@/lib/utils";

type SlowGeoShareButtonProps = {
  title: string;
  text: string;
  url: string;
  label: string;
  copiedLabel?: string;
  copyLabel?: string;
  showCopyFallback?: boolean;
  tone?: "light" | "dark";
  className?: string;
};

function absoluteUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value, window.location.origin).toString();
}

export function SlowGeoShareButton({
  title,
  text,
  url,
  label,
  copiedLabel = "Lenke kopiert",
  copyLabel = "Kopier trådtekst",
  showCopyFallback = false,
  tone = "light",
  className,
}: SlowGeoShareButtonProps) {
  const [status, setStatus] = useState<"idle" | "shared" | "copied" | "failed">("idle");
  const displayedLabel = status === "copied" ? copiedLabel : status === "shared" ? "Delt" : label;
  const Icon = status === "copied" || status === "shared" ? Check : Share2;

  function sharePayload() {
    const shareUrl = absoluteUrl(url);
    return {
      shareUrl,
      fallbackText: `${text}\n${shareUrl}`,
    };
  }

  async function copy() {
    const { fallbackText } = sharePayload();
    if (!navigator.clipboard?.writeText) {
      setStatus("failed");
      return;
    }

    try {
      await navigator.clipboard.writeText(fallbackText);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 2200);
    } catch {
      setStatus("failed");
    }
  }

  async function share() {
    const { shareUrl, fallbackText } = sharePayload();

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: shareUrl });
        setStatus("shared");
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fallbackText);
        setStatus("copied");
      } else {
        setStatus("failed");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fallbackText);
        setStatus("copied");
        return;
      }
      setStatus("failed");
    }

    window.setTimeout(() => setStatus("idle"), 2200);
  }

  return (
    <div className="inline-flex flex-col items-stretch gap-2">
      <button
        type="button"
        onClick={share}
        className={cn(
          "inline-flex h-10 min-w-[128px] items-center justify-center gap-2 rounded px-3 text-sm font-semibold transition",
          tone === "dark"
            ? "border border-white/20 bg-white/10 text-white hover:bg-white/15"
            : "border border-[#d8ded0] bg-white text-[#203c62] hover:border-[#203c62]/35 hover:bg-[#f7f8f5]",
          className,
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
        {displayedLabel}
      </button>
      {showCopyFallback ? (
        <button
          type="button"
          onClick={copy}
          className={cn(
            "inline-flex h-10 min-w-[128px] items-center justify-center gap-2 rounded px-3 text-sm font-semibold transition",
            tone === "dark"
              ? "border border-white/20 bg-transparent text-white hover:bg-white/10"
              : "border border-[#d8ded0] bg-[#f7f8f5] text-[#203c62] hover:border-[#203c62]/35 hover:bg-white",
          )}
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
          {status === "copied" ? copiedLabel : copyLabel}
        </button>
      ) : null}
      {status === "failed" ? (
        <span
          className={cn(
            "text-xs font-semibold",
            tone === "dark" ? "text-[#eadcbd]" : "text-[#8e3030]",
          )}
          aria-live="polite"
        >
          Deling feilet
        </span>
      ) : null}
    </div>
  );
}
