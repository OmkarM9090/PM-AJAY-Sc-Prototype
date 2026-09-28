/** Screen 4 — ranked NSQF pathways, centres map, GIA benefits, PDF report. */

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Loader2, MapPin } from 'lucide-react'
import RecommendationCards from '../components/RecommendationCards'
import TrainingCenterMap from '../components/TrainingCenterMap'
import api from '../utils/apiClient'
import { useApp } from '../store/AppContext'
import { tr } from '../utils/strings'

export default function RecommendationsPage() {
  const { language, profile, recommendations, setRecommendations, session } = useApp()
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [gia, setGia] = useState(null)

  useEffect(() => {
    api.giaBenefits().then(setGia).catch(() => {})
  }, [])

  useEffect(() => {
    if (!recommendations && profile) {
      setLoading(true)
      api.recommend(profile, session?.id).then(setRecommendations).finally(() => setLoading(false))
    }
  }, [profile, recommendations, session, setRecommendations])

  const centres = useMemo(() => {
    const list = []
    const seen = new Set()
    for (const r of recommendations?.recommendations || []) {
      for (const c of r.all_centers || []) {
        if (!seen.has(c.center_id)) {
          seen.add(c.center_id)
          list.push(c)
        }
      }
    }
    return list
  }, [recommendations])

  async function download() {
    setDownloading(true)
    try {
      const blob = await api.generateReport(profile, recommendations.recommendations)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `JeevikaSetu_${(profile?.name || 'beneficiary').replace(/\s+/g, '_')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center">
        <p className="text-slate-600">
          No profile loaded yet.{' '}
          <Link to="/voice" className="font-semibold text-govblue underline">Start a voice conversation</Link>{' '}
          or pick a demo persona on the <Link to="/profile" className="font-semibold text-govblue underline">profile page</Link>.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="section-title">{tr('recsTitle', language)}</h1>
          <p className="text-sm text-slate-600">
            For <strong>{profile.name}</strong> · {profile.location?.district}, {profile.location?.state} ·
            travel limit {profile.mobility_range_km} km · prefers {profile.employment_preference}
          </p>
        </div>
        <button type="button" onClick={download} disabled={downloading || !recommendations} className="gov-btn-outline">
          {downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          {tr('download', language)}
        </button>
      </div>

      {loading && (
        <div className="gov-card flex items-center gap-3 p-6 text-slate-600">
          <Loader2 className="animate-spin" /> Matching your skills against{' '}
          {recommendations?.considered_qps || '50+'} NSQF qualification packs…
        </div>
      )}

      {recommendations && (
        <>
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            <span className="badge bg-govblue-50 text-govblue">
              {recommendations.considered_qps} eligible QPs evaluated
            </span>
            <span className="badge bg-saffron-50 text-saffron-dark">
              ranking engine: {recommendations.engine}
            </span>
            <span className="badge bg-indiagreen-50 text-indiagreen">
              {recommendations.recommendations.filter((r) => r.rpl_eligible).length} RPL pathways found
            </span>
          </div>

          <RecommendationCards recommendations={recommendations.recommendations} />

          <section className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="gov-card p-4">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-govblue">
                <MapPin size={16} /> Nearby empanelled training centres
              </h2>
              <TrainingCenterMap
                centers={centres}
                origin={{
                  latitude: recommendations.recommendations[0]?.nearest_center?.latitude,
                  longitude: recommendations.recommendations[0]?.nearest_center?.longitude,
                  label: `${profile.location?.district} (your district)`,
                }}
              />
            </div>

            {gia && (
              <div className="gov-card p-4">
                <h2 className="mb-2 text-sm font-bold text-govblue">
                  PM-AJAY GIA support heads
                </h2>
                <ul className="space-y-2 text-xs">
                  {gia.benefit_heads.map((b) => (
                    <li key={b.id} className="rounded-lg border border-slate-200 p-2">
                      <div className="font-semibold text-slate-800">
                        {b.name} <span className="font-normal text-slate-500">· {b.name_hi}</span>
                      </div>
                      <div className="text-slate-600">{b.description}</div>
                      <div className="mt-0.5 font-semibold text-indiagreen">₹ {b.indicative_amount_inr}</div>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] text-slate-400">{gia.disclaimer}</p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
