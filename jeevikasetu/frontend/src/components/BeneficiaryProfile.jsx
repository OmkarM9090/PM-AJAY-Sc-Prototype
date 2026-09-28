/** Editable Beneficiary Profile card produced by the extraction engine. */

import { useState } from 'react'
import {
  Briefcase, Check, GraduationCap, Heart, Languages, MapPin, Pencil, Route, User, Wrench,
} from 'lucide-react'
import SkillRadarChart from './SkillRadarChart'

function Field({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={16} className="mt-0.5 shrink-0 text-govblue" />
      <div>
        <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
        <div className="text-sm font-medium text-slate-800">{value || '—'}</div>
      </div>
    </div>
  )
}

export default function BeneficiaryProfile({ profile, onChange, editable = true }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(profile)

  if (!profile) return null
  const p = editing ? draft : profile
  const loc = p.location || {}

  const save = () => {
    setEditing(false)
    onChange?.(draft)
  }

  const setField = (key, value) => setDraft({ ...draft, [key]: value })
  const setLoc = (key, value) => setDraft({ ...draft, location: { ...draft.location, [key]: value } })

  return (
    <div className="gov-card overflow-hidden">
      <div className="flex items-center justify-between bg-govblue px-5 py-3 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-xl font-bold">
            {(p.name || '?').charAt(0)}
          </span>
          <div>
            <h2 className="text-lg font-bold">{p.name}</h2>
            <p className="text-xs opacity-85">
              {p.category || 'SC'} · {loc.district}, {loc.state} · {p.channel || 'web'} channel
            </p>
          </div>
        </div>
        {editable && (
          <button
            type="button"
            onClick={() => (editing ? save() : (setDraft(profile), setEditing(true)))}
            className="badge bg-white/15 hover:bg-white/25"
          >
            {editing ? <Check size={14} /> : <Pencil size={14} />} {editing ? 'Save' : 'Edit'}
          </button>
        )}
      </div>

      <div className="grid gap-5 p-5 md:grid-cols-2">
        <div className="space-y-4">
          {editing ? (
            <div className="space-y-2 text-sm">
              {[
                ['name', 'Name'], ['education', 'Education'], ['family_occupation', 'Family occupation'],
                ['current_livelihood', 'Current work'], ['employment_preference', 'Preference'],
                ['physical_constraints', 'Constraints'],
              ].map(([key, label]) => (
                <label key={key} className="block">
                  <span className="text-[11px] uppercase text-slate-400">{label}</span>
                  <input
                    value={p[key] ?? ''}
                    onChange={(e) => setField(key, e.target.value)}
                    className="w-full rounded border border-slate-300 px-2 py-1.5"
                  />
                </label>
              ))}
              <div className="grid grid-cols-3 gap-2">
                {['village', 'district', 'state'].map((k) => (
                  <label key={k} className="block">
                    <span className="text-[11px] uppercase text-slate-400">{k}</span>
                    <input
                      value={loc[k] ?? ''}
                      onChange={(e) => setLoc(k, e.target.value)}
                      className="w-full rounded border border-slate-300 px-2 py-1.5"
                    />
                  </label>
                ))}
              </div>
              <label className="block">
                <span className="text-[11px] uppercase text-slate-400">Mobility (km)</span>
                <input
                  type="number"
                  value={p.mobility_range_km ?? 10}
                  onChange={(e) => setField('mobility_range_km', Number(e.target.value))}
                  className="w-full rounded border border-slate-300 px-2 py-1.5"
                />
              </label>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Field icon={User} label="Age" value={p.age ?? 'Not stated'} />
              <Field icon={GraduationCap} label="Education" value={p.education} />
              <Field icon={MapPin} label="Village / District" value={`${loc.village || '—'} · ${loc.district || '—'}`} />
              <Field icon={Route} label="Can travel" value={`${p.mobility_range_km ?? '—'} km`} />
              <Field icon={Briefcase} label="Family occupation" value={p.family_occupation} />
              <Field icon={Wrench} label="Current livelihood" value={p.current_livelihood} />
              <Field icon={Heart} label="Constraints" value={p.physical_constraints || 'none'} />
              <Field icon={Languages} label="Languages" value={(p.languages_spoken || []).join(', ')} />
            </div>
          )}

          <div>
            <div className="mb-1.5 text-[11px] uppercase tracking-wide text-slate-400">
              Identified skills (incl. informal / traditional)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(p.identified_skills || []).map((s) => (
                <span key={s} className="badge bg-govblue-50 text-govblue">{s}</span>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-[11px] uppercase tracking-wide text-slate-400">Interests / aspirations</div>
            <div className="flex flex-wrap gap-1.5">
              {(p.interests || []).map((s) => (
                <span key={s} className="badge bg-saffron-50 text-saffron-dark">{s}</span>
              ))}
              {(p.interest_sectors || []).map((s) => (
                <span key={s} className="badge bg-indiagreen-50 text-indiagreen">sector: {s}</span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
            <span className="badge bg-slate-100 text-slate-600">
              preference: {p.employment_preference}
            </span>
            <span className="badge bg-slate-100 text-slate-600">
              extractor: {p.extraction_engine || 'offline-rule-extractor'}
            </span>
          </div>
        </div>

        <div>
          <div className="mb-1 text-center text-xs font-semibold text-govblue">Skill map</div>
          <SkillRadarChart skills={p.identified_skills || []} />
          <details className="mt-2 rounded-lg bg-slate-50 p-3 text-xs">
            <summary className="cursor-pointer font-semibold text-govblue">View profile JSON</summary>
            <pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap text-[10px] leading-snug text-slate-600">
              {JSON.stringify(p, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  )
}
