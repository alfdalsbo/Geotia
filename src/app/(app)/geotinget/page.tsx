import Image from "next/image";
import { Gavel } from "lucide-react";

import { submitGeotingProposalAction } from "@/app/actions";
import { GeotingSubnav } from "@/components/geoting-subnav";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { Section, StatTile } from "@/components/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { getCurrentGeot } from "@/lib/auth";
import { geotiaGeotingLines, pickGeoticLine } from "@/lib/geotia-jargon";
import { getGeotingState, resolveDueGeotingProposals } from "@/lib/store";

export const metadata = {
  title: "GeoTinget",
};

export default async function GeotingPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; error?: string }>;
}) {
  const params = (await searchParams) ?? {};
  await resolveDueGeotingProposals();
  const [state, currentGeot] = await Promise.all([getGeotingState(), getCurrentGeot()]);
  const proposals = state.geotingProposals;
  const activeVotingProposals = proposals.filter((proposal) => proposal.status === "voting");
  const activeVotes = activeVotingProposals.length;
  const awaitingOath = proposals.filter((proposal) => proposal.status === "open").length;
  const resolvedVotes = proposals.filter((proposal) => proposal.status === "passed" || proposal.status === "rejected").length;
  const votesCast = proposals.reduce((sum, proposal) => sum + proposal.votes.length, 0);
  const geotingLine = pickGeoticLine(geotiaGeotingLines, `${currentGeot?.id ?? "tingvollen"}:${proposals.length}`);

  return (
    <div className="space-y-6">
      <section className="geo-hero">
        <div className="geo-hero-grid">
          <div className="geo-hero-text">
            <Eyebrow>Tingvollen · agora · kranglekammer · Kapittel IV</Eyebrow>
            <h1 className="geo-hero-title">GeoTinget</h1>
            <p className="geo-hero-lead geo-hero-lead-dropcap">
              Tingvollen er inngangen til GeoTinget: legg frem nye saker, se om
              urnen er åpen, og gå videre til avstemninger eller
              Tingpergamentene uten å måtte lete gjennom en lang side.
            </p>
          </div>
          <div className="geo-hero-poster">
            <Image
              src="/illustrations/vapen-tinget.svg"
              alt="Riksvåpen for GeoTinget"
              width={300}
              height={350}
              priority
              style={{ width: "auto", maxHeight: "440px" }}
            />
          </div>
        </div>
      </section>

      <GeotingSubnav active="tingvollen" />

      <GeotingStatus status={params.status} error={params.error} />

      <div className="grid gap-3 md:grid-cols-4">
        <StatTile label="Innlogget embete" value={currentGeot?.shortName ?? "-"} detail={currentGeot?.title} tone="blue" index={0} />
        <StatTile label="Venter på geo-ed" value={awaitingOath} detail="Forslag på tingvollen" tone="gold" index={1} />
        <StatTile label="Åpne urner" value={activeVotes} detail="Vises i Stemmeurnen" tone="red" index={2} />
        <StatTile label="Protokollført" value={resolvedVotes} detail={`${votesCast} stemmer ført`} tone="green" index={3} />
      </div>

      {currentGeot?.role === "tingvitne" ? (
        <div className="rounded border border-[#c49a3c]/45 bg-[#fff7e6] p-4 text-sm leading-6 text-[#4f412b]">
          <strong className="text-[#062b40]">Tingvitneprotokoll:</strong> Danny har
          forslagsrett og kan sende saker til tingvollen, men har ikke stemmerett
          og kan ikke åpne avstemning eller søke partistiftelse før ordensveien
          har ført ham til nivå 7: Partigründer.
        </div>
      ) : null}

      <div className="rounded border border-[#c49a3c]/35 bg-[#fff7e6] px-4 py-3 text-sm font-semibold text-[#654517]">
        {geotingLine}
      </div>

      <Section title="Send inn forslag" eyebrow="Innkomne saker">
        <form action={submitGeotingProposalAction} className="geo-form grid gap-4 lg:grid-cols-[1fr_240px]">
          <label>
            <span>Tittel</span>
            <input
              name="title"
              placeholder="F.eks. Lov om obligatorisk India-varsling"
              required
            />
          </label>
          <label>
            <span>Sakstype</span>
            <select name="ruleType" defaultValue="annet">
              <option value="grunnlov">GeoGrunnlovsendring</option>
              <option value="mindre">Mindre lovendring</option>
              <option value="annet">Annet tingvedtak</option>
            </select>
          </label>
          <label className="lg:col-span-2">
            <span>Forslag / innhold</span>
            <textarea
              name="body"
              className="min-h-32"
              placeholder="Skriv forslaget slik at også motstanderne forstår hva de skal krangle med. For grunnlov: bruk gjerne Før: og Etter:."
              required
            />
          </label>
          <PendingSubmitButton className="btn btn-wax lg:col-span-2 lg:w-fit">
            <Gavel className="h-4 w-4" aria-hidden="true" />
            Send til GeoTinget
          </PendingSubmitButton>
        </form>
      </Section>
    </div>
  );
}

function GeotingStatus({ status, error }: { status?: string; error?: string }) {
  if (error === "tingvitne") {
    return (
      <div className="rounded border border-[#7c2430]/25 bg-[#7c2430]/10 px-4 py-3 text-sm font-medium text-[#7c2430]">
        Tingvitnet er notert, men stemmeurnen åpnes først etter ordensvei til nivå 7 og godkjent partistiftelse.
      </div>
    );
  }
  if (error === "geoed") {
    return (
      <div className="rounded border border-[#7c2430]/25 bg-[#7c2430]/10 px-4 py-3 text-sm font-medium text-[#7c2430]">
        Geo-eden mangler. Ingen får åpne stemmeurnen med tørre lepper.
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded border border-[#7c2430]/25 bg-[#7c2430]/10 px-4 py-3 text-sm font-medium text-[#7c2430]">
        {error}
      </div>
    );
  }
  if (!status) return null;

  const text =
    status === "stemt"
      ? "Stemmen er ført. Tingvollen dirrer svakt."
      : status === "avstemning"
        ? "Geo-eden er avlagt. Stemmeurnen er åpnet, og alle geoter skal varsles umiddelbart."
        : status === "avgjort"
          ? "Alle stemmer er inne. Embetsverket har lukket urnen og ført resultatet."
          : "Forslaget er mottatt. Kranglingen kan begynne.";

  return (
    <div className="rounded border border-[#285c45]/25 bg-[#285c45]/8 px-4 py-3 text-sm font-medium text-[#285c45]">
      {text}
    </div>
  );
}
