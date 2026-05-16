"use client";

import Image from "next/image";
import { Expand, X } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { cn } from "@/lib/utils";

type ExpandableImageProps = {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  imageClassName?: string;
  caption?: string;
  priority?: boolean;
  loading?: "eager" | "lazy";
  unoptimized?: boolean;
};

export function ExpandableImage({
  src,
  alt,
  sizes,
  className,
  imageClassName,
  caption,
  priority,
  loading,
  unoptimized,
}: ExpandableImageProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={`Vis større bilde: ${alt}`}
        className={cn("group relative block cursor-zoom-in overflow-hidden border-0 bg-transparent p-0 text-left text-inherit", className)}
        onClick={() => setOpen(true)}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          loading={loading}
          unoptimized={unoptimized}
          className={imageClassName}
        />
        <span className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded border border-[#c49a3c]/60 bg-[#061d2b]/82 text-[#fff7e6] opacity-0 shadow-sm transition group-hover:opacity-100 group-focus-visible:opacity-100">
          <Expand className="h-4 w-4" aria-hidden="true" />
        </span>
      </button>

      {open ? (
        <div
          aria-labelledby={titleId}
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#020b11]/90 p-3 sm:p-6"
          role="dialog"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-6xl rounded border border-[#c49a3c]/55 bg-[#061d2b] p-3 shadow-[0_28px_80px_rgba(0,0,0,0.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div id={titleId} className="sr-only">
              {caption ?? alt}
            </div>
            <button
              type="button"
              aria-label="Lukk større bilde"
              className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded border border-[#c49a3c]/65 bg-[#fff7e6] text-[#062b40] shadow-sm transition hover:bg-white"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="relative h-[78vh] min-h-[360px] w-full">
              <Image
                src={src}
                alt={alt}
                fill
                sizes="96vw"
                unoptimized={unoptimized}
                className="object-contain"
                priority
              />
            </div>
            {caption ? (
              <p className="border-t border-[#c49a3c]/35 px-2 py-3 text-sm font-medium text-[#fff7e6]">
                {caption}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
