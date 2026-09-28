/** Screen 6 — feature-phone IVR channel simulation. */

import { useNavigate } from 'react-router-dom'
import IVRSimulator from '../components/IVRSimulator'
import api from '../utils/apiClient'
import { useApp } from '../store/AppContext'

export default function IVRPage() {
  const { language, session, setProfile } = useApp()
  const navigate = useNavigate()

  async function handleComplete() {
    try {
      const profile = await api.extractProfile({ session_id: session.id, language })
      setProfile(profile)
      navigate('/profile')
    } catch (_) { /* stay on page */ }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="section-title mb-1">IVR कॉल सिमुलेशन · Feature-phone channel</h1>
      <p className="mb-5 text-sm text-slate-600">
        Dial the toll-free number, choose a language with the keypad, and complete the same
        skill interview — no smartphone, no internet, no literacy required.
      </p>
      <IVRSimulator onComplete={handleComplete} />
    </div>
  )
}
