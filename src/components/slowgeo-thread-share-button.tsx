"use client";

import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";

import { SlowGeoShareButton } from "@/components/slowgeo-share-button";
import { cn } from "@/lib/utils";

type SlowGeoThreadShareButtonProps = {
  title: string;
  texts: string[];
  url: string;
  label: string;
  copiedLabel?: string;
  copyLabel?: string;
  showCopyFallback?: boolean;
  showPreview?: boolean;
  tone?: "light" | "dark";
  className?: string;
  shareButtonClassName?: string;
};

export function SlowGeoThreadShareButton({
  title,
  texts,
  url,
  label,
  copiedLabel = "Trådtekst kopiert",
  copyLabel = "Kopier trådtekst",
  showCopyFallback = false,
  showPreview = true,
  tone = "light",
  className,
  shareButtonClassName,
}: SlowGeoThreadShareButtonProps) {
  const safeTexts = useMemo(() => texts.map((text) => text.trim()).filter(Boolean), [texts]);
  const [index, setIndex] = useState(0);
  const activeText = safeTexts[index % Math.max(safeTexts.length, 1)] ?? "";

  if (!activeText) return null;

  return (
    <div className={cn("grid gap-2", className)}>
      {showPreview ? (
        <p
          className={cn(
            "max-w-xl rounded border px-3 py-2 text-sm leading-6",
            tone === "dark"
              ? "border-white/15 bg-white/10 text-[#f5ead3]"
              : "border-[#d8ded0] bg-white/70 text-[#4f412b]",
          )}
        >
          {activeText}
        </p>
      ) : null}
      <div className="flex flex-wrap items-start gap-2">
        <SlowGeoShareButton
          title={title}
          text={activeText}
          url={url}
          label={label}
          copiedLabel={copiedLabel}
          copyLabel={copyLabel}
          showCopyFallback={showCopyFallback}
          tone={tone}
          className={shareButtonClassName}
        />
        {safeTexts.length > 1 ? (
          <button
            type="button"
            onClick={() => setIndex((current) => (current + 1) % safeTexts.length)}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2 rounded px-3 text-sm font-semibold transition",
              tone === "dark"
                ? "border border-white/20 bg-transparent text-white hover:bg-white/10"
                : "border border-[#d8ded0] bg-[#f7f8f5] text-[#203c62] hover:border-[#203c62]/35 hover:bg-white",
            )}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Ny trådtekst
          </button>
        ) : null}
      </div>
    </div>
  );
}
