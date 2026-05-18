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
              ? "border-[#c49a3c]/60 bg-[#020b11]/60 text-[#f5ead3]"
              : "border-[#c49a3c]/45 bg-[#fff7e6] text-[#4f412b]",
          )}
          style={{ fontFamily: "var(--font-italic)", fontStyle: "italic" }}
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
            className="btn btn-quiet btn-small"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Ny trådtekst
          </button>
        ) : null}
      </div>
    </div>
  );
}
