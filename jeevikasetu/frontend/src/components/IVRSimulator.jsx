/**
 * IVR channel simulation — demonstrates feature-phone access.
 * Dial pad → ringing → language IVR menu (spoken) → the same voice agent,
 * but the session is tagged channel="ivr" so the official dashboard can
 * report channel-wise reach.
 */

import { useState } from 'react'
import { Phone, PhoneOff, Signal } from 'lucide-react'
import { browserSpeak, stopSpeaking } from '../utils/audioUtils'
import { useApp } from '../store/AppContext'
import VoiceAgent from './VoiceAgent'

const TOLL_FREE = '1800-11-26097'
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#']

const IVR_MENU = [
  { key: '1', code: 'hi', label: 'हिन्दी के लिए 1 दबाएँ' },
  { key: '2', code: 'en', label: 'For English press 2' },
  { key: '3', code: 'mr', label: 'मराठीसाठी 3 दाबा' },
  { key: '4', code: 'ta', label: 'தமிழுக்கு 4 ஐ அழுத்தவும்' },
  { key: '5', code: 'te', label: 'తెలుగు కోసం 5 నొక్కండి' },
  { key: '6', code: 'bn', label: 'বাংলার জন্য ৬ চাপুন' },
]

const MENU_SCRIPT =
  'नमस्ते, आपने जीविकासेतु, PM-AJAY कौशल हेल्पलाइन पर कॉल किया है। ' +
  'हिन्दी के लिए एक दबाएँ. For English press two. मराठीसाठी तीन दाबा.'

export default function IVRSimulator({ onComplete }) {
  const { setLanguage } = useApp()
  const [dialled, setDialled] = useState('')
  const [stage, setStage] = useState('dial') // dial | ringing | menu | connected
  const [selected, setSelected] = useState(null)

  const call = async () => {
    setStage('ringing')
    setTimeout(async () => {
      setStage('menu')
      await browserSpeak(MENU_SCRIPT, 'hi')
    }, 1600)
  }

  const chooseLanguage = async (opt) => {
    setSelected(opt)
    setLanguage(opt.code)
    setStage('connected')
  }

  const hangUp = () => {
    stopSpeaking()
    setStage('dial')
    setDialled('')
    setSelected(null)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* Handset */}
      <div className="mx-auto w-[300px] rounded-[2rem] border-8 border-slate-800 bg-slate-900 p-4 text-white shadow-2xl">
        <div className="mb-3 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1"><Signal size={11} /> Jio 4G</span>
          <span>JeevikaSetu IVR</span>
          <span>100%</span>
        </div>

        <div className="mb-4 min-h-[86px] rounded-lg bg-black/60 p-3 text-center">
          {stage === 'dial' && (
            <>
              <div className="text-xl tracking-widest">{dialled || TOLL_FREE}</div>
              <div className="text-[11px] text-slate-400">Toll-free · टोल फ्री</div>
            </>
          )}
          {stage === 'ringing' && <div className="animate-pulse pt-5 text-lg">Ringing…</div>}
          {stage === 'menu' && (
            <>
              <div className="text-sm text-indiagreen">Connected · 00:03</div>
              <div className="text-[11px] text-slate-300">भाषा चुनने के लिए बटन दबाएँ</div>
            </>
          )}
          {stage === 'connected' && (
            <>
              <div className="text-sm text-indiagreen">In call · {selected?.code?.toUpperCase()}</div>
              <div className="text-[11px] text-slate-300">जीविकासेतु सहायक से बात कीजिए</div>
            </>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {KEYS.map((k) => {
            const opt = IVR_MENU.find((m) => m.key === k)
            const active = stage === 'menu' && opt
            return (
              <button
                key={k}
                type="button"
                onClick={() => {
                  if (stage === 'dial') setDialled((d) => (d + k).slice(0, 14))
                  else if (active) chooseLanguage(opt)
                }}
                className={`rounded-full py-3 text-lg font-semibold transition ${
                  active ? 'bg-saffron text-white ring-2 ring-saffron/50' : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                {k}
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex justify-center gap-4">
          {stage === 'dial' ? (
            <button type="button" onClick={call} className="rounded-full bg-indiagreen p-4 hover:bg-indiagreen-dark">
              <Phone size={22} />
            </button>
          ) : (
            <button type="button" onClick={hangUp} className="rounded-full bg-red-600 p-4 hover:bg-red-700">
              <PhoneOff size={22} />
            </button>
          )}
        </div>
      </div>

      {/* Call context / live agent */}
      <div className="space-y-4">
        <div className="gov-card p-4">
          <h3 className="font-bold text-govblue">IVR channel — why it matters</h3>
          <p className="mt-1 text-sm text-slate-600">
            A large share of SC beneficiaries in rural blocks use feature phones with no data.
            The same JeevikaSetu dialogue engine runs over a toll-free IVR line: the caller hears
            the language menu, presses a key, and completes the entire skill interview by voice.
            In production this line is an Exotel/Twilio number streaming audio to the same
            <code className="mx-1 rounded bg-slate-100 px-1">/api/conversation/message</code> endpoint.
          </p>
          {stage === 'menu' && (
            <ul className="mt-3 grid gap-1 text-sm text-slate-700 sm:grid-cols-2">
              {IVR_MENU.map((m) => (
                <li key={m.key} className="rounded bg-saffron-50 px-2 py-1">
                  <strong>{m.key}</strong> — {m.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        {stage === 'connected' && (
          <VoiceAgent channel="ivr" compact onComplete={onComplete} />
        )}
      </div>
    </div>
  )
}
