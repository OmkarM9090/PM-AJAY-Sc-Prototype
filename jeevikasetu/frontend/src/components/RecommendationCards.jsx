/** Ranked NSQF pathway cards with skill-gap, RPL, roadmap and GIA support. */

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Award, BadgeCheck, Banknote, ChevronDown, Clock, MapPin, Target, TrendingUp,
} from 'lucide-react'

function MatchBar({ pct }) {
  const colour = pct >= 80 ? 'bg-indiagreen' : pct >= 50 ? 'bg-saffron' : 'bg-govblue-light'
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div className={`h-full rounded-full ${colour}`} style={{ width: `${Math.max(pct, 3)}%` }} />
    </div>
  )
}

export default function RecommendationCards({ recommendations = [], onSelect }) {
  const [open, setOpen] = useState(recommendations.length ? recommendations[0].qp_code : null)

  return (
    <div className="space-y-4">
      {recommendations.map((r) => {
        const expanded = open === r.qp_code
        const centre = r.nearest_center
        return (
          <motion.article
            key={r.qp_code}
            layout
            className="gov-card overflow-hidden"
          >
            <button
              type="button"
              onClick={() => { setOpen(expanded ? null : r.qp_code); onSelect?.(r) }}
              className="flex w-full items-start gap-4 p-4 text-left hover:bg-slate-50"
            >
              <span className="text-2xl leading-none">{r.medal}</span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-govblue md:text-lg">{r.qp_name}</h3>
                  <span className="badge bg-govblue-50 text-govblue">NSQF L{r.nsqf_level}</span>
                  <span className="badge bg-slate-100 text-slate-600">{r.qp_code}</span>
                  {r.rpl_eligible && (
                    <span className="badge bg-indiagreen text-white">
                      <BadgeCheck size={13} /> RPL ELIGIBLE
                    </span>
                  )}
                </div>

                <div className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <div className="mb-1 flex items-center gap-1 text-xs text-slate-500">
                      <Target size={13} /> Skill match <strong className="text-slate-700">{r.skill_match_pct}%</strong>
                    </div>
                    <MatchBar pct={r.skill_match_pct} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-saffron" /> {r.training_duration_label} ({r.training_hours} hrs)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Banknote size={14} className="text-indiagreen" /> ₹{r.income_range}/month
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-govblue" />
                    {centre ? `${centre.distance_km} km — ${centre.district}` : 'Centre on request'}
                  </div>
                </div>
              </div>

              <ChevronDown
                size={20}
                className={`mt-1 shrink-0 text-slate-400 transition ${expanded ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-slate-200"
                >
                  <div className="grid gap-5 p-5 md:grid-cols-2">
                    {/* Gap analysis */}
                    <section>
                      <h4 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-govblue">
                        <Target size={15} /> Skill gap analysis
                      </h4>
                      <p className="mb-2 text-xs text-slate-500">
                        Pathway: <strong className="text-slate-700">{r.pathway_label}</strong>
                      </p>
                      <div className="mb-2">
                        <div className="text-[11px] uppercase text-slate-400">Already demonstrated</div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {r.matched_competencies.length === 0 && (
                            <span className="text-xs text-slate-400">None yet — fresh-start pathway</span>
                          )}
                          {r.matched_competencies.map((m) => (
                            <span key={m.competency} className="badge bg-indiagreen-50 text-indiagreen" title={`evidence: ${m.evidence_skill}`}>
                              ✓ {m.competency}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase text-slate-400">Needs training</div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {r.skill_gaps.length === 0 && (
                            <span className="badge bg-indiagreen-50 text-indiagreen">No gaps — direct RPL certification</span>
                          )}
                          {r.skill_gaps.map((g) => (
                            <span key={g} className="badge bg-red-50 text-red-700">⚠ {g}</span>
                          ))}
                        </div>
                      </div>

                      <h4 className="mb-2 mt-4 flex items-center gap-1.5 text-sm font-bold text-govblue">
                        <Award size={15} /> PM-AJAY GIA support
                      </h4>
                      <ul className="space-y-1 text-xs text-slate-600">
                        {r.gia_benefits.map((b) => (
                          <li key={b.id} className="rounded bg-saffron-50 px-2 py-1">
                            <strong className="text-saffron-dark">{b.name}</strong> — {b.indicative_amount_inr}
                          </li>
                        ))}
                      </ul>
                    </section>

                    {/* Roadmap + why */}
                    <section>
                      <h4 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-govblue">
                        <TrendingUp size={15} /> Roadmap
                      </h4>
                      <ol className="relative space-y-3 border-l-2 border-dashed border-slate-300 pl-5">
                        {r.roadmap.map((s) => (
                          <li key={s.step} className="relative">
                            <span className="absolute -left-[26px] flex h-5 w-5 items-center justify-center rounded-full bg-govblue text-[10px] font-bold text-white">
                              {s.step}
                            </span>
                            <div className="text-sm font-semibold text-slate-800">{s.title}</div>
                            <div className="text-xs text-slate-500">{s.detail}</div>
                            <div className="text-[11px] font-medium text-saffron-dark">{s.duration}</div>
                          </li>
                        ))}
                      </ol>

                      {centre && (
                        <div className="mt-4 rounded-lg bg-govblue-50 p-3 text-xs text-slate-700">
                          <div className="font-bold text-govblue">{centre.name}</div>
                          <div>
                            {centre.district}, {centre.state} · {centre.distance_km} km ·{' '}
                            {centre.within_mobility ? (
                              <span className="text-indiagreen">within your travel limit</span>
                            ) : (
                              <span className="text-red-600">beyond travel limit — hostel/travel support applies</span>
                            )}
                          </div>
                          <div>Next batch: {centre.next_batch_start} · ☎ {centre.contact}</div>
                        </div>
                      )}

                      <details className="mt-3 rounded-lg bg-slate-50 p-3 text-xs">
                        <summary className="cursor-pointer font-semibold text-govblue">
                          Why this recommendation? (explainable score)
                        </summary>
                        <p className="mt-2 leading-relaxed text-slate-600">{r.why}</p>
                        <table className="mt-2 w-full text-[11px]">
                          <tbody>
                            {Object.entries(r.score_breakdown)
                              .filter(([k]) => k !== 'weights')
                              .map(([k, v]) => (
                                <tr key={k}>
                                  <td className="py-0.5 pr-2 capitalize text-slate-500">{k.replace(/_/g, ' ')}</td>
                                  <td className="w-1/2">
                                    <div className="h-1.5 rounded bg-slate-200">
                                      <div className="h-full rounded bg-govblue" style={{ width: `${v * 100}%` }} />
                                    </div>
                                  </td>
                                  <td className="pl-2 text-right text-slate-600">{v}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                        <p className="mt-2 text-slate-500">Total score: {r.score_percent}/100</p>
                      </details>

                      {(r.linked_jobs?.length > 0 || r.linked_ventures?.length > 0) && (
                        <div className="mt-3 text-xs">
                          <div className="font-semibold text-govblue">Live opportunities nearby</div>
                          <ul className="mt-1 space-y-1 text-slate-600">
                            {r.linked_jobs?.map((j) => (
                              <li key={j.opportunity_id}>
                                💼 {j.title} — {j.employer}, {j.district} (₹{j.monthly_income_range})
                              </li>
                            ))}
                            {r.linked_ventures?.map((v) => (
                              <li key={v.opportunity_id}>
                                🏪 {v.title} — investment ₹{v.required_investment_inr?.toLocaleString('en-IN')} (₹{v.monthly_income_range})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </section>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.article>
        )
      })}
    </div>
  )
}
