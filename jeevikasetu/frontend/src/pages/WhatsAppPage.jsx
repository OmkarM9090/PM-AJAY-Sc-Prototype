/** Screen 7 — WhatsApp voice-note channel simulation. */

import { useNavigate } from 'react-router-dom'
import WhatsAppChat from '../components/WhatsAppChat'
import api from '../utils/apiClient'
import { useApp } from '../store/AppContext'

export default function WhatsAppPage() {
  const { language, session, setProfile } = useApp()
  const navigate = useNavigate()

  async function handleComplete() {
    try {
      const profile = await api.extractProfile({ session_id: session.id, language })
      setProfile(profile)
      navigate('/profile')
    } catch (_) { /* stay */ }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="section-title mb-1">WhatsApp वॉइस नोट चैनल</h1>
      <p className="mb-5 text-sm text-slate-600">
        Many beneficiaries already use WhatsApp voice notes daily. The same conversation engine
        answers on the WhatsApp Business API — record a note, get a spoken reply.
      </p>
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <WhatsAppChat onComplete={handleComplete} />
        <div className="gov-card h-fit p-4 text-sm text-slate-600">
          <h3 className="font-bold text-govblue">How the WhatsApp channel works in production</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Beneficiary sends a voice note to the PM-AJAY WhatsApp Business number.</li>
            <li>Webhook downloads the OGG audio and sends it to Whisper / Bhashini ASR.</li>
            <li>The transcript enters the same <code>/api/conversation/message</code> dialogue engine.</li>
            <li>The reply is synthesised (TTS) and returned as a voice note plus text.</li>
            <li>When all nine topics are covered, the profile and recommendations are generated
                and a PDF is delivered in chat.</li>
          </ol>
          <p className="mt-3 text-xs text-slate-500">
            In this prototype the browser microphone stands in for the WhatsApp media pipeline, and
            every message really does travel through the backend dialogue engine.
          </p>
        </div>
      </div>
    </div>
  )
}
