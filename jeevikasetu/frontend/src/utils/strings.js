/** UI copy in 6 languages (falls back to English, then Hindi). */

export const LANGUAGES = [
  { code: 'hi', label: 'हिन्दी', english: 'Hindi' },
  { code: 'en', label: 'English', english: 'English' },
  { code: 'mr', label: 'मराठी', english: 'Marathi' },
  { code: 'ta', label: 'தமிழ்', english: 'Tamil' },
  { code: 'te', label: 'తెలుగు', english: 'Telugu' },
  { code: 'bn', label: 'বাংলা', english: 'Bengali' },
]

const S = {
  appName: {
    hi: 'जीविकासेतु', en: 'JeevikaSetu', mr: 'जीविकासेतु', ta: 'ஜீவிகாசேது',
    te: 'జీవికాసేతు', bn: 'জীবিকাসেতু',
  },
  tagline: {
    hi: 'आपकी भाषा में, आपके हुनर की पहचान',
    en: 'Your skills, your language, your future',
    mr: 'तुमच्या भाषेत, तुमच्या कौशल्याची ओळख',
    ta: 'உங்கள் மொழியில், உங்கள் திறமைக்கு அங்கீகாரம்',
    te: 'మీ భాషలో, మీ నైపుణ్యానికి గుర్తింపు',
    bn: 'আপনার ভাষায়, আপনার দক্ষতার স্বীকৃতি',
  },
  ministry: {
    hi: 'सामाजिक न्याय एवं अधिकारिता मंत्रालय · PM-AJAY (GIA घटक)',
    en: 'Ministry of Social Justice & Empowerment · PM-AJAY (GIA component)',
  },
  startVoice: { hi: 'बात करें', en: 'Start Voice Conversation', mr: 'बोला', ta: 'பேசுங்கள்', te: 'మాట్లాడండి', bn: 'কথা বলুন' },
  startVoiceSub: { hi: 'माइक दबाइए और बोलिए', en: 'Press the mic and speak', mr: 'माइक दाबा आणि बोला', ta: 'மைக்கை அழுத்தி பேசுங்கள்', te: 'మైక్ నొక్కి మాట్లాడండి', bn: 'মাইক চেপে বলুন' },
  callUs: { hi: 'Call करें', en: 'Simulate IVR Call', mr: 'कॉल करा', ta: 'அழைக்கவும்', te: 'కాల్ చేయండి', bn: 'কল করুন' },
  callUsSub: { hi: 'साधारण फोन से भी', en: 'Works on feature phones', mr: 'साध्या फोनवरही', ta: 'சாதாரண போனிலும்', te: 'సాధారణ ఫోన్‌లోనూ', bn: 'সাধারণ ফোনেও' },
  whatsapp: { hi: 'WhatsApp', en: 'WhatsApp', mr: 'WhatsApp', ta: 'WhatsApp', te: 'WhatsApp', bn: 'WhatsApp' },
  whatsappSub: { hi: 'वॉइस नोट भेजिए', en: 'Send a voice note', mr: 'व्हॉइस नोट पाठवा', ta: 'குரல் குறிப்பு அனுப்பவும்', te: 'వాయిస్ నోట్ పంపండి', bn: 'ভয়েস নোট পাঠান' },
  listening: { hi: 'सुन रहे हैं…', en: 'Listening…', mr: 'ऐकत आहोत…', ta: 'கேட்கிறோம்…', te: 'వింటున్నాం…', bn: 'শুনছি…' },
  processing: { hi: 'समझ रहे हैं…', en: 'Processing…', mr: 'समजून घेत आहोत…', ta: 'செயலாக்குகிறது…', te: 'ప్రాసెస్ చేస్తోంది…', bn: 'বুঝছি…' },
  speaking: { hi: 'बोल रहे हैं…', en: 'Speaking…', mr: 'बोलत आहोत…', ta: 'பேசுகிறது…', te: 'మాట్లాడుతోంది…', bn: 'বলছি…' },
  tapToSpeak: { hi: 'बोलने के लिए दबाएँ', en: 'Tap to speak', mr: 'बोलण्यासाठी दाबा', ta: 'பேச தட்டவும்', te: 'మాట్లాడటానికి నొక్కండి', bn: 'বলতে চাপুন' },
  typeInstead: { hi: 'या यहाँ लिखें', en: 'or type your answer here', mr: 'किंवा इथे लिहा', ta: 'அல்லது இங்கே எழுதுங்கள்', te: 'లేదా ఇక్కడ రాయండి', bn: 'অথবা এখানে লিখুন' },
  send: { hi: 'भेजें', en: 'Send', mr: 'पाठवा', ta: 'அனுப்பு', te: 'పంపు', bn: 'পাঠান' },
  progress: { hi: 'बातचीत की प्रगति', en: 'Interview progress', mr: 'प्रगती', ta: 'முன்னேற்றம்', te: 'పురోగతి', bn: 'অগ্রগতি' },
  viewProfile: { hi: 'मेरी जानकारी देखें', en: 'View my profile', mr: 'माझी माहिती पहा', ta: 'என் விவரம் பார்க்க', te: 'నా వివరాలు చూడండి', bn: 'আমার তথ্য দেখুন' },
  generateRecs: { hi: 'सुझाव तैयार करें', en: 'Generate Recommendations', mr: 'शिफारसी तयार करा', ta: 'பரிந்துரைகளை உருவாக்கு', te: 'సిఫార్సులు రూపొందించండి', bn: 'সুপারিশ তৈরি করুন' },
  profileTitle: { hi: 'लाभार्थी प्रोफ़ाइल', en: 'Beneficiary Profile', mr: 'लाभार्थी प्रोफाइल', ta: 'பயனாளர் விவரம்', te: 'లబ్ధిదారు ప్రొఫైల్', bn: 'উপকারভোগীর প্রোফাইল' },
  recsTitle: { hi: 'आपके लिए सुझाए गए रास्ते', en: 'Recommended pathways for you', mr: 'तुमच्यासाठी शिफारसी', ta: 'உங்களுக்கான பரிந்துரைகள்', te: 'మీ కోసం సిఫార్సులు', bn: 'আপনার জন্য সুপারিশ' },
  largeText: { hi: 'बड़े अक्षर', en: 'Large text' },
  highContrast: { hi: 'हाई कॉन्ट्रास्ट', en: 'High contrast' },
  demoMode: { hi: 'डेमो मोड', en: 'Demo Mode' },
  skillMatch: { hi: 'हुनर मिलान', en: 'Skill match' },
  rplEligible: { hi: 'RPL पात्र', en: 'RPL eligible' },
  gaps: { hi: 'सीखना बाकी', en: 'Skill gaps' },
  training: { hi: 'प्रशिक्षण', en: 'Training' },
  centre: { hi: 'केंद्र', en: 'Centre' },
  income: { hi: 'अनुमानित आय', en: 'Income potential' },
  giaSupport: { hi: 'PM-AJAY सहायता', en: 'PM-AJAY GIA support' },
  roadmap: { hi: 'आगे का रास्ता', en: 'Your roadmap' },
  download: { hi: 'रिपोर्ट डाउनलोड करें', en: 'Download report (PDF)' },
  restart: { hi: 'फिर से शुरू करें', en: 'Start again' },
}

export function tr(key, lang = 'hi') {
  const entry = S[key]
  if (!entry) return key
  return entry[lang] || entry.en || entry.hi
}

export default S
