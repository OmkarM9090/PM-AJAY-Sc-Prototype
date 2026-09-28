/** Browser calls stay relative so Next's rewrite proxies to FastAPI in local and preview environments. */
const API = "/api";

export type LanguageCode = "hi" | "en" | "mr" | "ta" | "te" | "bn";

export interface BeneficiaryProfile {
  name: string;
  age?: number | null;
  location: { village?: string; district?: string; state?: string };
  education: string;
  category?: string;
  family_occupation: string;
  current_livelihood: string;
  identified_skills: string[];
  interests: string[];
  mobility_km?: number | null;
  physical_constraints: string;
  employment_preference: string;
  languages_spoken: string[];
  additional_notes?: string;
  consent_recording?: boolean;
}

export interface ChatMessage {
  speaker: "agent" | "user" | "system";
  text: string;
  language?: string;
  created_at?: string;
}

export interface Recommendation {
  rank: number;
  rank_score: number;
  skill_match_percent: number;
  interest_match: string;
  already_have: string[];
  skill_gaps: string[];
  rpl_eligible: boolean;
  qualification_pack: {
    qp_code: string;
    qp_name: string;
    sector: string;
    nsqf_level: number;
    duration_hours: number;
    avg_monthly_income_range: string;
    self_employment_potential: string;
  };
  nearest_center?: { name: string; district: string; state: string; estimated_distance_km?: number | null; lat?: number; lng?: number } | null;
  mobility_match: string;
  gia_benefits: { id: string; name: string; support: string; verification: string }[];
  pathway: string;
  roadmap: string[];
  data_notice: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!response.ok) {
    let detail = "Something went wrong. Please try again.";
    try { detail = (await response.json()).detail || detail; } catch { /* safe generic error */ }
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}

export const api = {
  health: () => request<{ status: string; voice_mode: string }>("/health"),
  createSession: (channel: "web" | "ivr" | "whatsapp" | "phone", language: LanguageCode, consentRecording: boolean) =>
    request<{ session_id: string; greeting: string; profile: BeneficiaryProfile; language: LanguageCode; progress: { completed: number; total: number; covered: string[] } }>("/conversation/session", { method: "POST", body: JSON.stringify({ channel, language, consent_recording: consentRecording }) }),
  getSession: (id: string) => request<{ id: string; profile: BeneficiaryProfile; messages: ChatMessage[]; language: LanguageCode; status: string; progress: { completed: number; total: number; covered: string[] } }>(`/conversation/session/${id}`),
  sendMessage: (sessionId: string, text: string, language?: string) => request<{ agent_text: string; detected_language: string; response_language: string; profile: BeneficiaryProfile; progress: { completed: number; total: number; covered: string[] }; completed: boolean; next_topic?: string }>("/conversation/message", { method: "POST", body: JSON.stringify({ session_id: sessionId, text, language }) }),
  updateProfile: (sessionId: string, profile: BeneficiaryProfile) => request<{ profile: BeneficiaryProfile }>(`/profile/${sessionId}`, { method: "PUT", body: JSON.stringify({ profile }) }),
  recommend: (sessionId: string) => request<{ profile_name: string; recommendations: Recommendation[]; data_notice: string }>("/recommend", { method: "POST", body: JSON.stringify({ session_id: sessionId }) }),
  loadDemo: (personaId = "ramesh", language: LanguageCode = "hi") => request<{ session_id: string; profile: BeneficiaryProfile; recommendations: Recommendation[] }>(`/demo/personas/${personaId}?language=${language}`, { method: "POST" }),
  stats: () => request<Record<string, unknown>>("/dashboard/stats"),
  beneficiaries: () => request<{ beneficiaries: Record<string, unknown>[]; notice: string }>("/dashboard/beneficiaries"),
  trainingCenters: (district?: string, sector?: string) => request<{ centers: TrainingCenter[] }>(`/training-centers?${new URLSearchParams({ ...(district ? { district } : {}), ...(sector ? { sector } : {}) })}`),
  synthesize: async (text: string, language: LanguageCode) => {
    const response = await fetch(`${API}/voice/synthesize`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, language }) });
    return response;
  },
  transcribe: async (audio: Blob, language: LanguageCode) => {
    const form = new FormData();
    form.append("file", audio, "jeevikasetu-voice.webm");
    form.append("language", language);
    const response = await fetch(`${API}/voice/transcribe`, { method: "POST", body: form });
    if (!response.ok) throw new Error("We could not transcribe that recording. Please use the text box and try again.");
    return response.json() as Promise<{ transcript: string; language: string; mode: string; message?: string }>;
  },
  report: (sessionId: string) => fetch(`${API}/report/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session_id: sessionId }) }),
};

export interface TrainingCenter { id: string; name: string; district: string; state: string; lat: number; lng: number; sectors: string[]; working_hours: string; }

export function readableLanguage(code: string) {
  return ({ hi: "Hindi", en: "English", mr: "Marathi", ta: "Tamil", te: "Telugu", bn: "Bengali" } as Record<string, string>)[code] || code;
}
