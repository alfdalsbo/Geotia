export type PartyMechanic = {
  partyId: string;
  title: string;
  phase: "forslag" | "krangel" | "geo-ed" | "avstemning" | "etterliv";
  trigger: string;
  effect: string;
  limit: string;
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
