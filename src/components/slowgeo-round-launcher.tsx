import { MapPinned, Satellite } from "lucide-react";

import { createSlowGeoRoundAction } from "@/app/actions";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { getSlowGeoMonthlyRoundCap } from "@/lib/streetview";

function defaultDeadlineTime() {
  const date = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Oslo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.hour ?? "20"}:${values.minute ?? "00"}`;
}

export function SlowGeoRoundLauncher() {
  const hasPublicKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
  const hasServerKey = Boolean(process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
  const monthlyCap = getSlowGeoMonthlyRoundCap();
  const defaultTime = defaultDeadlineTime();

  return (
    <form action={createSlowGeoRoundAction} className="geo-form grid gap-4 lg:grid-cols-[1fr_200px_auto]">
      <label>
        <span>Tittel på bildet</span>
        <input name="title" placeholder="F.eks. Kveldsbilde for grunnloven" />
      </label>
      <label>
        <span>Fristklokkeslett</span>
        <input name="deadline_time" type="time" defaultValue={defaultTime} required />
      </label>
      <div className="flex items-end">
        <PendingSubmitButton className="btn btn-wax w-full lg:w-auto">
          <Satellite className="h-4 w-4" aria-hidden="true" />
          Åpne SlowGeo
        </PendingSubmitButton>
      </div>
      <div className="rounded border border-[#c49a3c]/45 bg-[#fff7e6] px-3 py-3 text-sm leading-6 text-[#4f412b] shadow-sm lg:col-span-3">
        <span
          className="mr-1 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.32em] text-[#7c2430]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <MapPinned className="h-3.5 w-3.5" aria-hidden="true" />
          Street View-pool
        </span>{" "}
        {monthlyCap > 0 ? `Månedstak: ${monthlyCap} runder.` : "Månedstak er av."}{" "}
        {!hasPublicKey || !hasServerKey
          ? "Google-nøkler mangler, så runden kan opprettes lokalt, men bilde/kart vises først når miljøvariablene er satt."
          : "Google-nøkler er registrert i miljøet."}
      </div>
    </form>
  );
}
