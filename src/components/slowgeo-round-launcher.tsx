import { BadgeCheck, Camera, ImageIcon, MapPinned, Satellite, Scale, Sparkles } from "lucide-react";

import { createSlowGeoRoundAction } from "@/app/actions";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { defaultOfficialSlowGeoDeadlineAt, formatOsloTime } from "@/lib/slowgeo";
import { getSlowGeoMonthlyRoundCap } from "@/lib/streetview";
import { getSlowGeoCandidatePoolState } from "@/lib/store";

function defaultDeadlineTime() {
  return formatOsloTime(defaultOfficialSlowGeoDeadlineAt());
}

export async function SlowGeoRoundLauncher() {
  const hasPublicKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
  const hasServerKey = Boolean(process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
  const monthlyCap = getSlowGeoMonthlyRoundCap();
  const poolStats = await getSlowGeoCandidatePoolState();
  const defaultTime = defaultDeadlineTime();
  const poolMessage =
    poolStats.status === "empty"
      ? "Ingen ubrukte kandidater igjen. Fyll på kandidatlisten før neste runde."
      : poolStats.status === "low"
        ? `Lav pool: ${poolStats.unusedCandidateCount} ubrukte kandidater igjen. Kjør slowgeo:refill.`
        : `${poolStats.unusedCandidateCount} ubrukte av ${poolStats.totalCandidates} kandidater.`;

  return (
    <form action={createSlowGeoRoundAction} className="geo-form grid gap-4 xl:grid-cols-[minmax(260px,1fr)_minmax(320px,1.1fr)_180px_auto]">
      <fieldset className="min-w-0 xl:col-span-4">
        <legend className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#7c2430]">Velg spilltype</legend>
        <div className="grid max-w-3xl gap-3">
          <label className="min-w-0 cursor-pointer">
            <input className="peer sr-only" type="radio" name="slowgeo_variant" value="slowgeo" defaultChecked />
            <span className="flex min-h-20 items-center justify-between gap-4 rounded border-2 border-[#203c62] bg-white px-4 py-3 text-[#4f412b] shadow-sm transition hover:bg-[#f7f8fb] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#c49a3c] peer-checked:bg-[#203c62] peer-checked:text-white peer-checked:shadow-md peer-checked:ring-2 peer-checked:ring-[#c49a3c]">
              <span className="min-w-0">
                <span className="inline-flex items-center gap-2 text-lg font-bold">
                  <Scale className="h-5 w-5" aria-hidden="true" />
                  SlowGeo
                </span>
                <span className="mt-1 block text-sm leading-6 opacity-85">
                  GeoGrunnloven gjelder. Runden føres i tabell og orden.
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 rounded border border-current/30 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em]">
                <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                Tabell
              </span>
            </span>
          </label>
          <label className="min-w-0 cursor-pointer">
            <input className="peer sr-only" type="radio" name="slowgeo_variant" value="bohemgeo" />
            <span className="flex min-h-20 items-center justify-between gap-4 rounded border-2 border-[#7c2430] bg-white px-4 py-3 text-[#4f412b] shadow-sm transition hover:bg-[#fff7e6] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#7c2430] peer-checked:bg-[#7c2430] peer-checked:text-white peer-checked:ring-2 peer-checked:ring-[#c49a3c]">
              <span className="min-w-0">
                <span className="inline-flex items-center gap-2 text-lg font-bold">
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                  BohemGeo
                </span>
                <span className="mt-1 block text-sm leading-6 opacity-85">
                  Ikke tabellført. Frist og fasit følger følelsene.
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center rounded border border-current/30 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em]">
                Fri
              </span>
            </span>
          </label>
        </div>
      </fieldset>
      <label>
        <span>Tittel på bildet</span>
        <input name="title" placeholder="F.eks. Kveldsbilde for grunnloven" />
      </label>
      <fieldset className="min-w-0">
        <legend className="mb-2 text-sm font-semibold text-[#273125]">Modus</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="min-w-0 cursor-pointer">
            <input
              className="peer sr-only"
              type="radio"
              name="slowgeo_mode"
              value="panorama"
              defaultChecked={hasServerKey}
              disabled={!hasServerKey}
            />
            <span className="flex min-h-24 flex-col gap-2 rounded border border-[#c49a3c]/45 bg-[#fdf7e8] p-3 text-[#4f412b] shadow-sm transition peer-checked:border-[#203c62] peer-checked:bg-[#203c62] peer-checked:text-white peer-disabled:cursor-not-allowed peer-disabled:opacity-55">
              <span className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-sm font-semibold">
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  Panorama
                </span>
                <span className="inline-flex items-center gap-1 rounded border border-current/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]">
                  <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                  Standard
                </span>
              </span>
              <span className="text-xs leading-5 opacity-85">
                360-visning i fullskjerm. {hasServerKey ? "Foretrukket embetsmodus." : "Mangler nøkkel for pano-ID."}
              </span>
            </span>
          </label>
          <label className="min-w-0 cursor-pointer">
            <input className="peer sr-only" type="radio" name="slowgeo_mode" value="static" defaultChecked={!hasServerKey} />
            <span className="flex min-h-24 flex-col gap-2 rounded border border-[#d8ded0] bg-white p-3 text-[#4f412b] shadow-sm transition peer-checked:border-[#285c45] peer-checked:bg-[#285c45] peer-checked:text-white">
              <span className="inline-flex items-center gap-2 text-sm font-semibold">
                <ImageIcon className="h-4 w-4" aria-hidden="true" />
                Statisk
              </span>
              <span className="text-xs leading-5 opacity-85">
                Fast Street View-bilde med samme poengsystem og kart.
              </span>
            </span>
          </label>
        </div>
      </fieldset>
      <label>
        <span>Fristklokkeslett</span>
        <input name="deadline_time" type="time" defaultValue={defaultTime} required />
      </label>
      <div className="flex items-end">
        <PendingSubmitButton className="btn btn-wax w-full lg:w-auto">
          <Satellite className="h-4 w-4" aria-hidden="true" />
          Start runden
        </PendingSubmitButton>
      </div>
      <div className="rounded border border-[#c49a3c]/45 bg-[#fdf7e8] px-3 py-3 text-sm leading-6 text-[#4f412b] shadow-sm xl:col-span-4">
        <span
          className="mr-1 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.32em] text-[#7c2430]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <MapPinned className="h-3.5 w-3.5" aria-hidden="true" />
          Street View-pool
        </span>{" "}
        {poolMessage} {monthlyCap > 0 ? `Månedstak: ${monthlyCap} runder.` : "Månedstak er av."}{" "}
        {!hasPublicKey || !hasServerKey
          ? "Google-nøkler mangler, så runden kan opprettes lokalt, men bilde/kart vises først når miljøvariablene er satt."
          : "Google-nøkler er registrert i miljøet."}
      </div>
    </form>
  );
}
