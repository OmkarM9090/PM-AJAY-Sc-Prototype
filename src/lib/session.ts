"use client";

import { BeneficiaryProfile, LanguageCode, Recommendation } from "@/lib/api";

const KEY = "jeevikasetu-prototype-session";
export interface SavedSession { sessionId?: string; language: LanguageCode; profile?: BeneficiaryProfile; recommendations?: Recommendation[]; highContrast?: boolean; largeText?: boolean; }

const initial: SavedSession = { language: "hi", highContrast: false, largeText: false };

export function readSavedSession(): SavedSession {
  if (typeof window === "undefined") return initial;
  try { return { ...initial, ...JSON.parse(window.localStorage.getItem(KEY) || "{}") }; } catch { return initial; }
}
export function saveSavedSession(update: Partial<SavedSession>) {
  const next = { ...readSavedSession(), ...update };
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("jeevika-session-change"));
  return next;
}
export function resetSavedSession() {
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("jeevika-session-change"));
}
