/** Government-portal style masthead: emblem, tricolour rule, nav, a11y toggles. */

import { Link, NavLink } from 'react-router-dom'
import { Contrast, Menu, Type, X } from 'lucide-react'
import { useState } from 'react'
import { useApp } from '../store/AppContext'
import { tr } from '../utils/strings'
import LanguageSelector from './LanguageSelector'
import AshokaChakra from './AshokaChakra'

const NAV = [
  { to: '/', label: { hi: 'मुख्य पृष्ठ', en: 'Home' } },
  { to: '/voice', label: { hi: 'आवाज़ सहायक', en: 'Voice Assistant' } },
  { to: '/ivr', label: { hi: 'IVR कॉल', en: 'IVR Call' } },
  { to: '/whatsapp', label: { hi: 'WhatsApp', en: 'WhatsApp' } },
  { to: '/dashboard', label: { hi: 'अधिकारी डैशबोर्ड', en: 'Official Dashboard' } },
]

export default function Header() {
  const { language, largeText, setLargeText, highContrast, setHighContrast, health, demoMode, setDemoMode } = useApp()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40">
      {/* Top utility strip */}
      <div className="bg-govblue-dark text-white text-xs">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-1.5">
          <span className="opacity-90">भारत सरकार | Government of India</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLargeText(!largeText)}
              className={`flex items-center gap-1 rounded px-2 py-1 ${largeText ? 'bg-saffron text-white' : 'hover:bg-white/10'}`}
              aria-pressed={largeText}
            >
              <Type size={13} /> {tr('largeText', language)}
            </button>
            <button
              type="button"
              onClick={() => setHighContrast(!highContrast)}
              className={`flex items-center gap-1 rounded px-2 py-1 ${highContrast ? 'bg-saffron text-white' : 'hover:bg-white/10'}`}
              aria-pressed={highContrast}
            >
              <Contrast size={13} /> {tr('highContrast', language)}
            </button>
            <label className="flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 hover:bg-white/10">
              <input type="checkbox" checked={demoMode} onChange={(e) => setDemoMode(e.target.checked)} />
              {tr('demoMode', language)}
            </label>
            <LanguageSelector compact />
          </div>
        </div>
      </div>

      {/* Masthead */}
      <div className="bg-govblue text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <AshokaChakra className="h-11 w-11 shrink-0" />
            <div className="leading-tight">
              <div className="text-lg font-bold md:text-xl">
                {tr('appName', language)} <span className="font-normal opacity-80">| JeevikaSetu</span>
              </div>
              <div className="text-[11px] opacity-90 md:text-xs">{tr('ministry', language)}</div>
            </div>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-white/15 text-white' : 'text-white/85 hover:bg-white/10'
                  }`
                }
              >
                {item.label[language] || item.label.en}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-3">
            {health && (
              <span
                className={`badge hidden md:inline-flex ${
                  health.ai_mode === 'live-openai' ? 'bg-indiagreen text-white' : 'bg-white/15 text-white'
                }`}
                title="Live mode uses OpenAI Whisper/GPT/TTS. Offline mode uses browser speech + the deterministic engines."
              >
                {health.ai_mode === 'live-openai' ? 'LIVE AI' : 'OFFLINE DEMO AI'}
              </span>
            )}
            <button
              type="button"
              className="rounded-md p-2 hover:bg-white/10 lg:hidden"
              onClick={() => setOpen(!open)}
              aria-label="Toggle navigation"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="border-t border-white/10 px-4 pb-3 lg:hidden">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2 text-sm text-white/90 hover:bg-white/10"
              >
                {item.label[language] || item.label.en}
              </NavLink>
            ))}
          </nav>
        )}
      </div>

      <div className="tricolour-bar h-1" />
    </header>
  )
}
