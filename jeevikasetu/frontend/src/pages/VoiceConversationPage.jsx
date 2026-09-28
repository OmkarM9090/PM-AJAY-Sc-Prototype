/** Screen 2 — the live voice interview. */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2 } from 'lucide-react'
import VoiceAgent from '../components/VoiceAgent'
import api from '../utils/apiClient'
import { useApp } from '../store/AppContext'
import { tr } from '../utils/strings'

export default function VoiceConversationPage() {
  const { language, setProfile, session } = useApp()
  const [extracting, setExtracting] = useState(false)
  const [done, setDone] = useState(false)
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4">
        <h1 className="section-title">आवाज़ से बातचीत · Voice conversation</h1>
        <p className="text-sm text-slate-600">
          Speak naturally — the assistant asks one simple question at a time and understands
          Hindi, English, Marathi, Tamil, Telugu and Bengali.
        </p>
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
