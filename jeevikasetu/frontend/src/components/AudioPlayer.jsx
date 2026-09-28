/** Animated status strip: Listening → Processing → Speaking, with waveform. */

import { Loader2, Mic, Volume2 } from 'lucide-react'
import { tr } from '../utils/strings'

const BARS = [0.3, 0.7, 1, 0.55, 0.85, 0.4, 0.95, 0.6, 0.35]

export function Waveform({ active, color = 'bg-saffron' }) {
  return (
    <div className="flex h-8 items-end gap-1" aria-hidden>
      {BARS.map((h, i) => (
        <span
          key={i}
          className={`w-1.5 rounded-full ${color} ${active ? 'animate-wave' : 'opacity-30'}`}
          style={{ height: `${h * 100}%`, animationDelay: `${i * 0.08}s` }}
        />
      ))}
    </div>
  )
}

export default function AudioPlayer({ status, language = 'hi', engine }) {
  const map = {
    listening: { text: tr('listening', language), icon: Mic, color: 'text-red-600', bar: 'bg-red-500' },
    processing: { text: tr('processing', language), icon: Loader2, color: 'text-govblue', bar: 'bg-govblue' },
    speaking: { text: tr('speaking', language), icon: Volume2, color: 'text-indiagreen', bar: 'bg-indiagreen' },
  }
  const state = map[status]
  if (!state) return <div className="h-12" />

  const Icon = state.icon
  return (
    <div className="flex items-center justify-center gap-3 rounded-full bg-white px-5 py-2 shadow-card">
      <Icon size={20} className={`${state.color} ${status === 'processing' ? 'animate-spin' : ''}`} />
      <span className={`text-sm font-semibold ${state.color}`}>{state.text}</span>
      <Waveform active color={state.bar} />
      {engine && <span className="hidden text-[10px] uppercase tracking-wide text-slate-400 md:inline">{engine}</span>}
    </div>
  )
}
