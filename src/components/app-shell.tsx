import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  DoorOpen,
  Gavel,
  Landmark,
  Map,
  ScrollText,
  ShieldCheck,
  TableProperties,
  UserRound,
} from "lucide-react";

import { logoutAction } from "@/app/actions";
import { GeoGuessrTipToast } from "@/components/geo-guessr-tip-toast";
import { GeotingGlobalAlert } from "@/components/geoting-global-alert";
import { SlowGeoGlobalAlert } from "@/components/slowgeo-global-alert";
import { getCurrentGeot } from "@/lib/auth";
import { getGeoGuessrTipDaySeed, selectGeoGuessrTips } from "@/lib/geoguessr-tips";
import { getActiveGeotingProposals, getActiveSlowGeoRounds, getStorageMode } from "@/lib/store";

const navItems = [
  { href: "/", label: "Kommandosentral", icon: Landmark },
  { href: "/spill", label: "Spill", icon: Map },
  { href: "/tabeller", label: "Tabeller", icon: TableProperties },
  { href: "/geotinget", label: "GeoTinget", icon: Gavel },
  { href: "/arkiv", label: "Oppslagsverk", icon: BookOpen },
  { href: "/min-geot", label: "Min geot", icon: UserRound },
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const [currentGeot, activeGeotingProposals, activeSlowGeoRounds] = await Promise.all([
    getCurrentGeot(),
    getActiveGeotingProposals(),
    getActiveSlowGeoRounds(),
  ]);
  const toastTips = selectGeoGuessrTips({
    placement: "global-toast",
    seed: getGeoGuessrTipDaySeed(),
    count: 12,
  });

  return (
    <div className="geotia-civic-bg min-h-screen text-[#161713]">
      <header className="border-b border-[#c49a3c]/40 bg-[#061d2b]/94 text-[#fff7e6] shadow-[0_10px_30px_rgba(0,0,0,0.22)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="relative h-14 w-14 overflow-hidden rounded border border-[#c49a3c]/70 bg-[#efe3c7] shadow-inner">
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
              <p className="font-display text-3xl font-semibold tracking-normal text-[#fff7e6]">
                Geotia
              </p>
              {currentGeot ? (
                <p className="text-xs text-[#eadcbd]">
                  Innlogget som {currentGeot.shortName} · {currentGeot.title}
                </p>
              ) : null}
            </div>
          </Link>

          <nav className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded border border-[#c49a3c]/35 bg-[#fff7e6]/10 px-3 text-sm font-medium text-[#fff7e6] shadow-sm transition hover:border-[#e1c06c] hover:bg-[#fff7e6]/15"
                >
                  <Icon className="h-4 w-4 flex-none" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex h-10 w-full min-w-0 items-center justify-center gap-2 rounded border border-[#7c2430]/55 bg-[#7c2430] px-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#641923]"
              >
                <DoorOpen className="h-4 w-4 flex-none" aria-hidden="true" />
                <span className="truncate">Forlat embetsverket</span>
              </button>
            </form>
          </nav>
        </div>
      </header>

      <GeotingGlobalAlert proposals={activeGeotingProposals} />
      <SlowGeoGlobalAlert rounds={activeSlowGeoRounds} />
      <GeoGuessrTipToast tips={toastTips} />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>

      <footer className="border-t border-[#c49a3c]/40 bg-[#061d2b] text-[#fff7e6]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 text-sm text-[#eadcbd] sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#e1c06c]" aria-hidden="true" />
            <span>Geotia er privat statsarkiv. Lagring: {getStorageMode()}.</span>
          </div>
          <div className="flex items-center gap-2">
            <Gavel className="h-4 w-4 text-[#e1c06c]" aria-hidden="true" />
            <span>Gjør din plikt, krev din rett, før dine kilometer.</span>
          </div>
          <div className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-[#e1c06c]" aria-hidden="true" />
            <span>Motoren enkel. Overbygningen rik.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
