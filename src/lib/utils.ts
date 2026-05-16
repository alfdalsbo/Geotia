import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKm(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `${new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 1 }).format(value)} km`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 2 }).format(value);
}

export function formatScore(value: number | null | undefined, label?: string) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  const formatted = new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 2 }).format(value);
  if (!label) return formatted;
  if (label.toLowerCase().includes("forsøk")) return `${formatted} forsøk`;
  if (label.toLowerCase().includes("score")) return `${formatted} poeng`;
  return `${formatted} ${label.toLowerCase()}`;
}

export function dateLabel(value: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("nb-NO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}
