import { cn } from "@/lib/utils";

export function Section({
  title,
  eyebrow,
  children,
  className,
  action,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={cn("geotia-panel min-w-0 rounded", className)}>
      <div className="geotia-panel-header flex flex-col gap-3 border-b border-[#c49a3c]/45 px-4 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e1c06c]">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="font-display mt-1 text-2xl font-semibold tracking-normal text-[#fff7e6]">
            {title}
          </h2>
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function StatTile({
  label,
  value,
  detail,
  tone = "blue",
}: {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  tone?: "blue" | "green" | "red" | "gold";
}) {
  const tones = {
    blue: "border-[#062b40]/30 bg-[#062b40]/10 text-[#062b40]",
    green: "border-[#194832]/30 bg-[#194832]/10 text-[#194832]",
    red: "border-[#7c2430]/30 bg-[#7c2430]/10 text-[#7c2430]",
    gold: "border-[#c49a3c]/45 bg-[#c49a3c]/14 text-[#654517]",
  };

  return (
    <div className={cn("relative overflow-hidden rounded border bg-[linear-gradient(180deg,rgba(255,249,232,0.8),rgba(241,226,194,0.66))] p-4 shadow-sm", tones[tone])}>
      <span className="absolute inset-x-3 top-3 h-px bg-current/20" />
      <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-80">{label}</p>
      <div className="font-display mt-2 text-3xl font-semibold tracking-normal">{value}</div>
      {detail ? <div className="mt-2 text-sm opacity-80">{detail}</div> : null}
    </div>
  );
}
