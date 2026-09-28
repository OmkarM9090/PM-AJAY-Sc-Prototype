/** Footer with partner-scheme logo bar and prototype disclaimer. */

import AshokaChakra from './AshokaChakra'

const LOGOS = [
  { name: 'PM-AJAY', sub: 'प्रधानमंत्री अनुसूचित जाति अभ्युदय योजना' },
  { name: 'MoSJE', sub: 'Ministry of Social Justice & Empowerment' },
  { name: 'Digital India', sub: 'Power to Empower' },
  { name: 'Skill India', sub: 'कौशल भारत — कुशल भारत' },
  { name: 'NSQF / NCVET', sub: 'National Skills Qualification Framework' },
]

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {LOGOS.map((l) => (
            <div key={l.name} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
              <AshokaChakra className="h-8 w-8 shrink-0" spokes={12} />
              <div>
                <div className="text-sm font-bold text-govblue">{l.name}</div>
                <div className="text-[11px] leading-tight text-slate-500">{l.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-2 text-xs text-slate-500 md:flex md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} JeevikaSetu · Smart India Hackathon 2026 · Problem Statement{' '}
            <strong className="text-govblue">26097</strong> · Ministry of Social Justice &amp; Empowerment
          </p>
          <p className="md:text-right">
            Prototype for evaluation. NSQF packs, centres and benefit amounts are indicative demo data.
          </p>
        </div>
      </div>
      <div className="tricolour-bar h-1" />
    </footer>
  )
}
