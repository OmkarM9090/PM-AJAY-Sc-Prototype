/** Screen 2 — consent gate, then the live voice interview. */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react'
import VoiceAgent from '../components/VoiceAgent'
import ConsentGate from '../components/ConsentGate'
import api from '../utils/apiClient'
import { useApp } from '../store/AppContext'
import { tr } from '../utils/strings'

export default function VoiceConversationPage() {
  const { language, setProfile, session, consent, setConsent } = useApp()
  const [extracting, setExtracting] = useState(false)
  const [done, setDone] = useState(false)
  const [declined, setDeclined] = useState(false)
  const navigate = useNavigate()

  async function handleComplete() {
    setDone(true)
    setExtracting(true)
    try {
      const profile = await api.extractProfile({ session_id: session.id, language })
      setProfile(profile)
    } catch (e) {
      /* the profile page shows a retry affordance */
    } finally {
      setExtracting(false)
    }
  }

  /** Withdrawal is operational: the backend erases the conversation. */
  async function withdraw() {
    setConsent(false)
    if (session?.id) await api.recordConsent(session.id, false).catch(() => {})
    navigate('/')
  }

  if (!consent) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <ConsentGate
          onAccept={() => { setConsent(true); setDeclined(false) }}
          onDecline={() => setDeclined(true)}
        />
        {declined && (
          <div className="mx-auto mt-4 max-w-2xl rounded-xl bg-saffron-50 p-4 text-sm text-slate-700">
            कोई बात नहीं। बिना सहमति के भी आप{' '}
            <button type="button" onClick={() => navigate('/opportunities')} className="font-semibold text-govblue underline">
              प्रशिक्षण केंद्र और नौकरियाँ देख सकते हैं
            </button>{' '}
            — इसके लिए कोई जानकारी नहीं चाहिए.
            <div className="text-slate-500">
              No problem. You can still browse training centres and opportunities without sharing anything.
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="section-title">आवाज़ से बातचीत · Voice conversation</h1>
          <p className="text-sm text-slate-600">
            Speak naturally — the assistant asks one simple question at a time and understands
            Hindi, English, Marathi, Tamil, Telugu and Bengali.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="badge bg-indiagreen-50 text-indiagreen">
            <ShieldCheck size={13} /> सहमति दर्ज · Consent recorded
          </span>
          <button type="button" onClick={withdraw} className="text-slate-500 underline">
            सहमति वापस लें · Withdraw &amp; erase
          </button>
        </div>
      </div>

      <VoiceAgent channel="web" onComplete={handleComplete} />

      {done && (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-indiagreen-50 p-4">
          <span className="text-sm font-semibold text-indiagreen">
            ✅ बातचीत पूरी हुई — आपकी प्रोफ़ाइल तैयार है
          </span>
          <button
            type="button"
            disabled={extracting}
            onClick={() => navigate('/profile')}
            className="gov-btn-green ml-auto"
          >
            {extracting ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
            {extracting ? 'Extracting profile…' : tr('viewProfile', language)}
          </button>
        </div>
      )}
    </div>
  )
}
