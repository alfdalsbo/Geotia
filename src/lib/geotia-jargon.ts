export type GeoticTemplateValues = Record<string, string | number | null | undefined>;

export const slowGeoOpenShareTemplates = [
  "Nytt SlowGeo-bilde er oppe: {roundName}. Krangle først, sett pinnen etterpå.",
  "Geoter, tingvollen kaller: {roundName} er åpnet. Del hint, bygg mistanke, lås pinnen med verdighet.",
  "Embetsverket har lagt ut {roundName}. Ingen får dra til India uten offentlig motstand.",
  "Ny prøve i Kattometerets skygge: {roundName}. Se, rop, motsi, lås pin.",
  "{roundName} er oppe. Flokken skal varmes, stolpene skal tolkes, og selvtilliten skal overvåkes.",
  "SlowGeo-urnen er åpnet for {roundName}. Første geot med magefølelse må straks motsies av minst to andre.",
  "Dagens bilde: {roundName}. Geotia krever tegnlære, krangel og et pin-svar som kan latterliggjøres senere.",
  "Nytt bilde til krangletråden: {roundName}. Husk GeoKodeksen: alle hint deles før stoltheten tar styringen.",
  "Kartfolket bes møte: {roundName}. Kattometeret er stille nå, men det husker alt.",
  "{roundName} ligger klart. Se etter skilt, stolper, asfalt og egen overmotspuls.",
  "Tingvollen har fått nytt bilde: {roundName}. Krangelen er ikke støy, den er metode.",
  "SlowGeo varsler: {roundName}. Sett pin etter analyse, ikke etter panikk med høyt volum.",
];

export const slowGeoRevealShareTemplates = [
  "Fasit er avslørt i {roundName}: {answerLabel}.{winnerSentence}",
  "Kattometeret har talt i {roundName}: fasit var {answerLabel}.{winnerSentence}",
  "Embetsverket løfter sløret for {roundName}: {answerLabel}.{winnerSentence}",
  "{roundName} er ført i protokollen. Fasit: {answerLabel}.{winnerSentence}",
  "Geotia kan nå le med dokumentasjon: {roundName} var {answerLabel}.{winnerSentence}",
  "Fasitkortet er åpnet for {roundName}. Riktig sted: {answerLabel}.{winnerSentence}",
  "Krangelen er arkivert og avstanden er offentlig: {roundName} endte i {answerLabel}.{winnerSentence}",
  "SlowGeo-dommen har falt: {roundName} var {answerLabel}.{winnerSentence}",
];

export const slowGeoPersonalRevealShareTemplates = [
  "{playerName} landet {distance} fra fasit i {roundName}. Fasit: {answerLabel}.{winnerSentence}",
  "{playerName} har møtt Kattometeret: {distance} i {roundName}. Riktig sted var {answerLabel}.{winnerSentence}",
  "Personlig protokoll: {playerName} bommet {distance} i {roundName}. Fasit: {answerLabel}.{winnerSentence}",
  "{playerName} leverte pinnen og fikk {distance} tilbake fra staten. {roundName}: {answerLabel}.{winnerSentence}",
  "Geotisk etterprøving: {playerName} sto {distance} fra sannheten i {roundName}. Fasit: {answerLabel}.{winnerSentence}",
  "{playerName} kan nå måles offentlig: {distance} fra {answerLabel} i {roundName}.{winnerSentence}",
];

export const geotiaDashboardLines = [
  "Kommandosentralen er våken. Tallene er alvorlige, men stemningen er mistenkelig.",
  "Riket fører kilometer, ære og dårlige forklaringer med samme hånd.",
  "Hvis tabellen ser rolig ut, er det bare fordi krangelen ennå ikke har lastet.",
  "Geotia belønner oppmøte, hintdeling og evnen til å ta feil offentlig.",
  "Statsarkivet er ikke nøytralt. Det er bare pent ført.",
  "Først spiller vi. Så lager vi institusjon av det.",
];

export const geotiaGeotingLines = [
  "Saker skal ikke bare vedtas. De skal slites litt i kantene først.",
  "Et godt forslag tåler både presisering, mistanke og en liten konstitusjonell hoste.",
  "GeoTinget er der personlig preferanse tar på seg frakk og kaller seg prinsipp.",
  "Krangelen er ikke en omvei. Den er kontrollsystemet.",
  "Ingen urne åpnes uten ed, uro og et minimum av offentlig selvhøytidelighet.",
  "Partiene er uenige for rikets skyld, og litt for egen merkevare.",
];

export const geotiaOrderLines = [
  "I Geotia får du ikke makt fordi du er med. Du får makt fordi du har tålt å bli med.",
  "Ordensstigen er ikke en snarvei til parti. Den er prøven før staten slipper deg nær fyrstikkene.",
  "Rang er bare ansvar med bedre tittel og større blink.",
  "Den som vil stifte parti, må først bli farlig nok til å søke om det.",
  "Tilhørighet opparbeides, forsvares og latterliggjøres kjærlig.",
  "Du får være med som Borger. Du blir geot gjennom innsats. Du får makt gjennom tillit.",
];

export const geotiaMyGeotLines = [
  "Dette er din riksmappe. Den er personlig, men aldri helt privat for stemningen.",
  "Poeng viser oppmøte. Kattometeret viser avstand. Ordenen viser hvor mye staten tåler av deg.",
  "En geot er summen av hint, bom, krangler og de forklaringene som overlevde fasit.",
  "Din profil er ikke et selvbilde. Den er et offentlig kompromiss mellom prestasjon og myte.",
  "Her føres sporene dine med verdighet, også de sporene som burde vært dempet.",
];

export const geotiaTipLines = [
  "Tips er ikke hjelp. Tips er geotisk samfunnstjeneste.",
  "Et delt hint er en liten grunnlovshandling.",
  "Tegn før følelse. Følelse med vedlegg.",
  "Stolper, skilt og asfalt er rikets lavmælte vitner.",
  "Den som holder hint tilbake, ber staten følge med.",
];

export const slowGeoEmptyStateLines = [
  "Ingen åpne SlowGeo-runder. Dette er fred, og fred er sjelden produktivt.",
  "Tråden mangler brensel. Staten anbefaler nytt bilde før høfligheten får feste.",
  "Ingen aktiv krangel er registrert. Det kan rettes med ett Street View-bilde.",
  "SlowGeo hviler. Kattometeret gjør det ikke.",
];

export function geoticHash(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function pickGeoticLine(lines: readonly string[], seed: string, offset = 0) {
  if (lines.length === 0) return "";
  const index = (geoticHash(`${seed}:${offset}`) + offset) % lines.length;
  return lines[index];
}

export function pickGeoticLines(lines: readonly string[], seed: string, count: number) {
  if (lines.length === 0 || count <= 0) return [];
  const start = geoticHash(seed) % lines.length;
  const safeCount = Math.min(count, lines.length);
  return Array.from({ length: safeCount }, (_, index) => lines[(start + index) % lines.length]);
}

export function renderGeoticTemplate(template: string, values: GeoticTemplateValues) {
  return Object.entries(values).reduce((text, [key, value]) => {
    return text.split(`{${key}}`).join(String(value ?? ""));
  }, template);
}
