import Link from "next/link";
import { DoorOpen } from "lucide-react";

import { logoutAction } from "@/app/actions";
import { GlobalSignalBar } from "@/components/global-signal-bar";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { RiksCompass } from "@/components/riks-compass";
import { RiksNav } from "@/components/ui/riks-nav";
import { RiksSegl } from "@/components/ui/riks-segl";
import { getCurrentGeot } from "@/lib/auth";
import { RIKS_NAV_ITEMS } from "@/lib/route-context";
import { getAppShellState, getStorageMode } from "@/lib/store";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const [currentGeot, appShellState] = await Promise.all([
    getCurrentGeot(),
    getAppShellState(),
  ]);

  return (
    <div className="geotia-civic-bg min-h-screen text-[#161713]">
      <header className="geo-rikshead">
        <div className="rikshead-inner">
          <div className="rikshead-identity">
            <Link
              href="/"
              prefetch={false}
              aria-label="Til Geotias kommandosentral"
              className="seal-frame"
            >
              <RiksSegl size={64} />
            </Link>
            <div className="rikshead-text">
              <div className="rikshead-title" aria-label="G E O T I A">G·E·O·T·I·A</div>
              <p className="rikshead-sub">
                Statsarkivet · Rikets embetsverk
                {currentGeot ? (
                  <>
                    {" "}· Innlogget som {currentGeot.shortName} — {currentGeot.title}
                  </>
                ) : null}
              </p>
            </div>
          </div>
          <RiksNav
            items={RIKS_NAV_ITEMS}
            extras={
              <form action={logoutAction}>
                <PendingSubmitButton
                  aria-label="Forlat embetsverket"
                  className="danger geo-nav-logout"
                  pendingChildren="Logger ut …"
                >
                  <DoorOpen className="h-4 w-4 flex-none" aria-hidden="true" />
                  <span className="geo-nav-logout-text">Forlat embetsverket</span>
                </PendingSubmitButton>
              </form>
            }
          />
        </div>
      </header>

      <GlobalSignalBar
        proposals={appShellState.activeGeotingProposals}
        rounds={appShellState.activeSlowGeoRounds}
      />
      <RiksCompass />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>

      <footer className="geo-footer">
        <div className="geo-footer-inner">
          <span>Geotia er privat statsarkiv. Lagring: <span className="accent">{getStorageMode()}</span>.</span>
          <span>Gjør din plikt, krev din rett, før dine kilometer.</span>
          <span>Motoren enkel. Overbygningen <span className="accent">rik</span>.</span>
        </div>
      </footer>
    </div>
  );
}
