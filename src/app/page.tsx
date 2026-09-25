"use client";

import { useAppStore } from "@/store/useAppStore";
import { Mic, ArrowRight, PlayCircle, MapPin, User, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Home() {
  const { language } = useAppStore();
  const router = useRouter();

  const content = {
    hi: {
      hero: "Apne hunar se apna agla kadam dhoondhiye.",
      sub: "Apni bhasha mein bolkar apne skills, kaam ke mauke aur agla kadam samajhiye.",
      start: "Baat karke shuru karein",
      how: "Kaise kaam karta hai?",
      steps: [
        { title: "Boliye", desc: "Speak naturally in your preferred language" },
        { title: "Profile banega", desc: "We automatically understand your skills and constraints" },
        { title: "Skills aur mauke samjhenge", desc: "We find local opportunities within your area" },
        { title: "Agla kadam batayenge", desc: "Get a clear roadmap for your livelihood" }
      ]
    },
    mr: {
      hero: "तुमच्या कौशल्याने तुमचे पुढचे पाऊल शोधा.",
      sub: "तुमच्या भाषेत बोलून तुमचे कौशल्य, कामाच्या संधी आणि पुढचे पाऊल समजून घ्या.",
      start: "बोलून सुरुवात करा",
      how: "कसे काम करते?",
      steps: [
        { title: "बोला", desc: "तुमच्या भाषेत नैसर्गिकरित्या बोला" },
        { title: "प्रोफाईल बनेल", desc: "आम्ही तुमचे कौशल्य समजून घेतो" },
        { title: "संधी समजून घेऊ", desc: "आम्ही तुमच्या जवळील संधी शोधतो" },
        { title: "पुढचे पाऊल सांगू", desc: "तुमच्यासाठी योग्य रोडमॅप मिळेल" }
      ]
    },
    en: {
      hero: "Find your next step with your skills.",
      sub: "Understand your skills, work opportunities, and your next step just by speaking in your language.",
      start: "Start talking",
      how: "How it works?",
      steps: [
        { title: "Speak", desc: "Speak naturally in your preferred language" },
        { title: "Profile is built", desc: "We automatically understand your skills and constraints" },
        { title: "Understand skills & opportunities", desc: "We find local opportunities within your area" },
        { title: "Know the next step", desc: "Get a clear roadmap for your livelihood" }
      ]
    }
  };

  const currentContent = content[language as keyof typeof content] || content.hi;

  return (
    <main className="flex-1 bg-surface flex flex-col relative overflow-hidden">
      
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-50 to-transparent -z-10" />
      
      <div className="max-w-6xl mx-auto px-6 py-20 lg:py-32 flex flex-col items-center text-center">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-gray-700 font-medium text-sm mb-8 border border-gray-200 shadow-sm"
        >
          <span className="flex gap-2">
            <span className={language === 'mr' ? 'text-primary font-bold' : ''}>मराठी</span> • 
            <span className={language === 'hi' ? 'text-primary font-bold' : ''}>हिंदी</span> • 
            <span className={language === 'en' ? 'text-primary font-bold' : ''}>English</span>
          </span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight max-w-4xl"
        >
          {currentContent.hero}
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-xl text-gray-600 max-w-2xl"
        >
          {currentContent.sub}
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full justify-center"
        >
          <button
            onClick={() => router.push("/voice")}
            className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-primary-700 transition-all shadow-xl shadow-primary/20 active:scale-[0.98]"
          >
            <Mic className="w-6 h-6" />
            {currentContent.start}
            <ArrowRight className="w-5 h-5 ml-1" />
          </button>

          <a
            href="#how-it-works"
            className="w-full sm:w-auto px-8 py-4 bg-white text-gray-800 border-2 border-gray-200 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-gray-50 transition-all active:scale-[0.98]"
          >
            <PlayCircle className="w-5 h-5 text-gray-500" />
            {currentContent.how}
          </a>
        </motion.div>
      </div>

      <div id="how-it-works" className="bg-white py-24 border-t border-gray-100 mt-auto">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gray-100 -z-10" />
            
            {[
              { icon: Mic, ...currentContent.steps[0] },
              { icon: User, ...currentContent.steps[1] },
              { icon: MapPin, ...currentContent.steps[2] },
              { icon: CheckCircle2, ...currentContent.steps[3] }
            ].map((step, idx) => (
              <div key={idx} className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-6 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold absolute -ml-24 -mt-24 shadow-md z-10">{idx + 1}</div>
                  <step.icon className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </main>
  );
}
