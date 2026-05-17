import Link from "next/link";
import { Gavel, ScrollText, Vote } from "lucide-react";

import { cn } from "@/lib/utils";

const tabs = [
  {
    id: "tingvollen",
    href: "/geotinget",
    label: "Tingvollen",
    description: "Forslag",
    icon: Gavel,
  },
  {
    id: "avstemninger",
    href: "/geotinget/avstemninger",
    label: "Stemmeurnen",
    description: "Stem",
    icon: Vote,
  },
  {
    id: "pergamenter",
    href: "/geotinget/pergamenter",
    label: "Tingpergamentene",
    description: "Arkiv",
    icon: ScrollText,
  },
] as const;

export type GeotingTabId = (typeof tabs)[number]["id"];

export function GeotingSubnav({ active }: { active: GeotingTabId }) {
  return (
    <nav
      aria-label="GeoTinget"
      className="rounded border border-[#c49a3c]/45 bg-[#fff7e6] p-1 shadow-sm"
    >
      <div className="grid grid-cols-3 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = tab.id === active;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-label={tab.label}
              aria-current={selected ? "page" : undefined}
              className={cn(
                "flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded px-1 py-2 text-center text-xs font-semibold transition sm:flex-row sm:justify-start sm:gap-2 sm:px-3 sm:text-sm",
                selected
                  ? "bg-[#203c62] text-white shadow-sm"
                  : "text-[#203c62] hover:bg-[#203c62]/8",
              )}
            >
              <Icon className="h-4 w-4 flex-none" aria-hidden="true" />
              <span className="max-w-full min-w-0">
                <span className="block truncate">{tab.label}</span>
                <span
                  className={cn(
                    "hidden text-xs font-medium sm:block",
                    selected ? "text-[#eadcbd]" : "text-[#60553f]",
                  )}
                >
                  {tab.description}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
