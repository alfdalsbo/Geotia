import { Loader2 } from "lucide-react";

export default function AppLoading() {
  return (
    <div className="space-y-5">
      <section className="geotia-frame rounded p-5 sm:p-7">
        <div className="flex min-h-40 items-center justify-center gap-3 text-sm font-semibold text-[#203c62]">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          Henter rikets protokoller...
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-28 rounded border border-[#d8ded0] bg-[#fff7e6]" />
        <div className="h-28 rounded border border-[#d8ded0] bg-[#fff7e6]" />
        <div className="h-28 rounded border border-[#d8ded0] bg-[#fff7e6]" />
      </div>
    </div>
  );
}
