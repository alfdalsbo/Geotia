import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { LinkPendingIndicator } from "@/components/link-pending-indicator";
import { RiksSegl } from "@/components/ui/riks-segl";

/**
 * PublicGeotiaHeader — mindre/kompakt versjon av RiksHeader for
 * offentlige sider (delte SlowGeo-svar). Samme tokens, men én linje
 * og en "Åpne Geotia"-knapp istedenfor full nav.
 */
export function PublicGeotiaHeader() {
  return (
    <header className="geo-rikshead">
      <div className="rikshead-inner">
        <div className="rikshead-identity">
          <Link
            href="/"
            prefetch={false}
            aria-label="Til Geotia"
            className="seal-frame"
            style={{ width: 56, height: 56 }}
          >
            <RiksSegl size={48} />
          </Link>
          <div className="rikshead-text">
            <h1 className="rikshead-title" style={{ fontSize: 24 }}>G·E·O·T·I·A</h1>
            <p className="rikshead-sub">Statsarkivet · rikets embetsverk</p>
          </div>
        </div>
        <Link
          href="/"
          prefetch={false}
          className="btn btn-brass btn-small"
        >
          <span>Åpne Geotia</span>
          <ArrowRight className="h-4 w-4 flex-none" aria-hidden="true" />
          <LinkPendingIndicator className="text-[#062b40]" />
        </Link>
      </div>
    </header>
  );
}
