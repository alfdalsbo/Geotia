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
  tone = "light",
  className,
}: SlowGeoShareButtonProps) {
  const [status, setStatus] = useState<"idle" | "shared" | "copied" | "failed">("idle");
  const displayedLabel = status === "copied" ? copiedLabel : status === "shared" ? "Delt" : label;
  const canUseClipboard = typeof navigator !== "undefined" && Boolean(navigator.clipboard);
  const Icon = status === "copied" || status === "shared" ? Check : canUseClipboard ? Share2 : Copy;

  async function share() {
    const shareUrl = absoluteUrl(url);
    const fallbackText = `${text}\n${shareUrl}`;

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
    <div className="inline-flex flex-col items-stretch gap-1">
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
