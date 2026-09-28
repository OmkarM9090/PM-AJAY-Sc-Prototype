/**
 * Microphone capture button.
 *
 * Runs the browser recogniser (instant, free, multilingual) and — when the
 * backend reports live OpenAI mode — simultaneously records the audio and
 * sends it to Whisper, preferring the (more accurate) server transcript.
 */

import { Mic, MicOff, Square } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import api from '../utils/apiClient'
import { listenOnce, micSupported, speechSupported, startRecording } from '../utils/audioUtils'

export default function AudioRecorder({
  lang = 'hi',
  disabled = false,
  serverSTT = false,
  label,
  onPartial,
  onTranscript,
  onError,
}) {
  const [recording, setRecording] = useState(false)
  const [busy, setBusy] = useState(false)
  const recogRef = useRef(null)
  const mediaRef = useRef(null)
  const browserTextRef = useRef('')

  const supported = speechSupported() || micSupported()

  useEffect(() => () => recogRef.current?.abort(), [])

  async function finish() {
    setRecording(false)
    recogRef.current?.stop()
    let serverText = ''
    if (mediaRef.current) {
      try {
        setBusy(true)
        const blob = await mediaRef.current.stop()
        mediaRef.current = null
        if (serverSTT && blob.size > 2000) {
          const res = await api.transcribe(blob, lang)
          if (res?.mode === 'server' && res.text) serverText = res.text
        }
      } catch (err) {
        onError?.(err)
      } finally {
        setBusy(false)
      }
    }
    // Give the browser recogniser a moment to emit its final result.
    setTimeout(() => {
      const text = serverText || browserTextRef.current
      if (text?.trim()) onTranscript?.(text.trim(), serverText ? 'whisper' : 'browser')
      else onError?.(new Error('no-speech-detected'))
      browserTextRef.current = ''
    }, 350)
  }

  async function start() {
    if (disabled || busy) return
    browserTextRef.current = ''
    setRecording(true)

    if (speechSupported()) {
      recogRef.current = listenOnce(lang, {
        onPartial: (t) => {
          browserTextRef.current = t
          onPartial?.(t)
        },
        onError: (e) => {
          if (e?.error !== 'no-speech') onError?.(e)
        },
      })
    }
    if (serverSTT && micSupported()) {
      try {
        mediaRef.current = await startRecording()
      } catch (err) {
        onError?.(err)
      }
    }
  }

  if (!supported) {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="rounded-full bg-slate-200 p-6 text-slate-500">
          <MicOff size={32} />
        </div>
        <p className="max-w-xs text-sm text-slate-600">
          Microphone/speech recognition is not available in this browser. Please use the text box
          below — the conversation engine works exactly the same.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {recording && (
          <>
            <span className="absolute inset-0 rounded-full bg-saffron/40 animate-pulsering" />
            <span className="absolute inset-0 rounded-full bg-saffron/30 animate-pulsering [animation-delay:.5s]" />
          </>
        )}
        <button
          type="button"
          onClick={recording ? finish : start}
          disabled={disabled || busy}
          aria-pressed={recording}
          aria-label={recording ? 'Stop recording' : 'Start speaking'}
          className={`relative flex h-28 w-28 items-center justify-center rounded-full text-white shadow-lg transition
            ${recording ? 'bg-red-600 hover:bg-red-700' : 'bg-govblue hover:bg-govblue-dark'}
            disabled:opacity-50 md:h-32 md:w-32`}
        >
          {recording ? <Square size={38} fill="white" /> : <Mic size={44} />}
        </button>
      </div>
      <p className="text-sm font-semibold text-slate-700">
        {busy ? 'Transcribing…' : label}
      </p>
    </div>
  )
}
