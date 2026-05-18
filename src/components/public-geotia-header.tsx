import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { LinkPendingIndicator } from "@/components/link-pending-indicator";

export function PublicGeotiaHeader() {
  return (
    <header className="border-b border-[#c49a3c]/40 bg-[#061d2b]/94 text-[#fff7e6] shadow-[0_10px_30px_rgba(0,0,0,0.22)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <Link href="/" prefetch={false} className="flex min-w-0 items-center gap-3">
          <div className="relative h-12 w-12 flex-none overflow-hidden rounded border border-[#c49a3c]/70 bg-[#efe3c7] shadow-inner">
            <Image
              src="/geotia-assets/geotia-asset-4.png"
              alt="Geotia City"
              fill
              sizes="48px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="break-words text-xs font-semibold uppercase tracking-[0.14em] text-[#e1c06c] sm:tracking-[0.22em]">
              Statsarkivet · rikets embetsverk
            </p>
            <p className="font-display text-2xl font-semibold tracking-normal text-[#fff7e6] sm:text-3xl">
              Geotia
            </p>
          </div>
        </Link>

        <Link
          href="/"
          prefetch={false}
          className="inline-flex h-10 w-full min-w-0 items-center justify-center gap-2 rounded border border-[#c49a3c]/35 bg-[#fff7e6]/10 px-3 text-sm font-semibold text-[#fff7e6] shadow-sm transition hover:border-[#e1c06c] hover:bg-[#fff7e6]/15 sm:w-auto"
        >
          <span className="truncate">Åpne Geotia</span>
          <ArrowRight className="h-4 w-4 flex-none" aria-hidden="true" />
          <LinkPendingIndicator className="text-[#e1c06c]" />
        </Link>
      </div>
    </header>
  );
}
