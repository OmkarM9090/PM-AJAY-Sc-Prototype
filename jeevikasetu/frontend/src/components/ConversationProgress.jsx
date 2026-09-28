/** Visual tracker of the 9 interview topics (driven by real filled slots). */

import { Check, Circle, Loader } from 'lucide-react'
import { tr } from '../utils/strings'

export default function ConversationProgress({ script = [], progress, currentSlot, language = 'hi' }) {
  const answered = progress?.answered || []
  const percent = progress?.percent ?? 0

  return (
    <div className="gov-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-govblue">{tr('progress', language)}</h3>
        <span className="text-sm font-semibold text-slate-600">{percent}%</span>
      </div>

      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-saffron to-indiagreen transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ul className="space-y-1.5">
        {script.map((item) => {
          const done = answered.includes(item.key)
          const active = currentSlot === item.key
          return (
            <li
              key={item.key}
              className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm ${
                active ? 'bg-saffron-50 font-semibold text-saffron-dark' : done ? 'text-indiagreen' : 'text-slate-500'
              }`}
            >
              {done ? (
                <Check size={15} className="shrink-0" />
              ) : active ? (
                <Loader size={15} className="shrink-0 animate-spin" />
              ) : (
                <Circle size={13} className="shrink-0" />
              )}
              <span className="truncate">
                {item.labels?.[language] || item.labels?.hi || item.labels?.en || item.key}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
