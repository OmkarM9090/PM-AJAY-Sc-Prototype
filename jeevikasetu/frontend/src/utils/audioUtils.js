/**
 * Browser audio layer for the voice agent.
 *
 * SPEECH IN  : Web Speech API (SpeechRecognition) gives instant, free,
 *              multilingual streaming transcripts. When the backend reports
 *              live OpenAI mode, MediaRecorder audio is ALSO sent to Whisper
 *              for a higher-accuracy server transcript.
 * SPEECH OUT : Server TTS (OpenAI) when available, otherwise the browser's
 *              SpeechSynthesis in the same language.
 */

export const LOCALES = {
  hi: 'hi-IN',
  en: 'en-IN',
  mr: 'mr-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  bn: 'bn-IN',
}

export function getSpeechRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export const speechSupported = () => Boolean(getSpeechRecognition())
export const micSupported = () => Boolean(navigator.mediaDevices?.getUserMedia)

/**
 * Start continuous-ish recognition for one user turn.
 * Returns a handle with stop()/abort().
 */
export function listenOnce(lang, { onPartial, onFinal, onError, onEnd } = {}) {
  const SR = getSpeechRecognition()
  if (!SR) {
    onError?.(new Error('speech-recognition-unsupported'))
    return { stop() {}, abort() {} }
  }
  const recog = new SR()
  recog.lang = LOCALES[lang] || 'hi-IN'
  recog.interimResults = true
  recog.continuous = false
  recog.maxAlternatives = 1

  let finalText = ''
  recog.onresult = (event) => {
    let interim = ''
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const res = event.results[i]
      if (res.isFinal) finalText += res[0].transcript
      else interim += res[0].transcript
    }
    if (interim) onPartial?.(interim)
    if (finalText) onPartial?.(finalText)
  }
  recog.onerror = (e) => onError?.(e)
  recog.onend = () => {
    if (finalText.trim()) onFinal?.(finalText.trim())
    onEnd?.(finalText.trim())
  }
  try {
    recog.start()
  } catch (e) {
    onError?.(e)
  }
  return {
    stop: () => {
      try {
        recog.stop()
      } catch (_) {
        /* already stopped */
      }
    },
    abort: () => {
      try {
        recog.abort()
      } catch (_) {
        /* noop */
      }
    },
  }
}

/** Record raw audio (used for Whisper + for WhatsApp-style voice notes). */
export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : ''
  const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
  const chunks = []
  recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data)
  recorder.start()

  return {
    recorder,
    stop: () =>
      new Promise((resolve) => {
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop())
          resolve(new Blob(chunks, { type: mime || 'audio/webm' }))
        }
        recorder.stop()
      }),
  }
}

/** Simple amplitude meter for the animated waveform. */
export async function createLevelMeter(stream) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const source = ctx.createMediaStreamSource(stream)
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 256
  source.connect(analyser)
  const data = new Uint8Array(analyser.frequencyBinCount)
  return {
    level() {
      analyser.getByteFrequencyData(data)
      return data.reduce((a, b) => a + b, 0) / data.length / 255
    },
    close: () => ctx.close(),
  }
}

let currentUtterance = null

/** Speak text with the browser voice best matching the language. */
export function browserSpeak(text, lang = 'hi') {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) return resolve(false)
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    const locale = LOCALES[lang] || 'hi-IN'
    utter.lang = locale
    utter.rate = 0.95
    utter.pitch = 1.02
    const voices = window.speechSynthesis.getVoices()
    const match =
      voices.find((v) => v.lang === locale) ||
      voices.find((v) => v.lang?.startsWith(lang)) ||
      voices.find((v) => v.lang?.startsWith('hi')) ||
      null
    if (match) utter.voice = match
    utter.onend = () => resolve(true)
    utter.onerror = () => resolve(false)
    currentUtterance = utter
    window.speechSynthesis.speak(utter)
  })
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  currentUtterance = null
}

/** Play base64 mp3 returned by the server TTS endpoint. */
export function playBase64Audio(b64, mime = 'audio/mpeg') {
  return new Promise((resolve) => {
    const audio = new Audio(`data:${mime};base64,${b64}`)
    audio.onended = () => resolve(true)
    audio.onerror = () => resolve(false)
    audio.play().catch(() => resolve(false))
  })
}

/**
 * Speak via server TTS if available, else browser TTS.
 * `synthesize` is injected so components stay testable.
 */
export async function speak(text, lang, synthesize) {
  try {
    if (synthesize) {
      const res = await synthesize(text, lang)
      if (res?.mode === 'server' && res.audio_base64) {
        return playBase64Audio(res.audio_base64, res.mime)
      }
    }
  } catch (_) {
    /* fall through to browser TTS */
  }
  return browserSpeak(text, lang)
}

/** Record-and-return-object-URL helper for the WhatsApp voice-note UI. */
export function blobToUrl(blob) {
  return URL.createObjectURL(blob)
}
