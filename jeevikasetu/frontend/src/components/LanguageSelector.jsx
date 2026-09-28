/** Language chooser — 6 Indian languages, always visible (voice-first users). */

import { Globe } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { LANGUAGES } from '../utils/strings'

export default function LanguageSelector({ compact = false }) {
  const { language, setLanguage } = useApp()

  if (compact) {
    return (
      <label className="flex items-center gap-2 text-sm">
        <Globe size={16} className="text-saffron" aria-hidden />
        <select
          aria-label="Select language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded-md border border-white/30 bg-white/10 px-2 py-1 text-white outline-none"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code} className="text-slate-900">
              {l.label}
            </option>
          ))}
        </select>
      </label>
    )
  }

  return (
    <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Language selection">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLanguage(l.code)}
          className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
            language === l.code
              ? 'border-govblue bg-govblue text-white shadow'
              : 'border-slate-300 bg-white text-slate-700 hover:border-govblue'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
