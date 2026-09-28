/**
 * Consent gate (DPDP Act 2023).
 *
 * Shown once before the first voice conversation. Written to be *understood*
 * by someone with low literacy: short lines, plain words, the Hindi first, and
 * every point spoken aloud on request. Consent is recorded per session on the
 * backend and can be withdrawn — which erases the conversation.
 */

import { useState } from 'react'
import { Check, Info, ShieldCheck, Volume2, X } from 'lucide-react'
import { browserSpeak, stopSpeaking } from '../utils/audioUtils'
import { useApp } from '../store/AppContext'

const POINTS = [
  {
    icon: '🎙️',
    hi: 'हम आपकी आवाज़ सुनकर सवाल पूछेंगे और आपके हुनर को समझेंगे।',
    en: 'We listen to your voice to understand your skills and ask simple questions.',
  },
  {
    icon: '📝',
    hi: 'आपकी बात लिखकर सिर्फ़ आपकी प्रोफ़ाइल बनाई जाती है। आवाज़ की रिकॉर्डिंग नहीं रखी जाती।',
    en: 'Your speech is converted to text to build your profile. The audio recording is not kept.',
  },
  {
    icon: '🚫',
    hi: 'हम आधार नंबर, बैंक जानकारी या कोई प्रमाणपत्र नंबर कभी नहीं माँगेंगे।',
    en: 'We will never ask for your Aadhaar number, bank details or any certificate number.',
  },
  {
    icon: '🏛️',
    hi: 'यह जानकारी सिर्फ़ PM-AJAY योजना में सही प्रशिक्षण और सहायता सुझाने के लिए इस्तेमाल होगी।',
    en: 'The information is used only to suggest the right training and PM-AJAY support for you.',
  },
  {
    icon: '↩️',
    hi: 'आप कभी भी मना कर सकते हैं। मना करने पर आपकी सारी बातचीत तुरंत मिटा दी जाएगी।',
    en: 'You can withdraw at any time. Your whole conversation is deleted immediately if you do.',
  },
]

const SPOKEN_SUMMARY =
  'नमस्ते. बात शुरू करने से पहले एक ज़रूरी बात. हम आपकी आवाज़ सुनकर आपके हुनर को समझेंगे. ' +
  'आपकी बात सिर्फ़ प्रोफ़ाइल बनाने के लिए इस्तेमाल होगी. हम आधार नंबर या बैंक जानकारी कभी नहीं माँगेंगे. ' +
  'आप कभी भी मना कर सकते हैं. अगर आप सहमत हैं तो हरा बटन दबाइए.'

export default function ConsentGate({ onAccept, onDecline }) {
  const { language } = useApp()
  const [speaking, setSpeaking] = useState(false)
  const showHindi = language !== 'en'

  async function readAloud() {
    if (speaking) {
      stopSpeaking()
      setSpeaking(false)
      return
    }
    setSpeaking(true)
    await browserSpeak(SPOKEN_SUMMARY, 'hi')
    setSpeaking(false)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="gov-card overflow-hidden">
        <div className="flex items-center gap-3 bg-govblue px-5 py-3 text-white">
          <ShieldCheck size={22} />
          <div>
            <h2 className="font-bold">आपकी सहमति ज़रूरी है · Your consent</h2>
            <p className="text-xs opacity-85">
              डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 के अनुसार · As required under the DPDP Act, 2023
            </p>
          </div>
        </div>

        <ul className="space-y-3 p-5">
          {POINTS.map((p) => (
            <li key={p.en} className="flex gap-3">
              <span className="text-xl leading-none">{p.icon}</span>
              <div>
                {showHindi && <p className="text-[15px] font-medium text-slate-800">{p.hi}</p>}
                <p className={showHindi ? 'text-sm text-slate-500' : 'text-[15px] text-slate-800'}>{p.en}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
          <button type="button" onClick={readAloud} className="gov-btn-outline">
            <Volume2 size={18} /> {speaking ? 'रोकें · Stop' : 'सुनें · Read aloud'}
          </button>
          <div className="ml-auto flex flex-wrap gap-2">
            <button type="button" onClick={onDecline} className="gov-btn border-2 border-slate-300 bg-white text-slate-600">
              <X size={18} /> नहीं · Decline
            </button>
            <button type="button" onClick={() => onAccept('voice-profiling')} className="gov-btn-green text-lg">
              <Check size={20} /> मैं सहमत हूँ · I agree
            </button>
          </div>
        </div>
      </div>

      <p className="mt-3 flex items-start gap-2 text-xs text-slate-500">
        <Info size={14} className="mt-0.5 shrink-0" />
        A field worker or Common Service Centre operator may also record this consent on the
        beneficiary's behalf, in person — the same way PM-AJAY enrolment happens today.
      </p>
    </div>
  )
}
