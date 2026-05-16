import { MapPinned, Satellite } from "lucide-react";

import { createSlowGeoRoundAction } from "@/app/actions";
import { getSlowGeoMonthlyRoundCap } from "@/lib/streetview";

export function SlowGeoRoundLauncher() {
  const hasPublicKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
  const hasServerKey = Boolean(process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
  const monthlyCap = getSlowGeoMonthlyRoundCap();

  return (
    <form action={createSlowGeoRoundAction} className="grid gap-4 lg:grid-cols-[1fr_180px_auto]">
      <label className="space-y-2">
        <span className="text-sm font-semibold text-[#273125]">Tittel på bildet</span>
        <input
          name="title"
          className="h-11 w-full rounded border border-[#d8ded0] bg-white px-3 outline-none focus:border-[#203c62]"
          placeholder="F.eks. Kveldsbilde for grunnloven"
        />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-semibold text-[#273125]">Frist</span>
        <select
          name="deadline_minutes"
          defaultValue="120"
          className="h-11 w-full rounded border border-[#d8ded0] bg-white px-3 outline-none focus:border-[#203c62]"
        >
          <option value="60">1 time</option>
          <option value="120">2 timer</option>
          <option value="240">4 timer</option>
          <option value="480">8 timer</option>
          <option value="1440">24 timer</option>
        </select>
      </label>
      <div className="flex items-end">
        <button
          type="submit"
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded bg-[#203c62] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#172d4b] lg:w-auto"
        >
          <Satellite className="h-4 w-4" aria-hidden="true" />
          Åpne SlowGeo
        </button>
      </div>
      <div className="rounded border border-[#c49a3c]/35 bg-[#fff7e6] px-3 py-2 text-sm leading-6 text-[#4f412b] lg:col-span-3">
        <span className="inline-flex items-center gap-2 font-semibold text-[#203c62]">
          <MapPinned className="h-4 w-4" aria-hidden="true" />
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
