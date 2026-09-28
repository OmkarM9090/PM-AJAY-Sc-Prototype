/**
 * Opportunity & catalogue explorer (Module 5).
 * Four views over the curated datasets, all filtered by the beneficiary's
 * district, mobility limit and education eligibility when a profile exists.
 */

import { useEffect, useMemo, useState } from 'react'
import { Banknote, Briefcase, Building2, GraduationCap, MapPin, Search, Store } from 'lucide-react'
import api from '../utils/apiClient'
import { useApp } from '../store/AppContext'
import TrainingCenterMap from './TrainingCenterMap'

const TABS = [
  { id: 'job', label: 'Wage jobs', icon: Briefcase },
  { id: 'self-employment', label: 'Self-employment', icon: Store },
  { id: 'centers', label: 'Training centres', icon: Building2 },
  { id: 'nsqf', label: 'NSQF catalogue', icon: GraduationCap },
]

const EDU_RANK = {
  'no formal education': 0, 'not specified': 1, '5th pass': 1, '6th pass': 1, '7th pass': 1,
  '8th pass': 2, '9th pass': 2, '10th pass': 3, '12th pass': 4, graduate: 5,
}
const rank = (e) => EDU_RANK[(e || '').toLowerCase()] ?? 1

export default function OpportunityExplorer() {
  const { profile } = useApp()
  const [tab, setTab] = useState('job')
  const [district, setDistrict] = useState(profile?.location?.district || 'Varanasi')
  const [sector, setSector] = useState('')
  const [query, setQuery] = useState('')
  const [onlyEligible, setOnlyEligible] = useState(Boolean(profile))
  const [maxKm, setMaxKm] = useState(profile?.mobility_range_km || 100)
  const [data, setData] = useState({ job: [], 'self-employment': [], centers: [], nsqf: [] })
  const [sectors, setSectors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.opportunities({ district, type: 'job' }),
      api.opportunities({ district, type: 'self-employment' }),
      api.trainingCenters({ district }),
      api.qualificationPacks({}),
    ])
      .then(([jobs, se, centers, packs]) => {
        setData({
          job: jobs.opportunities,
          'self-employment': se.opportunities,
          centers: centers.centers,
          nsqf: packs.qualification_packs,
        })
        setSectors(packs.sectors)
      })
      .finally(() => setLoading(false))
  }, [district])

  const districts = useMemo(
    () => [...new Set([...data.centers.map((c) => c.district), district])].sort(),
    [data.centers, district],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const bySector = (x) => !sector || x.sector === sector
    const byQuery = (x) =>
      !q || `${x.title || x.qp_name || x.name} ${x.employer || ''} ${x.qp_code || ''}`.toLowerCase().includes(q)

    if (tab === 'centers') {
      return data.centers.filter((c) => byQuery(c) && (!maxKm || c.distance_km <= maxKm))
    }
    if (tab === 'nsqf') {
      return data.nsqf.filter(
        (p) => bySector(p) && byQuery(p) &&
          (!onlyEligible || !profile || rank(profile.education) >= rank(p.required_education) - 1),
      )
    }
    return data[tab].filter(
      (o) => bySector(o) && byQuery(o) &&
        (!maxKm || o.distance_km == null || o.distance_km <= maxKm) &&
        (!onlyEligible || !profile || o.type === 'self-employment' ||
          rank(profile.education) >= rank(o.min_education)),
    )
  }, [tab, data, sector, query, maxKm, onlyEligible, profile])

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === t.id ? 'bg-govblue text-white' : 'bg-white text-slate-600 hover:bg-govblue-50'
            }`}
          >
            <t.icon size={16} /> {t.label}
            <span className="rounded bg-black/10 px-1.5 text-xs">{data[t.id]?.length ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="gov-card flex flex-wrap items-end gap-3 p-4">
        <label className="text-xs">
          <span className="mb-1 block uppercase text-slate-400">District</span>
          <select value={district} onChange={(e) => setDistrict(e.target.value)}
                  className="rounded border border-slate-300 px-2 py-1.5 text-sm">
            {districts.map((d) => <option key={d}>{d}</option>)}
          </select>
        </label>
        <label className="text-xs">
          <span className="mb-1 block uppercase text-slate-400">Sector</span>
          <select value={sector} onChange={(e) => setSector(e.target.value)}
                  className="rounded border border-slate-300 px-2 py-1.5 text-sm">
            <option value="">All sectors</option>
            {sectors.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="text-xs">
          <span className="mb-1 block uppercase text-slate-400">Within {maxKm} km</span>
          <input type="range" min="5" max="500" step="5" value={maxKm}
                 onChange={(e) => setMaxKm(Number(e.target.value))} className="w-40 accent-govblue" />
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input type="checkbox" checked={onlyEligible} onChange={(e) => setOnlyEligible(e.target.checked)} />
          Only what {profile?.name || 'the beneficiary'} is eligible for
        </label>
        <label className="ml-auto flex items-center gap-2 rounded border border-slate-300 px-2 py-1.5">
          <Search size={15} className="text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
                 placeholder="Search…" className="w-40 text-sm outline-none" />
        </label>
      </div>

      {loading && <div className="gov-card p-6 text-slate-500">Loading curated datasets…</div>}

      {/* Centres view gets a map */}
      {tab === 'centers' && !loading && (
        <div className="gov-card p-4">
          <TrainingCenterMap centers={filtered} height={300} />
        </div>
      )}

      {/* Results */}
      {!loading && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.length === 0 && (
            <div className="gov-card col-span-full p-6 text-center text-slate-500">
              No matches for these filters. Widen the travel radius or clear the eligibility filter.
            </div>
          )}

          {tab === 'job' && filtered.map((o) => (
            <article key={o.opportunity_id} className="gov-card p-4">
              <h3 className="font-bold text-govblue">{o.title}</h3>
              <p className="text-xs text-slate-500">{o.employer}</p>
              <div className="mt-2 space-y-1 text-sm text-slate-600">
                <div className="flex items-center gap-1.5"><MapPin size={14} /> {o.district}, {o.state}
                  {o.distance_km != null && ` · ${o.distance_km} km`}</div>
                <div className="flex items-center gap-1.5"><Banknote size={14} className="text-indiagreen" /> ₹{o.monthly_income_range}/month</div>
                <div className="flex items-center gap-1.5"><GraduationCap size={14} /> {o.min_education}</div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                <span className="badge bg-govblue-50 text-govblue">{o.linked_qp}</span>
                <span className="badge bg-slate-100 text-slate-600">{o.sector}</span>
                <span className="badge bg-saffron-50 text-saffron-dark">{o.openings} openings</span>
              </div>
            </article>
          ))}

          {tab === 'self-employment' && filtered.map((o) => (
            <article key={o.opportunity_id} className="gov-card p-4">
              <h3 className="font-bold text-govblue">{o.title}</h3>
              <p className="text-xs text-slate-500">{o.district}, {o.state}
                {o.distance_km != null && ` · ${o.distance_km} km`}</p>
              <div className="mt-2 space-y-1 text-sm text-slate-600">
                <div>💰 Investment ₹{o.required_investment_inr.toLocaleString('en-IN')}</div>
                <div className="text-indiagreen">📈 ₹{o.monthly_income_range}/month</div>
                <div className="text-xs">🧰 {o.tools_required.join(', ')}</div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                <span className="badge bg-govblue-50 text-govblue">{o.linked_qp}</span>
                <span className="badge bg-indiagreen-50 text-indiagreen">
                  GIA: {o.gia_support_head.replace(/_/g, ' ')}
                </span>
              </div>
            </article>
          ))}

          {tab === 'centers' && filtered.map((c) => (
            <article key={c.center_id} className="gov-card p-4">
              <h3 className="font-bold text-govblue">{c.name}</h3>
              <p className="text-xs text-slate-500">{c.district}, {c.state} · {c.distance_km} km</p>
              <div className="mt-2 text-sm text-slate-600">
                <div>📚 {c.courses_offered.join(', ')}</div>
                <div>🗓 Next batch {c.next_batch_start} · capacity {c.annual_capacity}/yr</div>
                <div>{c.hostel_available ? '🏠 Hostel available' : '🚌 Day-scholar only'} · ☎ {c.contact}</div>
              </div>
            </article>
          ))}

          {tab === 'nsqf' && filtered.map((p) => (
            <article key={p.qp_code} className="gov-card p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-govblue">{p.qp_name}</h3>
                <span className="badge shrink-0 bg-govblue-50 text-govblue">L{p.nsqf_level}</span>
              </div>
              <p className="text-xs text-slate-500">{p.qp_code} · {p.sector} · {p.certification_body}</p>
              <div className="mt-2 space-y-1 text-sm text-slate-600">
                <div>🎯 {p.required_skills.slice(0, 4).join(', ')}</div>
                <div>⏱ {p.duration_hours} hrs · min {p.required_education}</div>
                <div className="text-indiagreen">₹{p.avg_monthly_income_range}/month</div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                {p.rpl_eligible && <span className="badge bg-indiagreen text-white">RPL eligible</span>}
                <span className="badge bg-saffron-50 text-saffron-dark">
                  self-employment: {p.self_employment_potential}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
