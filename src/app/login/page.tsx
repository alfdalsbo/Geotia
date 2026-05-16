import Image from "next/image";
import { KeyRound, Landmark } from "lucide-react";

import { loginAction } from "@/app/actions";
import { players } from "@/lib/seed";

export const metadata = {
  title: "Innlogging",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const rejected = params.error === "avvist";

  return (
    <main className="min-h-screen bg-[#061d2b] text-white">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_440px]">
        <section className="relative flex min-h-[46vh] items-end overflow-hidden p-6 lg:min-h-screen lg:p-10">
          <Image
            src="/geotia-assets/party-overview.png"
            alt="Geotia partioversikt"
            fill
            priority
            sizes="(min-width: 1024px) calc(100vw - 440px), 100vw"
            className="object-cover object-top opacity-78"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#061d2b] via-[#061d2b]/40 to-transparent" />
          <div className="relative max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#e2c479]">
              Statsarkivet · sannhet orden forvirrelse
            </p>
            <h1 className="font-display mt-3 text-5xl font-semibold tracking-normal sm:text-7xl">Geotia</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-white/82">
              Privat embetsverk for SlowGeo, kattometer, GeoTinget og de annaler
              som gjør at staten virker uten å ligne et skjema fra en kommune.
            </p>
          </div>
        </section>

        <section className="flex items-center border-l border-white/12 bg-[#f3ead8] p-6 text-[#161713] lg:p-10">
          <div className="w-full">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded border border-[#c49a3c]/45 bg-[#fff7e6] text-[#062b40]">
                <Landmark className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7c2430]">
                  Adgangskontroll
                </p>
                <p className="font-display text-2xl font-semibold text-[#062b40]">Embetsverket venter</p>
              </div>
            </div>

            <form action={loginAction} className="geotia-frame rounded p-5">
              <label htmlFor="playerId" className="text-sm font-semibold text-[#273125]">
                Geot
              </label>
              <select
                id="playerId"
                name="playerId"
                defaultValue="alf"
                className="mt-2 h-12 w-full rounded border border-[#c49a3c]/45 bg-[#fff7e6] px-3 text-base outline-none focus:border-[#062b40]"
              >
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.shortName} · {player.title}
                  </option>
                ))}
              </select>

              <label htmlFor="passcode" className="mt-4 block text-sm font-semibold text-[#273125]">
                Geotisk adgangsfrase
              </label>
              <div className="mt-2 flex items-center gap-2 rounded border border-[#c49a3c]/45 bg-[#fff7e6] px-3">
                <KeyRound className="h-4 w-4 text-[#7c2430]" aria-hidden="true" />
                <input
                  id="passcode"
                  name="passcode"
                  type="password"
                  autoComplete="current-password"
                  className="h-12 min-w-0 flex-1 bg-transparent text-base outline-none"
                  placeholder="Skriv rikets nøkkel"
                  required
                />
              </div>
              {rejected ? (
                <p className="mt-3 rounded border border-[#7c2430]/25 bg-[#7c2430]/10 px-3 py-2 text-sm text-[#7c2430]">
                  GeoVAR avviser adgang. Sjekk nøkkelen og prøv igjen.
                </p>
              ) : null}
              <button
                type="submit"
                className="mt-4 inline-flex h-11 w-full items-center justify-center rounded bg-[#062b40] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d3b4e]"
              >
                Åpne Geotia
              </button>
            </form>

            <p className="mt-5 text-sm leading-6 text-[#5b6257]">
              Velg geot før adgang. Felles passord virker fortsatt, men Vercel kan
              også få egne passord per geot via GEOTIA_USER_PASSCODES når riket
              krever strengere protokoll.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
