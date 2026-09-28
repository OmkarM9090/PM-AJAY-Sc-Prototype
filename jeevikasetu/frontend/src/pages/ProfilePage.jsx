/** Screen 3 — extracted beneficiary profile (editable) + persona shortcuts. */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Sparkles, UserCheck } from 'lucide-react'
import BeneficiaryProfile from '../components/BeneficiaryProfile'
import api from '../utils/apiClient'
import { useApp } from '../store/AppContext'
import { tr } from '../utils/strings'

export default function ProfilePage() {
  const { language, profile, setProfile, session, setRecommendations } = useApp()
  const [personas, setPersonas] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    api.personas().then((r) => setPersonas(r.personas)).catch(() => {})
  }, [])

  function loadPersona(p) {
    setProfile({
      name: p.name, age: p.age, gender: p.gender, location: p.location,
      education: p.education, category: p.category,
      family_occupation: p.family_occupation, current_livelihood: p.current_livelihood,
      identified_skills: p.identified_skills, interests: p.interests,
      employment_preference: p.employment_preference, mobility_range_km: p.mobility_range_km,
      physical_constraints: p.physical_constraints, languages_spoken: p.languages_spoken,
      extraction_engine: 'curated-demo-persona',
    })
  }

  async function generate() {
    if (!profile) return
    setLoading(true)
    try {
      const res = await api.recommend(profile, session?.id)
      setRecommendations(res)
      navigate('/recommendations')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="section-title mb-1">{tr('profileTitle', language)}</h1>
      <p className="mb-4 text-sm text-slate-600">
        Extracted automatically from the voice conversation. Anything the AI misheard can be
        corrected here before recommendations are generated.
      </p>

      {profile ? (
        <>
          <BeneficiaryProfile
            profile={profile}
            onChange={(p) => {
              setProfile(p)
              api.saveProfile(session?.id, p).catch(() => {})
            }}
          />
          <div className="mt-5 flex justify-end">
            <button type="button" onClick={generate} disabled={loading} className="gov-btn-saffron text-lg">
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
              {tr('generateRecs', language)}
            </button>
          </div>
        </>
      ) : (
        <div className="gov-card p-6">
          <p className="mb-4 text-slate-600">
            No profile yet. Complete a voice conversation, or load one of the curated demo personas
            below to jump straight to the recommendation engine.
          </p>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {personas.map((p) => (
              <button
                key={p.persona_id}
                type="button"
                onClick={() => loadPersona(p)}
                className="rounded-xl border border-slate-200 p-4 text-left hover:border-govblue hover:bg-govblue-50"
              >
                <div className="flex items-center gap-2 font-bold text-govblue">
                  <UserCheck size={16} /> {p.name}, {p.age}
                </div>
                <div className="text-xs text-slate-500">
                  {p.location.district}, {p.location.state} · {p.education}
                </div>
                <p className="mt-1 text-sm text-slate-600">{p.story}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
