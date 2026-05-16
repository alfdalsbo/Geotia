import type { Player } from "@/lib/types";

export const THIRD_COLLEGIUM_MEMBER_IDS = ["alf", "steinar", "vegard"] as const;

export type ThirdCollegeMemberId = (typeof THIRD_COLLEGIUM_MEMBER_IDS)[number];

export type ThirdCollegeSeat = {
  playerId: ThirdCollegeMemberId;
  partyId: "ss" | "pkk" | "ira";
  seal: string;
  office: string;
  codename: string;
  expandedRight: string;
  oversight: string;
};

export const thirdCollegeMotto = "Dypt ned. Langt borte. Alltid først.";

export const thirdCollegeSeats: ThirdCollegeSeat[] = [
  {
    playerId: "alf",
    partyId: "ss",
    seal: "Første segl",
    office: "Statsarkivar for usynlige sammenhenger",
    codename: "Sentrumsnøkkelen",
    expandedRight: "Kan åpne skjulte oversikter og lese rikets mellomlinjer.",
    oversight: "Holder orden på sannheten før sannheten vet at den er vedtatt.",
  },
  {
    playerId: "steinar",
    partyId: "pkk",
    seal: "Andre segl",
    office: "Urokommissær for kontrollerte kriser",
    codename: "Krangleflammen",
    expandedRight: "Kan merke saker som krever umiddelbar, høytidelig uro.",
    oversight: "Sikrer at stillstand aldri får lov til å late som den er fred.",
  },
  {
    playerId: "vegard",
    partyId: "ira",
    seal: "Tredje segl",
    office: "Grunnlovsvokter i lukket sal",
    codename: "Paragrafskyggen",
    expandedRight: "Kan se konstitusjonell risiko før andre ser et forslag.",
    oversight: "Vokter 7/7-porten og alt som helst ikke skal røres.",
  },
];

export const thirdCollegePrivileges = [
  "Skjult fane i embetsverket",
  "Utvidet oversikt over åpne saker, utkast og maktbalanse",
  "Indre protokoll for SS, PKK og IRA",
  "Rett til å mistenke mønstre før mønstre foreligger",
];

const thirdCollegeMemberSet = new Set<string>(THIRD_COLLEGIUM_MEMBER_IDS);

export function isThirdCollegeMember(playerId: string | null | undefined) {
  return typeof playerId === "string" && thirdCollegeMemberSet.has(playerId);
}

export function getThirdCollegeSeat(playerId: string) {
  return thirdCollegeSeats.find((seat) => seat.playerId === playerId) ?? null;
}

export function getThirdCollegeMembers(players: Player[]) {
  const playerById = new Map(players.map((player) => [player.id, player]));
  return thirdCollegeSeats
    .map((seat) => playerById.get(seat.playerId))
    .filter((player): player is Player => Boolean(player));
}
