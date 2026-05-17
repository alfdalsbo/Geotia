import { getConstitutionChangeParts, summarizeProposal, votingPlayers } from "@/lib/geoting";
import type { GeotingProposal, Player } from "@/lib/types";

export type PartyMechanic = {
  partyId: string;
  title: string;
  phase: "forslag" | "krangel" | "geo-ed" | "avstemning" | "etterliv";
  trigger: string;
  effect: string;
  limit: string;
};

export type ProposalPartyMechanic = PartyMechanic & {
  state: "available" | "waiting" | "satisfied";
  stateLabel: string;
  stateDetail: string;
};

export const partyMechanics: PartyMechanic[] = [
  {
    partyId: "ss",
    title: "Embetslig presisering",
    phase: "forslag",
    trigger: "Når en sak er uklar, for lang eller språklig farlig.",
    effect: "Kan kreve at forslaget får presis tittel, kort formål og protokollklar ordlyd før urnen åpnes.",
    limit: "Må brukes til å gjøre saken klarere, ikke til å drepe den med kontorarbeid.",
  },
  {
    partyId: "ira",
    title: "Konstitusjonell innsigelse",
    phase: "krangel",
    trigger: "Når et forslag kan endre 7/7-kravet, GeoGrunnloven eller rikets grunnro.",
    effect: "Kan kreve at saken behandles som grunnlovssak med tydelig før/etter-tekst.",
    limit: "Innsigelsen må peke på konkret paragraf, ikke bare en følelse av at noe er galt.",
  },
  {
    partyId: "plo",
    title: "Intensjonsforsvar",
    phase: "avstemning",
    trigger: "Når et forslag rammer poengunderklassen eller en geot med tvilsom, men rørende hensikt.",
    effect: "Kan legge ved en mindretallsmerknad som følger saken inn i Riksarkivet.",
    limit: "Gir forklaring, ikke ekstra stemmer.",
  },
  {
    partyId: "pkk",
    title: "Kranglefrist",
    phase: "krangel",
    trigger: "Når saken går for raskt gjennom tingvollen og konfliktismen ikke er tilstrekkelig æret.",
    effect: "Kan kreve en kort offentlig kranglefrist før geo-eden avlegges.",
    limit: "Kan ikke brukes når alle partier allerede har ført partilinje.",
  },
  {
    partyId: "cip",
    title: "Forenklingsforslag",
    phase: "etterliv",
    trigger: "Når vedtaket er riktig i ånden, men for stort i formen.",
    effect: "Kan foreslå den minste praktiske implementeringen som fortsatt respekterer vedtaket.",
    limit: "Må være konkret nok til at Tredje Kollegium kan føre ettervedtak.",
  },
  {
    partyId: "mossad",
    title: "Avslutningsforslag",
    phase: "geo-ed",
    trigger: "Når debatten sirkler og spillet lider.",
    effect: "Kan fremme forslag om å avlegge geo-eden og åpne urnen.",
    limit: "Kan overstyres av aktiv konstitusjonell innsigelse eller kranglefrist.",
  },
  {
    partyId: "pwp",
    title: "Hastebehandling",
    phase: "geo-ed",
    trigger: "Når saken er enkel, stemningen er moden og pølseministeriet aner tidsbruk.",
    effect: "Kan be om umiddelbar avstemning med kort begrunnelse.",
    limit: "Kan ikke brukes på grunnlovssaker uten at før/etter-tekst er ført.",
  },
];

export function getPartyMechanic(partyId?: string | null) {
  return partyMechanics.find((mechanic) => mechanic.partyId === partyId) ?? null;
}

export function getProposalPartyMechanics(proposal: GeotingProposal, players: Player[], now = new Date()): ProposalPartyMechanic[] {
  const summary = summarizeProposal(proposal, players, now);
  const positions = proposal.partyPositions ?? [];
  const positionPartyIds = new Set(positions.map((position) => position.partyId));
  const votingPartyIds = new Set(votingPlayers(players).map((player) => player.partyId).filter(Boolean));
  const allPartiesHavePosition = [...votingPartyIds].every((partyId) => positionPartyIds.has(partyId));
  const constitutionParts = getConstitutionChangeParts(proposal.body);
  const hasBeforeAfter = Boolean(constitutionParts.before && constitutionParts.after);
  const implementationStatus = proposal.implementationStatus ?? "pending";

  return partyMechanics.map((mechanic) => {
    if (mechanic.partyId === "ira") {
      if (proposal.ruleType === "grunnlov" && hasBeforeAfter) {
        return {
          ...mechanic,
          state: "satisfied",
          stateLabel: "Ivaretatt",
          stateDetail: "Saken er allerede ført som grunnlovssak med før/etter-tekst.",
        };
      }
      return {
        ...mechanic,
        state: !summary.started ? "available" : "waiting",
        stateLabel: !summary.started ? "Kan reises" : "For sent",
        stateDetail: !summary.started
          ? "IRA kan kreve grunnlovsbehandling før geo-eden."
          : "Urnen er åpnet; innsigelsen må bli arkivmerknad.",
      };
    }

    if (mechanic.partyId === "pkk") {
      return {
        ...mechanic,
        state: !summary.started && !allPartiesHavePosition ? "available" : "satisfied",
        stateLabel: !summary.started && !allPartiesHavePosition ? "Kan kreves" : "Krangelen er moden",
        stateDetail: !summary.started && !allPartiesHavePosition
          ? "PKK kan kreve kranglefrist før alle partier har ført linje."
          : "Partilinjene eller geo-eden har flyttet saken videre.",
      };
    }

    if (mechanic.partyId === "mossad") {
      return {
        ...mechanic,
        state: !summary.started ? "available" : "satisfied",
        stateLabel: !summary.started ? "Kan avslutte" : "Avsluttet",
        stateDetail: !summary.started ? "MOSSAD kan presse saken fra prat til urne." : "Saken har forlatt kranglefasen.",
      };
    }

    if (mechanic.partyId === "pwp") {
      const blocked = proposal.ruleType === "grunnlov" && !hasBeforeAfter;
      return {
        ...mechanic,
        state: !summary.started && !blocked ? "available" : blocked ? "waiting" : "satisfied",
        stateLabel: !summary.started && !blocked ? "Kan hasteføres" : blocked ? "Mangler før/etter" : "Behandlet",
        stateDetail: blocked
          ? "PWP må vente til grunnlovsteksten har før/etter-form."
          : !summary.started
            ? "Hastebehandling kan foreslås før saken stivner."
            : "Saken er allerede i formell flyt.",
      };
    }

    if (mechanic.partyId === "cip") {
      return {
        ...mechanic,
        state: summary.finished && implementationStatus === "pending" ? "available" : implementationStatus === "pending" ? "waiting" : "satisfied",
        stateLabel: summary.finished && implementationStatus === "pending" ? "Kan forenkle" : implementationStatus === "pending" ? "Venter på vedtak" : "Etterliv ført",
        stateDetail: summary.finished && implementationStatus === "pending"
          ? "CIP kan foreslå minste praktiske implementering."
          : implementationStatus === "pending"
            ? "Først må saken avgjøres."
            : "Saken har fått ettervedtak.",
      };
    }

    if (mechanic.partyId === "plo") {
      return {
        ...mechanic,
        state: summary.started ? "available" : "waiting",
        stateLabel: summary.started ? "Kan merknadsføres" : "Venter på urne",
        stateDetail: summary.started
          ? "PLO kan legge intensjonsforsvar ved stemmegivning."
          : "Mindretallsmerknad hører hjemme når saken står i urnen.",
      };
    }

    return {
      ...mechanic,
      state: !summary.started ? "available" : "waiting",
      stateLabel: !summary.started ? "Kan presisere" : "Venter",
      stateDetail: !summary.started
        ? "SS kan kreve klarere ordlyd før geo-eden."
        : "Presiseringen må skje som pergamentredigering.",
    };
  });
}
