/** Radar chart of competency strength by skill family (from extracted skills). */

import {
  PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer,
} from 'recharts'

// Map raw competency tokens into readable skill families for visualisation.
const FAMILIES = {
  'Craft & Making': ['leather', 'stitch', 'weav', 'loom', 'knot', 'embroider', 'clay', 'bamboo', 'cutting', 'pattern', 'tooling', 'finishing', 'dough'],
  'Technical Repair': ['solder', 'diagnos', 'wiring', 'repair', 'servic', 'engine', 'brake', 'circuit', 'panel', 'electr'],
  'Construction & Manual': ['brick', 'mortar', 'concrete', 'plaster', 'labor', 'labour', 'carpentry', 'levelling', 'bar ', 'formwork'],
  'Agri & Livestock': ['soil', 'crop', 'organic', 'pest', 'cattle', 'milk', 'bird', 'feed', 'hive', 'tractor', 'field', 'compost', 'grain'],
  'Service & Customer': ['customer', 'communicat', 'billing', 'client', 'table service', 'guest', 'empathy', 'stock'],
  'Care & Hygiene': ['hygiene', 'clean', 'patient', 'child', 'elderly', 'first aid', 'household', 'personal'],
  'Digital & Records': ['computer', 'typing', 'data', 'digital', 'account', 'record', 'documentation'],
}

export default function SkillRadarChart({ skills = [], height = 260 }) {
  const data = Object.entries(FAMILIES).map(([family, keys]) => {
    const count = skills.filter((s) => keys.some((k) => s.toLowerCase().includes(k))).length
    return { family, value: Math.min(100, count * 28) }
  })

  const hasSignal = data.some((d) => d.value > 0)

  return (
    <div className="w-full" style={{ height }}>
      {hasSignal ? (
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke="#cbd5e1" />
            <PolarAngleAxis dataKey="family" tick={{ fontSize: 10, fill: '#475569' }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar dataKey="value" stroke="#1a237e" fill="#3949ab" fillOpacity={0.45} />
          </RadarChart>
        </ResponsiveContainer>
      ) : (
        <p className="pt-16 text-center text-sm text-slate-400">No skills mapped yet</p>
      )}
    </div>
  )
}
