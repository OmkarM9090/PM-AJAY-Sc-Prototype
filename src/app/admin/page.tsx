"use client";

import { useEffect, useState, type ReactNode } from "react";
import { BarChart3, Database, Languages, LoaderCircle, ShieldCheck, UsersRound } from "lucide-react";
import { api } from "@/lib/api";

type Measure = { name: string; count: number };
type DistrictMeasure = { district: string; signals: number };
type PathwayMeasure = { name: string; value: number };
type Stats = {
  total_beneficiaries: number; live_demo_sessions: number; language_distribution: Record<string, number>;
  top_skills: Measure[]; pathway_demand: PathwayMeasure[]; district_demand: DistrictMeasure[];
  catalogue: { qualification_packs: number; training_centers: number; opportunities: number }; notice: string;
};
type SessionRow = { id: string; channel: string; language: string; district: string; skills: string[]; status: string };

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>(); const [rows, setRows] = useState<SessionRow[]>([]); const [notice, setNotice] = useState(""); const [loading, setLoading] = useState(true);
  useEffect(() => { Promise.all([api.stats(), api.beneficiaries()]).then(([overview, people]) => { setStats(overview as unknown as Stats); setRows(people.beneficiaries as unknown as SessionRow[]); setNotice(people.notice); }).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="page-shell"><div className="loading-panel card"><LoaderCircle className="animate-spin"/> Loading de-identified prototype insights…</div></div>;
  const languageDistribution = Object.entries(stats?.language_distribution || {}); const maxLanguage = Math.max(...languageDistribution.map(([, count]) => count), 1); const topSkills = stats?.top_skills || []; const maxSkills = Math.max(...topSkills.map((item) => item.count), 1);
  return <div className="page-shell">
    <p className="page-eyebrow">Separate official / counsellor view</p><h1 className="page-title">Livelihood signals dashboard</h1><p className="page-subtitle">A monitoring-oriented prototype view with aggregate, fictional baseline signals and de-identified local test sessions.</p>
    <div className="notice notice--blue admin-note"><ShieldCheck size={15} style={{ verticalAlign: "-3px", marginRight: 5 }}/><b>Privacy by design:</b> beneficiary phone numbers, Aadhaar and caste identifiers are not shown in this dashboard. {stats?.notice}</div>
    <section className="admin-grid"><Stat icon={<UsersRound/>} label="Illustrative beneficiaries" value={String(stats?.total_beneficiaries || 0)} sub={`${stats?.live_demo_sessions || 0} local test sessions`}/><Stat icon={<Languages/>} label="Languages represented" value={String(languageDistribution.filter(([, count]) => count > 0).length)} sub="Selected / detected signal"/><Stat icon={<Database/>} label="Qualification packs" value={String(stats?.catalogue?.qualification_packs || 0)} sub="Curated demo catalogue"/><Stat icon={<BarChart3/>} label="Training centres" value={String(stats?.catalogue?.training_centers || 0)} sub={`${stats?.catalogue?.opportunities || 0} illustrative opportunities`}/></section>
    <section className="admin-panels"><article className="panel card"><h2 className="section-heading">Language distribution</h2><div className="bar-list">{languageDistribution.map(([language, count]) => <Bar key={language} label={language} value={count} max={maxLanguage}/>)}</div><h2 className="section-heading" style={{ marginTop: 25 }}>Top skills identified</h2><div className="bar-list">{topSkills.map((skill) => <Bar key={skill.name} label={skill.name} value={skill.count} max={maxSkills} green/>)}</div></article><article className="panel card"><h2 className="section-heading">District skill-demand signals</h2><p className="muted" style={{ fontSize: 12, marginTop: -8 }}>Illustrative heat-map substitute for a low-bandwidth official view.</p><div className="district-heat-grid" style={{ marginTop: 18 }}>{(stats?.district_demand || []).map((item) => <div className="district-heat" key={item.district} style={{ backgroundColor: `rgba(19, 136, 8, ${Math.max(.14, item.signals / 80)})` }}><b>{item.district}</b><span>{item.signals} signals</span></div>)}</div><h2 className="section-heading" style={{ marginTop: 25 }}>Preferred pathway mix</h2>{(stats?.pathway_demand || []).map((item) => <div key={item.name} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #e5edf5", fontSize: 13 }}><span>{item.name}</span><b style={{ color: "#003366" }}>{item.value}%</b></div>)}</article></section>
    <section className="panel card" style={{ marginTop: 17 }}><h2 className="section-heading">Recent local prototype sessions</h2><p className="muted" style={{ fontSize: 12 }}>{notice}</p><div className="table-wrap"><table className="admin-table"><thead><tr><th>Session</th><th>Channel</th><th>Language</th><th>District</th><th>Signals captured</th><th>Status</th></tr></thead><tbody>{rows.length ? rows.map((row) => <tr key={row.id}><td>{row.id}</td><td style={{ textTransform: "capitalize" }}>{row.channel}</td><td>{row.language}</td><td>{row.district}</td><td>{row.skills.join(", ") || "—"}</td><td><span className="tag tag--green">{row.status}</span></td></tr>) : <tr><td colSpan={6} style={{ textAlign: "center", color: "#607488" }}>No local sessions yet. Start a voice or demo session to see de-identified activity.</td></tr>}</tbody></table></div></section>
  </div>;
}
function Stat({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub: string }) { return <article className="stat-card card"><span style={{ color: "#138808" }}>{icon}</span><span style={{ marginTop: 7 }}>{label}</span><b>{value}</b><small className="muted">{sub}</small></article>; }
function Bar({ label, value, max, green = false }: { label: string; value: number; max: number; green?: boolean }) { return <div className="bar-row"><span>{label}</span><div className="bar-track"><i className={green ? "green" : ""} style={{ width: `${Math.max(4, (value / max) * 100)}%` }}/></div><b>{value}</b></div>; }
