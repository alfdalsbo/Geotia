import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Crown,
  DoorOpen,
  Gavel,
  Landmark,
  ScrollText,
  ShieldCheck,
  TableProperties,
  Trophy,
} from "lucide-react";

import { logoutAction } from "@/app/actions";
import { getStorageMode } from "@/lib/store";

const navItems = [
  { href: "/", label: "Kommandosentral", icon: Landmark },
  { href: "/runder", label: "Runder", icon: TableProperties },
  { href: "/stilling", label: "Stilling", icon: Crown },
  { href: "/hall-of-fame", label: "Æreshallen", icon: Trophy },
  { href: "/arkiv", label: "Oppslagsverk", icon: BookOpen },
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6eddb_0,#eadcbd_100%)] text-[#161713]">
      <header className="border-b border-[#c49a3c]/40 bg-[#061d2b]/94 text-[#fff7e6] shadow-[0_10px_30px_rgba(0,0,0,0.22)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-14 w-14 overflow-hidden rounded border border-[#c49a3c]/70 bg-[#efe3c7] shadow-inner">
              <Image
                src="/geotia-assets/geotia-asset-4.png"
                alt="Geotia City"
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#e1c06c]">
                Riksregisteret · est. 2024
              </p>
              <p className="font-display text-3xl font-semibold tracking-normal text-[#fff7e6]">
                Geotia
              </p>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex h-10 items-center gap-2 rounded border border-[#c49a3c]/35 bg-[#fff7e6]/10 px-3 text-sm font-medium text-[#fff7e6] shadow-sm transition hover:border-[#e1c06c] hover:bg-[#fff7e6]/15"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-2 rounded border border-[#7c2430]/55 bg-[#7c2430] px-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#641923]"
              >
                <DoorOpen className="h-4 w-4" aria-hidden="true" />
                Forlat embetsverket
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>

      <footer className="border-t border-[#c49a3c]/40 bg-[#061d2b] text-[#fff7e6]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 text-sm text-[#eadcbd] sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#e1c06c]" aria-hidden="true" />
            <span>Geotia er privat riksregister. Lagring: {getStorageMode()}.</span>
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
