/**
 * Typed-ish API client for the JeevikaSetu FastAPI backend.
 * All calls are RELATIVE (/api/...) and proxied by Vite, so the same build
 * works on localhost, on a LAN demo laptop and inside hosted previews.
 */

const BASE = '/api'

async function request(path, { method = 'GET', body, raw = false } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`API ${method} ${path} failed (${res.status}): ${detail.slice(0, 200)}`)
  }
  return raw ? res.blob() : res.json()
}

export const api = {
  // ---- system ----
  health: () => request('/health'),
  languages: () => request('/voice/languages'),

  // ---- conversation ----
  startConversation: (language = 'hi', channel = 'web', demoMode = false, consent = true) =>
    request('/conversation/start', {
      method: 'POST',
      body: { language, channel, demo_mode: demoMode, consent_given: consent,
              consent_scope: 'voice-profiling' },
    }),
  recordConsent: (sessionId, granted) =>
    request('/conversation/consent', {
      method: 'POST',
      body: { session_id: sessionId, consent_given: granted, consent_scope: 'voice-profiling' },
    }),
  sendMessage: (sessionId, text, language) =>
    request('/conversation/message', { method: 'POST', body: { session_id: sessionId, text, language } }),
  getConversation: (sessionId) => request(`/conversation/${sessionId}`),
  interviewScript: () => request('/conversation/script'),
  demoScript: () => request('/conversation/demo/script'),

  // ---- voice ----
  synthesize: (text, language = 'hi') =>
    request('/voice/synthesize', { method: 'POST', body: { text, language } }),
  detectLanguage: (text) => request('/voice/detect-language', { method: 'POST', body: { text } }),
  transcribe: async (blob, language) => {
    const form = new FormData()
    form.append('file', blob, 'speech.webm')
    if (language) form.append('language', language)
    const res = await fetch(`${BASE}/voice/transcribe`, { method: 'POST', body: form })
    if (!res.ok) throw new Error('Transcription failed')
    return res.json()
  },

  // ---- profile ----
  extractProfile: (payload) => request('/profile/extract', { method: 'POST', body: payload }),
  saveProfile: (sessionId, profile) =>
    request('/profile/save', { method: 'POST', body: { session_id: sessionId, profile } }),
  personas: () => request('/profile/personas'),

  // ---- recommendations & reference data ----
  recommend: (profile, sessionId, topN = 5) =>
    request('/recommend', { method: 'POST', body: { profile, session_id: sessionId, top_n: topN } }),
  trainingCenters: (params = {}) =>
    request(`/training-centers?${new URLSearchParams(params)}`),
  opportunities: (params = {}) => request(`/opportunities?${new URLSearchParams(params)}`),
  qualificationPacks: (params = {}) =>
    request(`/nsqf/qualification-packs?${new URLSearchParams(params)}`),
  giaBenefits: () => request('/gia-benefits'),

  // ---- dashboard & report ----
  dashboardStats: () => request('/dashboard/stats'),
  dashboardBeneficiaries: (params = {}) =>
    request(`/dashboard/beneficiaries?${new URLSearchParams(params)}`),
  schemeUtilisation: () => request('/dashboard/scheme-utilisation'),
  generateReport: (profile, recommendations) =>
    request('/report/generate', { method: 'POST', body: { profile, recommendations }, raw: true }),
}

export default api
