/** Landing page — voice-first entry with three big channel buttons. */

import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart3, MessageCircle, Mic, Phone, ShieldCheck } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { tr } from '../utils/strings'
import LanguageSelector from '../components/LanguageSelector'
import AshokaChakra from '../components/AshokaChakra'

const DIFFERENTIATORS = [
  ['🎙️', 'Voice-first', 'Zero typing — the whole journey works by speaking'],
  ['🌐', 'Multilingual', 'Auto-detects the language and replies in it'],
  ['🤝', 'Empathetic AI', 'Conversational interview, not a form'],
  ['🛠️', 'Informal skill recognition', 'Daily work mapped to NSQF competencies'],
  ['⚡', 'RPL pathway', 'Shortens the journey where experience already exists'],
  ['♿', 'Constraint-aware', 'Distance, mobility and health are factored in'],
  ['💰', 'GIA integration', 'Links every pathway to PM-AJAY financial support'],
  ['📞', 'Multi-channel', 'Web, IVR feature-phone and WhatsApp'],
]

export default function LandingPage() {
  const { language, health } = useApp()
  const navigate = useNavigate()

  const actions = [
    {
      to: '/voice', icon: Mic, title: tr('startVoice', language), sub: tr('startVoiceSub', language),
      className: 'bg-govblue hover:bg-govblue-dark', primary: true,
    },
    {
      to: '/ivr', icon: Phone, title: tr('callUs', language), sub: tr('callUsSub', language),
      className: 'bg-saffron hover:bg-saffron-dark',
    },
    {
      to: '/whatsapp', icon: MessageCircle, title: tr('whatsapp', language), sub: tr('whatsappSub', language),
      className: 'bg-indiagreen hover:bg-indiagreen-dark',
    },
  ]

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-govblue-50 to-govgrey">
        <div className="mx-auto max-w-5xl px-4 py-10 text-center md:py-14">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-card">
              <AshokaChakra className="h-16 w-16" />
            </div>
            <h1 className="text-3xl font-extrabold text-govblue md:text-5xl">
              जीविकासेतु <span className="text-saffron">·</span> JeevikaSetu
            </h1>
            <p className="mt-2 text-lg font-semibold text-slate-700 md:text-xl">
              {tr('tagline', 'hi')}
            </p>
            <p className="text-sm text-slate-500 md:text-base">{tr('tagline', 'en')}</p>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600">
              AI voice assistant for livelihood mapping and NSQF-aligned skilling recommendations
              for Scheduled Caste communities under the <strong>PM-AJAY Grants-in-Aid</strong> component.
            </p>
          </motion.div>

          <div className="mt-5">
            <LanguageSelector />
          </div>

          {/* Three big CTAs */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {actions.map((a, i) => (
              <motion.button
                key={a.to}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i }}
                onClick={() => navigate(a.to)}
                className={`flex flex-col items-center gap-2 rounded-2xl px-5 py-7 text-white shadow-card transition ${a.className} ${
                  a.primary ? 'ring-4 ring-saffron/40' : ''
                }`}
              >
                <a.icon size={44} />
                <span className="text-xl font-bold">{a.title}</span>
                <span className="text-sm opacity-90">{a.sub}</span>
              </motion.button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
            <span className="badge bg-white text-govblue shadow-sm">
              <ShieldCheck size={13} /> No Aadhaar / bank details asked
            </span>
            <span className="badge bg-white text-govblue shadow-sm">
              Mode: {health?.ai_mode === 'live-openai' ? 'Live OpenAI (Whisper · GPT · TTS)' : 'Offline demo AI (browser speech + rule engines)'}
            </span>
            <Link to="/dashboard" className="badge bg-white text-govblue shadow-sm hover:bg-govblue-50">
              <BarChart3 size={13} /> Official dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="section-title text-center">यह कैसे काम करता है · How it works</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            ['1', 'बात करें', 'Speak in your language — Hindi, Tamil, Telugu, Marathi, Bengali or English.'],
            ['2', 'हुनर पहचान', 'The AI turns your daily work into formal NSQF competencies.'],
            ['3', 'रास्ता चुनें', 'Get ranked pathways with skill gaps, RPL options and nearby centres.'],
            ['4', 'सहायता पाएँ', 'See the PM-AJAY GIA support you are eligible for and enrol.'],
          ].map(([n, title, text]) => (
            <div key={n} className="gov-card p-5">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-saffron text-lg font-bold text-white">
                {n}
              </div>
              <h3 className="font-bold text-govblue">{title}</h3>
              <p className="mt-1 text-sm text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Differentiators */}
      <section className="bg-white py-10">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="section-title text-center">Key differentiators</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {DIFFERENTIATORS.map(([emoji, title, text]) => (
              <div key={title} className="rounded-xl border border-slate-200 p-4">
                <div className="text-2xl">{emoji}</div>
                <div className="mt-1 font-bold text-govblue">{title}</div>
                <p className="text-sm text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
