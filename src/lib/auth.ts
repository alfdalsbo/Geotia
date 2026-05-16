import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { players } from "@/lib/seed";

const COOKIE_NAME = "geotia_session";
const SESSION_SECONDS = 60 * 60 * 24 * 30;

type SessionPayload = {
  sub: "geotia";
  playerId: string;
  exp: number;
};

function secret() {
  return process.env.AUTH_SECRET || "local-geotia-auth-secret-change-on-vercel";
}

function passcode() {
  return process.env.GEOTIA_PASSCODE || "geotia";
}

function userPasscodes() {
  const raw = process.env.GEOTIA_USER_PASSCODES;
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

function base64Url(input: string) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function createToken(playerId: string) {
  const payload: SessionPayload = {
    sub: "geotia",
    playerId,
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
  };
  const encoded = base64Url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

export function isKnownPlayer(playerId: string) {
  return players.some((player) => player.id === playerId);
}

export function isCorrectPasscode(value: string, playerId: string) {
  const perUserPasscode = userPasscodes()[playerId];
  return safeEqual(value.trim(), perUserPasscode ?? passcode());
}

export function verifyToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(sign(payload), signature)) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionPayload;
    if (decoded.sub !== "geotia" || decoded.exp <= Math.floor(Date.now() / 1000)) return null;
    if (!decoded.playerId || !isKnownPlayer(decoded.playerId)) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function createSession(playerId: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createToken(playerId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function hasSession() {
  const cookieStore = await cookies();
  return verifyToken(cookieStore.get(COOKIE_NAME)?.value) !== null;
}

export async function getSession() {
  const cookieStore = await cookies();
  return verifyToken(cookieStore.get(COOKIE_NAME)?.value);
}

export async function getCurrentGeot() {
  const session = await getSession();
  return players.find((player) => player.id === session?.playerId) ?? null;
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export { COOKIE_NAME };
