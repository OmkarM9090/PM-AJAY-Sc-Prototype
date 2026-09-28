/**
 * VoiceAgent — the bi-directional conversational core of JeevikaSetu.
 *
 * Turn loop:
 *   AI speaks (server TTS or browser TTS)
 *      → user speaks (Web Speech API, optionally verified by Whisper)
 *      → transcript posted to /api/conversation/message
 *      → dialogue engine returns the next empathetic question
 *      → repeat until all 9 topics are covered
 *      → AI summarises, confirms, and the profile is extracted.
 *
 * Every step has a text fallback, so a broken mic never breaks the demo.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, PlayCircle, RefreshCw, Send, Sparkles } from 'lucide-react'
import api from '../utils/apiClient'
import { speak, stopSpeaking } from '../utils/audioUtils'
import { useApp } from '../store/AppContext'
import { LANGUAGES, tr } from '../utils/strings'
import AudioRecorder from './AudioRecorder'
import AudioPlayer from './AudioPlayer'
import TranscriptDisplay from './TranscriptDisplay'
import ConversationProgress from './ConversationProgress'

export default function VoiceAgent({ channel = 'web', onComplete, compact = false }) {
  const {
    language, setLanguage, demoMode, session, setSession,
    transcript, setTranscript, health, consent,
  } = useApp()

  const [status, setStatus] = useState('idle')      // idle|connecting|speaking|listening|processing|done
  const [partial, setPartial] = useState('')
  const [typed, setTyped] = useState('')
  const [progress, setProgress] = useState({ answered: [], percent: 0 })
  const [currentSlot, setCurrentSlot] = useState(null)
  const [script, setScript] = useState([])
  const [error, setError] = useState(null)
  const [detected, setDetected] = useState(null)
  const [engine, setEngine] = useState(null)
  const [demoTurns, setDemoTurns] = useState([])
  const demoIdx = useRef(0)
  const mounted = useRef(true)

  const serverSTT = health?.capabilities?.server_stt

  useEffect(() => {
    mounted.current = true
    api.interviewScript().then((s) => setScript(s.slots)).catch(() => {})
    api.demoScript()
      .then((d) => setDemoTurns(d.turns.filter((t) => t.speaker === 'user')))
      .catch(() => {})
    return () => {
      mounted.current = false
      stopSpeaking()
    }
  }, [])

  const say = useCallback(
    async (text, lang) => {
      setStatus('speaking')
      await speak(text, lang || language, api.synthesize)
      if (mounted.current) setStatus('awaiting')
    },
    [language],
  )

  /** Begin (or restart) the interview. */
  const start = useCallback(async () => {
    setError(null)
    setStatus('connecting')
    setTranscript([])
    setPartial('')
    demoIdx.current = 0
    try {
      const res = await api.startConversation(language, channel, demoMode, consent)
      setSession({ id: res.session_id, channel })
      setEngine(res.engine)
      setProgress(res.progress)
      setCurrentSlot(res.next_slot)
      setTranscript([{ speaker: 'assistant', text: res.reply }])
      await say(res.reply, res.language)
    } catch (e) {
      setError('Backend not reachable. Start the API with:  cd backend && python main.py')
      setStatus('idle')
    }
  }, [language, channel, demoMode, consent, setSession, setTranscript, say])

  /** Send one user utterance through the dialogue engine. */
  const submit = useCallback(
    async (text, source) => {
      if (!text?.trim() || !session?.id) return
      setPartial('')
      setTyped('')
      setTranscript((prev) => [...prev, { speaker: 'user', text, source }])
      setStatus('processing')
      try {
        const res = await api.sendMessage(session.id, text, language)
        setEngine(res.engine)
        setProgress(res.progress)
        setCurrentSlot(res.next_slot)
        if (res.language && res.language !== language) {
          setLanguage(res.language)
          setDetected(res.language)
        } else {
          setDetected(res.language)
        }
        setTranscript((prev) => [...prev, { speaker: 'assistant', text: res.reply }])
        await say(res.reply, res.language)
        if (res.completed) {
          setStatus('done')
          onComplete?.({ sessionId: session.id, summary: res.summary, slots: res.slots })
        }
      } catch (e) {
        setError('Could not reach the conversation engine. Please try again.')
        setStatus('awaiting')
      }
    },
    [session, language, setLanguage, setTranscript, say, onComplete],
  )

  /** Demo Mode: replay a scripted beneficiary answer through the REAL engine. */
  const playDemoAnswer = useCallback(() => {
    const turn = demoTurns[demoIdx.current]
    if (!turn) return
    demoIdx.current += 1
    submit(turn.text, 'demo')
  }, [demoTurns, submit])

  const languageName = LANGUAGES.find((l) => l.code === (detected || language))?.label

  return (
    <div className={`grid gap-5 ${compact ? '' : 'lg:grid-cols-[1fr_280px]'}`}>
      <div className="gov-card p-5">
        {/* Header row */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-govblue text-white">
              <Sparkles size={20} />
            </span>
            <div>
              <h2 className="font-bold text-govblue">JeevikaSetu AI · जीविकासेतु सहायक</h2>
              <p className="text-xs text-slate-500">
                {channel === 'web' ? 'Web voice channel' : channel === 'ivr' ? 'IVR (phone) channel' : 'WhatsApp channel'}
                {engine ? ` · ${engine}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge bg-govblue-50 text-govblue">भाषा: {languageName}</span>
            {detected && <span className="badge bg-saffron-50 text-saffron-dark">auto-detected</span>}
            {demoMode && <span className="badge bg-indiagreen-50 text-indiagreen">DEMO MODE</span>}
          </div>
        </div>

        {error && (
          <div className="mb-3 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <TranscriptDisplay messages={transcript} partial={partial} />

        <div className="mt-4 flex justify-center">
          <AudioPlayer
            status={status === 'awaiting' ? null : status}
            language={language}
            engine={serverSTT ? 'whisper+gpt' : 'browser speech'}
          />
        </div>

        {/* Controls */}
        <div className="mt-4 flex flex-col items-center gap-4">
          {status === 'idle' ? (
            <button type="button" onClick={start} className="gov-btn-saffron text-lg">
              <PlayCircle size={22} /> {tr('startVoice', language)}
            </button>
          ) : (
            <>
              {demoMode ? (
                <button
                  type="button"
                  onClick={playDemoAnswer}
                  disabled={status === 'processing' || status === 'speaking' || status === 'done'}
                  className="gov-btn-green"
                >
                  <PlayCircle size={20} /> Play next demo answer ({demoIdx.current}/{demoTurns.length})
                </button>
              ) : (
                <AudioRecorder
                  lang={language}
                  serverSTT={serverSTT}
                  disabled={status === 'processing' || status === 'speaking' || status === 'done'}
                  label={tr('tapToSpeak', language)}
                  onPartial={(t) => {
                    setPartial(t)
                    setStatus('listening')
                  }}
                  onTranscript={(t, src) => submit(t, src)}
                  onError={(e) => {
                    setStatus('awaiting')
                    if (e?.message === 'no-speech-detected') setError('मैं सुन नहीं पाई — दोबारा बोलिए या नीचे लिखिए।')
                    else if (e?.message === 'speech-recognition-unsupported') setError('Speech recognition unsupported here — please type below.')
                  }}
                />
              )}

              {/* Text fallback — always available (low-bandwidth / noisy rooms) */}
              <form
                className="flex w-full max-w-xl gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  submit(typed, 'typed')
                }}
              >
                <input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder={tr('typeInstead', language)}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-govblue"
                  disabled={status === 'done'}
                />
                <button type="submit" className="gov-btn-primary" disabled={!typed.trim() || status === 'done'}>
                  <Send size={18} /> {tr('send', language)}
                </button>
              </form>

              <button type="button" onClick={start} className="text-xs text-slate-500 underline">
                <RefreshCw size={12} className="inline" /> {tr('restart', language)}
              </button>
            </>
          )}
        </div>
      </div>

      {!compact && (
        <div className="space-y-4">
          <ConversationProgress
            script={script}
            progress={progress}
            currentSlot={currentSlot}
            language={language}
          />
          <div className="gov-card p-4 text-xs leading-relaxed text-slate-600">
            <p className="mb-1 font-bold text-govblue">How this works</p>
            <p>
              Speech → {serverSTT ? 'OpenAI Whisper' : 'browser ASR'} → language detection → dialogue
              engine ({engine || 'rule engine'}) → {serverSTT ? 'OpenAI TTS' : 'browser TTS'} in the same
              language. No form filling, no typing required.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
