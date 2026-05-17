"use client";

import { useEffect, useMemo, useState } from "react";

function parts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return { hours, minutes, seconds };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function osloClock(value: number | string) {
  return new Intl.DateTimeFormat("nb-NO", {
    timeZone: "Europe/Oslo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function osloDateTime(value: string) {
  return new Intl.DateTimeFormat("nb-NO", {
    timeZone: "Europe/Oslo",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

export function GeotingCountdown({
  endsAt,
  compact = false,
  title = "Tingfrist",
}: {
  endsAt: string | null | undefined;
  compact?: boolean;
  title?: string;
}) {
  const [now, setNow] = useState<number | null>(null);
  const target = useMemo(() => (endsAt ? new Date(endsAt).getTime() : null), [endsAt]);

  useEffect(() => {
    const update = () => setNow(Date.now());
    const firstTick = window.setTimeout(update, 0);
    const timer = window.setInterval(update, 1000);
    return () => {
      window.clearTimeout(firstTick);
      window.clearInterval(timer);
    };
  }, []);

  if (!target || now === null) {
    return (
      <div className="rounded border border-[#c49a3c]/45 bg-[#061d2b]/45 p-3 text-sm text-[#eadcbd]">
        GeoTingets urverk trekkes opp.
      </div>
    );
  }

  const remainingMs = target - now;
  const expired = remainingMs <= 0;
  const remaining = parts(remainingMs);

  return (
    <div
      aria-live="polite"
      className={
        compact
          ? "rounded border border-[#c49a3c]/45 bg-[#020b11]/55 p-3 text-[#fff7e6]"
          : "rounded border border-[#e1c06c]/70 bg-[#020b11]/75 p-4 text-[#fff7e6] shadow-[inset_0_0_0_1px_rgba(255,247,230,0.08)]"
      }
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e1c06c]">
          {title}
        </p>
        <p className="font-mono text-xs text-[#eadcbd]">
          Geotisk klokke {osloClock(now)}
        </p>
      </div>
      <div className={compact ? "mt-2 grid grid-cols-3 gap-2" : "mt-3 grid grid-cols-3 gap-2 sm:gap-3"}>
        {[
          ["Timer", remaining.hours],
          ["Minutter", remaining.minutes],
          ["Sekunder", remaining.seconds],
        ].map(([label, value]) => (
          <div key={label} className="rounded border border-[#c49a3c]/35 bg-[#fff7e6]/10 px-2 py-2 text-center">
            <p className={compact ? "font-display text-xl font-semibold sm:text-2xl" : "font-display text-3xl font-semibold sm:text-4xl"}>
              {expired ? "00" : pad(Number(value))}
            </p>
            <p className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-[#e1c06c] sm:text-[0.68rem] sm:tracking-[0.12em]">
              {label}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-[#eadcbd]">
        {expired ? "Tingfristen er ute. Embetsverket lukker urnen." : `Urnen stenger ${osloDateTime(endsAt!)}`}
      </p>
    </div>
  );
}

export function GeotingMiniCountdown({ endsAt }: { endsAt: string | null | undefined }) {
  const [now, setNow] = useState<number | null>(null);
  const target = useMemo(() => (endsAt ? new Date(endsAt).getTime() : null), [endsAt]);

  useEffect(() => {
    const update = () => setNow(Date.now());
    const firstTick = window.setTimeout(update, 0);
    const timer = window.setInterval(update, 1000);
    return () => {
      window.clearTimeout(firstTick);
      window.clearInterval(timer);
    };
  }, []);

  if (!target || now === null) {
    return <span className="font-mono">--:--:--</span>;
  }

  const remainingMs = target - now;
  const expired = remainingMs <= 0;
  const remaining = parts(remainingMs);

  return (
    <span className="font-mono tabular-nums">
      {expired ? "00:00:00" : `${pad(remaining.hours)}:${pad(remaining.minutes)}:${pad(remaining.seconds)}`}
    </span>
  );
}
