/** Live subtitle-style transcript of the voice conversation. */

import { motion } from 'framer-motion'
import { Bot, User } from 'lucide-react'
import { useEffect, useRef } from 'react'

export default function TranscriptDisplay({ messages, partial }) {
  const endRef = useRef(null)

  useEffect(() => {
    // guard: scrollIntoView is missing in some embedded webviews/test envs
    if (typeof endRef.current?.scrollIntoView === 'function') {
      endRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages, partial])

  return (
    <div className="max-h-[42vh] min-h-[180px] space-y-3 overflow-y-auto rounded-xl bg-slate-50 p-4">
      {messages.length === 0 && !partial && (
        <p className="py-8 text-center text-sm text-slate-400">
          बातचीत यहाँ दिखेगी · The conversation transcript appears here
        </p>
      )}

      {messages.map((m, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex gap-2 ${m.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {m.speaker !== 'user' && (
            <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-govblue text-white">
              <Bot size={15} />
            </span>
          )}
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-2 text-[15px] leading-relaxed shadow-sm ${
              m.speaker === 'user'
                ? 'rounded-br-sm bg-indiagreen text-white'
                : 'rounded-bl-sm bg-white text-slate-800'
            }`}
          >
            {m.text}
            {m.source && (
              <span className="ml-2 align-middle text-[10px] uppercase opacity-70">{m.source}</span>
            )}
          </div>
          {m.speaker === 'user' && (
            <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indiagreen text-white">
              <User size={15} />
            </span>
          )}
        </motion.div>
      ))}

      {partial && (
        <div className="flex justify-end gap-2">
          <div className="max-w-[80%] rounded-2xl rounded-br-sm border-2 border-dashed border-indiagreen/60 bg-white px-4 py-2 text-[15px] italic text-slate-500">
            {partial}
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  )
}
