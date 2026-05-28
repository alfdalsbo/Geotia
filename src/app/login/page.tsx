import Image from "next/image";
import { KeyRound } from "lucide-react";

import { loginAction } from "@/app/actions";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RiksSegl } from "@/components/ui/riks-segl";
import { parties } from "@/lib/seed";

export const metadata = {
  title: "Innlogging",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; next?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const rejected = params.error === "avvist";
  const next = params.next?.startsWith("/") && !params.next.startsWith("//") ? params.next : "/";

  return (
    <main className="min-h-screen bg-[#061a26] text-white">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_460px]">
        <section className="relative flex min-h-[46vh] items-end overflow-hidden lg:min-h-screen">
          <Image
            src="/geotia-assets/party-overview.png"
            alt="Geotia partioversikt"
            fill
            priority
            sizes="(min-width: 1024px) calc(100vw - 460px), 100vw"
            className="object-cover object-top opacity-80"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#061a26] via-[#061a26]/55 to-transparent" />
          {/* Gull-doble border langs høyre side på lg+ */}
          <div className="absolute inset-y-0 right-0 hidden w-[6px] bg-[#b8892f] lg:block" />
          <div className="absolute inset-y-0 right-[10px] hidden w-px bg-[#b8892f]/45 lg:block" />

          <div className="relative max-w-3xl p-6 lg:p-12">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#e1c06c] sm:text-xs"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Statsarkivet · sannhet · orden · forvirrelse
            </p>
            <h1
              className="mt-3 text-5xl font-black tracking-[0.18em] sm:text-7xl"
              style={{
                fontFamily: "var(--font-display)",
                textShadow: "0 2px 0 rgba(0,0,0,.4), 0 0 18px rgba(184,137,47,.3)",
              }}
            >
              G·E·O·T·I·A
            </h1>
            <p
              className="mt-5 max-w-2xl text-lg leading-8 text-white/85"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Privat embetsverk for SlowGeo, kattometer, GeoTinget og de annaler
              som gjør at staten virker uten å ligne et skjema fra en kommune.
            </p>
            <p
              className="mt-4 max-w-2xl text-base italic leading-7 text-[#e1c06c]/85"
              style={{ fontFamily: "var(--font-italic)" }}
            >
              Motoren enkel. Overbygningen rik.
            </p>
          </div>
        </section>

        <section
          className="flex items-center bg-[#f3ead8] p-6 text-[#161713] lg:p-10"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(75,46,24,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(75,46,24,0.05) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        >
          <div className="w-full">
            <div className="mb-8 flex items-center gap-4">
              <div className="seal-frame" style={{ width: 64, height: 64 }}>
                <RiksSegl size={54} />
              </div>
              <div>
                <Eyebrow>Adgangskontroll</Eyebrow>
                <p
                  className="font-display text-2xl font-bold uppercase tracking-[0.06em] text-[#062b40]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Embetsverket venter
                </p>
              </div>
            </div>

            <form action={loginAction} className="geo-form space-y-4">
              <input type="hidden" name="next" value={next} />

              <label>
                <span>Brukernavn</span>
                <input
                  id="username"
                  name="username"
                  autoComplete="username"
                  placeholder="PWP, Glenn Ruben, Ruben eller Glenn"
                  required
                />
                <small>
                  Bruk parti eller navn: {parties.map((party) => party.id.toUpperCase()).join(" · ")}.
                  Fornavn, etternavn og visningsnavn virker også.
                </small>
              </label>

              <label>
                <span>Passord</span>
                <div className="relative">
                  <KeyRound
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7c2430]"
                    aria-hidden="true"
                  />
                  <input
                    id="passcode"
                    name="passcode"
                    type="password"
                    autoComplete="current-password"
                    placeholder="geotia"
                    required
                    style={{ paddingLeft: "36px" }}
                  />
                </div>
              </label>

              {rejected ? (
                <p className="rounded border border-[#8e3030]/45 bg-[#8e3030]/10 px-3 py-2 text-sm font-semibold text-[#8e3030]">
                  GeoVAR avviser adgang. Sjekk nøkkelen og prøv igjen.
                </p>
              ) : null}

              <PendingSubmitButton className="btn btn-wax w-full justify-center" pendingChildren="Åpner …">
                Åpne Geotia
              </PendingSubmitButton>
            </form>

            <p
              className="mt-6 text-sm leading-6 text-[#594226]"
              style={{ fontFamily: "var(--font-italic)", fontStyle: "italic" }}
            >
              Hver geot kan logge inn med parti, fornavn, etternavn eller
              visningsnavn. Passordet er felles for Geotia.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
