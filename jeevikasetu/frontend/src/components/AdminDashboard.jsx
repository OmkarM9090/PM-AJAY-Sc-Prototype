/** Official (MoSJE / State SC Welfare Dept) monitoring dashboard. */

import { useEffect, useMemo, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip,
  XAxis, YAxis,
} from 'recharts'
import { Building2, Languages, Radio, Users } from 'lucide-react'
import api from '../utils/apiClient'

const COLORS = ['#1a237e', '#FF9933', '#138808', '#3949ab', '#e07b1a', '#0d6606', '#7986cb']

function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="gov-card flex items-center gap-3 p-4">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-govblue-50 text-govblue">
        <Icon size={20} />
      </span>
      <div>
        <div className="text-2xl font-bold text-govblue">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
        {sub && <div className="text-[11px] text-indiagreen">{sub}</div>}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [rows, setRows] = useState([])
  const [utilisation, setUtilisation] = useState(null)
  const [filter, setFilter] = useState({ district: '', channel: '' })
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([api.dashboardStats(), api.schemeUtilisation()])
      .then(([s, u]) => { setStats(s); setUtilisation(u) })
      .catch(() => setError('Backend not reachable — start the FastAPI server.'))
  }, [])

  useEffect(() => {
    const params = {}
    if (filter.district) params.district = filter.district
    if (filter.channel) params.channel = filter.channel
    api.dashboardBeneficiaries(params).then((r) => setRows(r.beneficiaries)).catch(() => {})
  }, [filter])

  const maxHeat = useMemo(
    () => Math.max(1, ...(stats?.skill_demand_heatmap || []).map((d) => d.beneficiary_matches)),
    [stats],
  )

  if (error) return <div className="gov-card p-6 text-red-600">{error}</div>
  if (!stats) return <div className="gov-card p-6 text-slate-500">Loading programme analytics…</div>

  const t = stats.totals

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Beneficiaries profiled" value={t.beneficiaries_profiled}
              sub={`${t.completed_conversations} completed interviews`} />
        <Stat icon={Radio} label="Recommendations generated" value={t.recommendations_generated}
              sub={`${t.rpl_flagged} RPL-eligible cases`} />
        <Stat icon={Building2} label="Empanelled centres" value={t.training_centers}
              sub={`${t.nsqf_packs_in_catalogue} NSQF packs mapped`} />
        <Stat icon={Languages} label="Opportunities listed" value={t.opportunities}
              sub={`${t.messages_exchanged} voice turns handled`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="gov-card p-4">
          <h3 className="mb-2 text-sm font-bold text-govblue">Language distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={stats.language_distribution} dataKey="count" nameKey="language"
                   innerRadius={45} outerRadius={80} paddingAngle={2}>
                {stats.language_distribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="gov-card p-4">
          <h3 className="mb-2 text-sm font-bold text-govblue">Channel reach (voice-first)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.channel_distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="channel" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {stats.channel_distribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="gov-card p-4">
          <h3 className="mb-2 text-sm font-bold text-govblue">Top informal skills identified</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.top_skills.slice(0, 7)} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="skill" width={120} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#1a237e" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="gov-card p-4">
          <h3 className="mb-3 text-sm font-bold text-govblue">Skill demand heat map by district</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {stats.skill_demand_heatmap.map((d) => {
              const intensity = d.beneficiary_matches / maxHeat
              return (
                <div
                  key={d.district}
                  className="rounded-lg border border-slate-200 p-3"
                  style={{ background: `rgba(26,35,126,${0.06 + intensity * 0.35})` }}
                >
                  <div className="flex items-center justify-between text-sm font-semibold text-govblue">
                    {d.district}
                    <span>{d.beneficiary_matches}</span>
                  </div>
                  <div className="text-[11px] text-slate-600">Top demand: {d.top_sector}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="gov-card p-4">
          <h3 className="mb-3 text-sm font-bold text-govblue">Popular NSQF pathways</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.popular_pathways} layout="vertical" margin={{ left: 30 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="qp_name" width={170} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#138808" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {utilisation && (
        <div className="gov-card p-4">
          <h3 className="mb-3 text-sm font-bold text-govblue">
            Indicative PM-AJAY GIA utilisation (projected from top recommendations)
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {utilisation.heads.map((h) => (
              <div key={h.head} className="rounded-lg bg-saffron-50 p-3">
                <div className="text-xs uppercase tracking-wide text-saffron-dark">
                  {h.head.replace(/_/g, ' ')}
                </div>
                <div className="text-lg font-bold text-govblue">
                  ₹{(h.indicative_outlay_inr / 100000).toFixed(2)} lakh
                </div>
                <div className="text-[11px] text-slate-500">{h.beneficiaries} beneficiaries</div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">{utilisation.note}</p>
        </div>
      )}

      <div className="gov-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
          <h3 className="text-sm font-bold text-govblue">Beneficiary register</h3>
          <select
            value={filter.district}
            onChange={(e) => setFilter({ ...filter, district: e.target.value })}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="">All districts</option>
            {stats.district_distribution.map((d) => (
              <option key={d.district} value={d.district}>{d.district}</option>
            ))}
          </select>
          <select
            value={filter.channel}
            onChange={(e) => setFilter({ ...filter, channel: e.target.value })}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="">All channels</option>
            <option value="web">Web</option>
            <option value="ivr">IVR</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
          <span className="ml-auto text-xs text-slate-500">{rows.length} records</span>
        </div>

        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-govblue-50 text-xs uppercase text-govblue">
              <tr>
                {['Name', 'District', 'Education', 'Channel', 'Preference', 'Top recommendation', 'Match', 'RPL'].map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.profile_id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-800">{r.name}</td>
                  <td className="px-3 py-2 text-slate-600">{r.location?.district}</td>
                  <td className="px-3 py-2 text-slate-600">{r.education}</td>
                  <td className="px-3 py-2">
                    <span className="badge bg-slate-100 text-slate-600">{r.channel}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{r.employment_preference}</td>
                  <td className="px-3 py-2 text-slate-700">{r.top_recommendation || '—'}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {r.top_match_pct != null ? `${Math.round(r.top_match_pct)}%` : '—'}
                  </td>
                  <td className="px-3 py-2">
                    {r.rpl_flag ? <span className="badge bg-indiagreen text-white">RPL</span> : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
