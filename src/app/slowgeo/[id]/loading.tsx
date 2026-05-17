import { Loader2 } from "lucide-react";

export default function SlowGeoLoading() {
  return (
    <main className="min-h-screen bg-[#f3ead7] px-4 py-5 text-[#273125] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <section className="rounded border border-[#d6b565]/55 bg-[#fff7e6] p-6 shadow-sm">
          <div className="flex min-h-36 items-center justify-center gap-3 text-sm font-semibold text-[#203c62]">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            Henter SlowGeo-bildet...
          </div>
        </section>
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="aspect-video rounded border border-[#d6b565]/55 bg-[#061d2b]" />
          <div className="min-h-72 rounded border border-[#d6b565]/55 bg-[#fff7e6]" />
        </div>
      </div>
    </main>
  );
}
