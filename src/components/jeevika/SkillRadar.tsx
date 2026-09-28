"use client";

import { BeneficiaryProfile } from "@/lib/api";

const AREAS = ["Craft", "Technical", "Service", "Digital", "Enterprise"];
function level(profile: BeneficiaryProfile, index: number) {
  const values = profile.identified_skills.join(" ").toLowerCase() + " " + profile.interests.join(" ").toLowerCase();
  const matches = [/(leather|stitch|weav|craft|embroid)/, /(repair|construction|wiring|plumb|mobile|driv)/, /(care|customer|beauty|food)/, /(computer|data|digital|mobile)/, /(business|self|enterprise|sale)/];
  return matches[index].test(values) ? 72 : profile.identified_skills.length ? 35 : 12;
}
function point(index: number, radius: number) { const angle = -Math.PI / 2 + (index * Math.PI * 2) / AREAS.length; return `${120 + Math.cos(angle) * radius},${120 + Math.sin(angle) * radius}`; }
export function SkillRadar({ profile }: { profile: BeneficiaryProfile }) {
  const rings = [25, 48, 71, 94].map((radius) => AREAS.map((_, index) => point(index, radius)).join(" "));
  const shape = AREAS.map((_, index) => point(index, level(profile, index))).join(" ");
  return <div className="radar-wrap card"><h3 className="section-heading">Skill signal map</h3><svg viewBox="0 0 240 240" role="img" aria-label="Indicative skill signal radar chart">{rings.map((ring, index) => <polygon key={index} points={ring} fill="none" stroke="#d6e1ec" strokeWidth="1"/>)}{AREAS.map((area, index) => <g key={area}><line x1="120" y1="120" x2={point(index, 102).split(",")[0]} y2={point(index, 102).split(",")[1]} stroke="#d6e1ec"/><text x={point(index, 113).split(",")[0]} y={point(index, 113).split(",")[1]} textAnchor="middle" dominantBaseline="middle" fill="#53667b" fontSize="10" fontWeight="700">{area}</text></g>)}<polygon points={shape} fill="rgba(19,136,8,.19)" stroke="#138808" strokeWidth="2"/></svg><div className="radar-legend"><span>Indicative signals from the conversation</span><span className="tag tag--saffron">Not a formal assessment</span></div></div>;
}
