/**
 * Floating screen-recorder for capturing the judge demo.
 * Uses getDisplayMedia + MediaRecorder and downloads a .webm locally —
 * nothing is uploaded anywhere.
 */

import { useRef, useState } from 'react'
import { Circle, Download, Video } from 'lucide-react'

export default function DemoRecorder() {
  const [state, setState] = useState('idle') // idle | recording | saved
  const [seconds, setSeconds] = useState(0)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      })
      chunksRef.current = []
      const rec = new MediaRecorder(stream, { mimeType: 'video/webm' })
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data)
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `JeevikaSetu-demo-${new Date().toISOString().slice(0, 19)}.webm`
        a.click()
        setState('saved')
        setTimeout(() => setState('idle'), 4000)
      }
      rec.start()
      recorderRef.current = rec
      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
      setState('recording')
    } catch (_) {
      /* user cancelled the screen picker */
    }
  }

  function stop() {
    clearInterval(timerRef.current)
    recorderRef.current?.stop()
  }

  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) return null

  return (
    <button
      type="button"
      onClick={state === 'recording' ? stop : start}
      title="Record this demo (saved locally as .webm)"
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition ${
        state === 'recording' ? 'bg-red-600 hover:bg-red-700' : 'bg-govblue hover:bg-govblue-dark'
      }`}
    >
      {state === 'recording' ? (
        <>
          <Circle size={14} fill="white" className="animate-pulse" />
          Stop · {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
        </>
      ) : state === 'saved' ? (
        <>
          <Download size={16} /> Demo saved
        </>
      ) : (
        <>
          <Video size={16} /> Record demo
        </>
      )}
    </button>
  )
}
