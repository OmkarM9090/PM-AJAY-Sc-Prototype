/**
 * WhatsApp channel simulation — voice notes in, voice notes out.
 * Uses the same backend conversation engine (channel="whatsapp").
 */

import { useEffect, useRef, useState } from 'react'
import { Check, CheckCheck, Mic, Play, Send, Square } from 'lucide-react'
import api from '../utils/apiClient'
import { listenOnce, speak, startRecording, stopSpeaking } from '../utils/audioUtils'
import { useApp } from '../store/AppContext'

function Bubble({ msg, onPlay }) {
  const mine = msg.from === 'me'
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative max-w-[78%] rounded-lg px-3 py-2 text-[15px] shadow-sm ${
          mine ? 'bg-[#d9fdd3]' : 'bg-white'
        }`}
      >
        {msg.audio && (
          <button
            type="button"
            onClick={() => onPlay(msg)}
            className="mb-1 flex w-full items-center gap-2 rounded bg-black/5 px-2 py-1.5 text-xs"
          >
            <Play size={14} className="text-[#25D366]" />
            <span className="h-1 flex-1 rounded bg-slate-300">
              <span className="block h-full w-1/3 rounded bg-[#25D366]" />
            </span>
            <span className="text-slate-500">0:0{msg.seconds || 5}</span>
          </button>
        )}
        <p className="whitespace-pre-wrap leading-snug text-slate-800">{msg.text}</p>
        <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-slate-500">
          {msg.time}
          {mine && <CheckCheck size={12} className="text-[#53bdeb]" />}
          {!mine && <Check size={12} />}
        </div>
      </div>
    </div>
  )
}

export default function WhatsAppChat({ onComplete }) {
  const { language, setSession } = useApp()
  const [messages, setMessages] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [recording, setRecording] = useState(false)
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const recogRef = useRef(null)
  const mediaRef = useRef(null)
  const textRef = useRef('')
  const endRef = useRef(null)

  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  useEffect(() => {
    let cancelled = false
    api.startConversation(language, 'whatsapp').then(async (res) => {
      if (cancelled) return
      setSessionId(res.session_id)
      setSession({ id: res.session_id, channel: 'whatsapp' })
      setMessages([{ from: 'bot', text: res.reply, audio: true, time: now(), seconds: 8 }])
      await speak(res.reply, language, api.synthesize)
    }).catch(() => {
      setMessages([{ from: 'bot', text: '⚠ Backend not reachable. Start the FastAPI server.', time: now() }])
    })
    return () => {
      cancelled = true
      stopSpeaking()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (typeof endRef.current?.scrollIntoView === 'function') {
      endRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  async function send(text, asVoiceNote) {
    if (!text?.trim() || !sessionId) return
    setMessages((m) => [...m, { from: 'me', text, audio: asVoiceNote, time: now(), seconds: 6 }])
    setTyped('')
    setBusy(true)
    try {
      const res = await api.sendMessage(sessionId, text, language)
      setMessages((m) => [...m, { from: 'bot', text: res.reply, audio: true, time: now(), seconds: 7 }])
      await speak(res.reply, res.language, api.synthesize)
      if (res.completed) onComplete?.({ sessionId })
    } catch (e) {
      setMessages((m) => [...m, { from: 'bot', text: '⚠ Could not reach the server.', time: now() }])
    } finally {
      setBusy(false)
    }
  }

  async function startVoiceNote() {
    textRef.current = ''
    setRecording(true)
    recogRef.current = listenOnce(language, { onPartial: (t) => { textRef.current = t } })
    try {
      mediaRef.current = await startRecording()
    } catch (_) { /* mic optional — browser ASR may still work */ }
  }

  async function stopVoiceNote() {
    setRecording(false)
    recogRef.current?.stop()
    let text = ''
    if (mediaRef.current) {
      const blob = await mediaRef.current.stop()
      mediaRef.current = null
      try {
        const res = await api.transcribe(blob, language)
        if (res?.mode === 'server' && res.text) text = res.text
      } catch (_) { /* fall back to browser ASR */ }
    }
    setTimeout(() => send(text || textRef.current || '(voice note unclear)', true), 300)
  }

  return (
    <div className="mx-auto max-w-md overflow-hidden rounded-xl border border-slate-300 shadow-card">
      {/* Chat header */}
      <div className="flex items-center gap-3 bg-[#075E54] px-4 py-2.5 text-white">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] font-bold">JS</div>
        <div className="flex-1">
          <div className="text-sm font-semibold">JeevikaSetu · PM-AJAY</div>
          <div className="text-[11px] opacity-80">{busy ? 'typing…' : 'online · भाषा: ' + language.toUpperCase()}</div>
        </div>
        <span className="rounded bg-white/15 px-2 py-0.5 text-[10px]">Business</span>
      </div>

      {/* Messages */}
      <div
        className="h-[52vh] space-y-2 overflow-y-auto p-3"
        style={{ background: '#efeae2' }}
      >
        <div className="mx-auto w-fit rounded bg-[#fdf4c9] px-3 py-1 text-center text-[11px] text-slate-600">
          🔒 Messages are processed under PM-AJAY data-privacy guidelines. Voice notes are
          transcribed and deleted after profiling.
        </div>
        {messages.map((m, i) => (
          <Bubble key={i} msg={m} onPlay={(msg) => speak(msg.text, language, api.synthesize)} />
        ))}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(typed, false) }}
        className="flex items-center gap-2 bg-[#f0f2f5] px-2 py-2"
      >
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="Message / संदेश"
          className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm outline-none"
        />
        {typed ? (
          <button type="submit" className="rounded-full bg-[#25D366] p-2.5 text-white">
            <Send size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={recording ? stopVoiceNote : startVoiceNote}
            className={`rounded-full p-2.5 text-white ${recording ? 'animate-pulse bg-red-600' : 'bg-[#25D366]'}`}
            aria-label={recording ? 'Stop voice note' : 'Record voice note'}
          >
            {recording ? <Square size={18} /> : <Mic size={18} />}
          </button>
        )}
      </form>
    </div>
  )
}
