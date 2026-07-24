"use client";

export default function AppError({
  unstable_retry: retry,
}: {
  unstable_retry: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#061a26] p-6 text-[#161713]">
      <section className="w-full max-w-lg rounded border border-[#b8892f]/50 bg-[#f3ead8] p-7 text-center shadow-lg sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7c2430]">Geotia · driftsmelding</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-[#062b40]">Tjenesten er midlertidig utilgjengelig</h1>
        <p className="mt-4 leading-7 text-[#4f412b]">
          Statsarkivet fikk ikke kontakt med datalageret. Ingen innsendte opplysninger er registrert i dette forsøket.
        </p>
        <p className="mt-3 text-sm leading-6 text-[#594226]">Prøv igjen om et øyeblikk. Hvis feilen fortsetter, er driftsansvarlig varslet.</p>
        <button
          type="button"
          onClick={retry}
          className="mt-7 inline-flex min-h-11 items-center justify-center rounded bg-[#7c2430] px-5 font-semibold text-white transition hover:bg-[#5f1c26]"
        >
          Prøv igjen
        </button>
      </section>
    </main>
  );
}
