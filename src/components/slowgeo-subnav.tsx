"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Medal, ScrollText, TableProperties, Telescope } from "lucide-react";

import { LinkPendingIndicator } from "@/components/link-pending-indicator";
import { itemMatches, SLOWGEO_SECONDARY_NAV } from "@/lib/route-context";
import { cn } from "@/lib/utils";

const iconById = {
  spillrom: Telescope,
  tabeller: TableProperties,
  runder: ScrollText,
  aereshall: Medal,
} as const;

export function SlowGeoSubnav() {
  const pathname = usePathname();

  return (
    <nav aria-label="SlowGeo" className="subnav-strip">
      <div className="subnav-strip-grid">
        {SLOWGEO_SECONDARY_NAV.map((item) => {
          const Icon = iconById[item.id as keyof typeof iconById] ?? Telescope;
          const active = itemMatches(pathname, item);
          return (
            <Link
              key={item.id}
              href={item.href}
              prefetch={false}
              aria-current={active ? "page" : undefined}
              className={cn(active && "active")}
            >
              <Icon className="h-4 w-4 flex-none" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block truncate">{item.label}</span>
                <span className="subnav-strip-desc">{item.description}</span>
              </span>
              <LinkPendingIndicator className={active ? "text-white" : "text-[#203c62]"} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
