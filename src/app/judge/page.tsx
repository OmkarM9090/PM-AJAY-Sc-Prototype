"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { BrowserVoiceAdapter } from "@/core/adapters/browserVoiceAdapter";
import { ConversationEngine } from "@/core/engine/ConversationEngine";
import { 
  Phone, Globe, PhoneOff, Mic, Settings2, VolumeX,
  User, BookOpen, Briefcase, MapPin, Target, Zap, 
  Map as MapIcon, Compass, CheckCircle2, Navigation
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from 'next/dynamic';

// Dynamic import for Map to avoid SSR issues with Leaflet
const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center text-gray-400"><MapIcon /></div>
});

let voiceAdapter: BrowserVoiceAdapter | null = null;

export default function JudgeDashboardPage() {
  const { 
    currentSession, startSession, updateSessionStatus, addMessage, 
    profile, updateProfile, language, recommendations 
  } = useAppStore();
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentText, setCurrentText] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      voiceAdapter = new BrowserVoiceAdapter();
    }
    return () => {
      voiceAdapter?.stopListening();
      voiceAdapter?.stopSpeaking();
    };
  }, []);

  const handleStartWebCall = () => {
    startSession('web');
    startConversationFlow();
  };

  const handleStartPhoneCall = () => {
    startSession('phone');
    addMessage("Ringing Livelihood Mitra (Demo)...", "system");
  };

  const startConversationFlow = () => {
    const greeting = ConversationEngine.getInitialGreeting(language);
    addMessage(greeting, "agent");
    speakAgentResponse(greeting);
  };

  const speakAgentResponse = (text: string) => {
    setIsSpeaking(true);
    voiceAdapter?.speak(text, language, () => {
      setIsSpeaking(false);
      startListening();
    });
  };

  const startListening = () => {
    if (!voiceAdapter) return;
    setIsListening(true);
    voiceAdapter.startListening(
      (text, isFinal) => {
        setCurrentText(text);
        if (isFinal) {
          setIsListening(false);
          addMessage(text, "user");
          setCurrentText("");
          processUserResponse(text);
        }
      },
      (err) => {
        console.error(err);
        setIsListening(false);
        addMessage("Sorry, I didn't catch that.", "agent");
      }
    );
  };

  const processUserResponse = async (text: string) => {
    updateSessionStatus('active');
    const result = await ConversationEngine.processUserInput(text, profile);
    updateProfile(result.profileUpdates);
    
    addMessage(result.agentResponse, "agent");
    speakAgentResponse(result.agentResponse);
  };

  const handleEndCall = () => {
    updateSessionStatus('completed');
    voiceAdapter?.stopListening();
    voiceAdapter?.stopSpeaking();
    setIsSpeaking(false);
    setIsListening(false);
  };

  const slots = ['education', 'skills', 'employmentPreference', 'radius'];
  const filled = slots.filter(s => (profile as any)[s] && (profile as any)[s].length > 0).length;
  const progress = Math.round((filled / slots.length) * 100);

  const bestRec = recommendations.length > 0 ? recommendations[0] : null;

  return (
    <div className="flex-1 bg-gray-50 flex overflow-hidden min-h-[calc(100vh-64px)] p-6 gap-6">
      
      {/* LEFT: LIVE VOICE CONVERSATION */}
      <div className="w-1/3 bg-white rounded-3xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Mic className="w-5 h-5 text-primary" /> LIVE CONVERSATION
          </h2>
          <p className="text-sm text-gray-500 mt-1">Status: {currentSession ? currentSession.status.toUpperCase() : 'IDLE'}</p>
        </div>

        {!currentSession || currentSession.status === 'completed' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="space-y-4 w-full">
              <button 
                onClick={handleStartPhoneCall}
                className="w-full flex items-center p-4 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition group shadow-sm"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                  <Phone className="w-5 h-5 text-gray-700" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-bold text-gray-900">Start Phone Call</h4>
                  <p className="text-xs text-gray-500">Exotel/Twilio Demo</p>
                </div>
              </button>
              
              <button 
                onClick={handleStartWebCall}
                className="w-full flex items-center p-4 bg-primary text-white border border-primary-600 rounded-2xl hover:bg-primary-700 transition shadow-lg shadow-primary/20"
              >
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-4">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-bold text-white">Start Web Call</h4>
                  <p className="text-xs text-white/80">Browser Voice Adapter</p>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {currentSession.messages.map((msg, idx) => (
                <div key={idx} className={`flex w-full ${msg.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.speaker === 'user' ? 'bg-primary text-white rounded-tr-none' : 
                    msg.speaker === 'system' ? 'bg-gray-100 text-gray-500 text-xs text-center w-full mx-auto italic' : 
                    'bg-gray-100 text-gray-800 border border-gray-200 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {currentText && (
                <div className="flex w-full justify-end">
                  <div className="max-w-[85%] p-3 rounded-2xl bg-primary/20 text-gray-800 rounded-tr-none text-sm animate-pulse">
                    {currentText}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <div className="flex justify-center mb-4 h-8 items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: (isSpeaking || isListening) ? [10, Math.random() * 20 + 10, 10] : 4 }}
                    transition={{ repeat: Infinity, duration: 0.5 + (Math.random() * 0.5) }}
                    className={`w-1.5 rounded-full ${isSpeaking ? 'bg-blue-500' : isListening ? 'bg-green-500' : 'bg-gray-300'}`}
                  />
                ))}
              </div>
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => isListening ? voiceAdapter?.stopListening() : startListening()}
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition ${isListening ? 'bg-red-500 text-white' : 'bg-primary text-white hover:bg-primary-700'}`}
                >
                  <Mic className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleEndCall}
                  className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: LIVE BENEFICIARY INTELLIGENCE */}
      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> LIVE INTELLIGENCE
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-500 uppercase">Profile Progress</span>
            <div className="w-32 h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-1 uppercase"><BookOpen className="w-3 h-3"/> Education & Preference</h3>
              <p className="text-sm font-medium text-gray-800">{profile.education || <span className="text-gray-400 italic">Not detected</span>}</p>
              <p className="text-sm font-medium text-gray-800 capitalize mt-1">{profile.employmentPreference || <span className="text-gray-400 italic">No preference set</span>}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-1 uppercase"><MapPin className="w-3 h-3"/> Location & Mobility</h3>
              <p className="text-sm font-medium text-gray-800">{profile.location?.locationName || <span className="text-gray-400 italic">Detecting...</span>}</p>
              <p className="text-sm font-medium text-gray-800 mt-1">{profile.mobility || <span className="text-gray-400 italic">Any distance</span>}</p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase flex items-center gap-1"><Briefcase className="w-3 h-3"/> Extracted Skills</h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills?.length ? profile.skills.map((s, i) => (
                <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-sm font-medium">
                  {s}
                </span>
              )) : <p className="text-sm text-gray-400 italic">Listening for skills...</p>}
            </div>
          </div>

          {bestRec && (
            <div className="border border-green-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-green-50 p-4 border-b border-green-200 flex justify-between items-center">
                <h3 className="font-bold text-green-900 flex items-center gap-2"><Target className="w-4 h-4"/> Best Opportunity Match</h3>
                <span className="px-2 py-1 bg-green-200 text-green-800 text-xs font-bold rounded-md">{(bestRec.scoreComponents.total * 100).toFixed(0)}% MATCH</span>
              </div>
              
              <div className="p-4 bg-white">
                <h4 className="font-bold text-gray-900 mb-1">{bestRec.opportunity.title}</h4>
                <p className="text-sm text-gray-600 mb-4">{bestRec.opportunity.provider} • {Math.round(bestRec.distance)} km away</p>
                
                {(bestRec.opportunity.nsqfLevel || bestRec.opportunity.rplRelevant) && (
                  <div className="flex gap-2 mb-4">
                    {bestRec.opportunity.nsqfLevel && <span className="px-2 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded text-xs font-bold">NSQF Level {bestRec.opportunity.nsqfLevel}</span>}
                    {bestRec.opportunity.rplRelevant && <span className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-xs font-bold">RPL Eligible</span>}
                  </div>
                )}

                {bestRec.skillGap && (
                  <div className="mb-4">
                    <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">Skill Gap Analysis</h5>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <span className="text-xs text-gray-500 block mb-1">Has</span>
                        <div className="flex flex-wrap gap-1">
                          {bestRec.skillGap.alreadyKnow.length > 0 ? bestRec.skillGap.alreadyKnow.map(s => (
                            <span key={s} className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded text-xs">{s}</span>
                          )) : <span className="text-xs text-gray-400">None detected</span>}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <span className="text-xs text-gray-500 block mb-1">Needs</span>
                        <div className="flex flex-wrap gap-1">
                          {bestRec.skillGap.needToLearn.length > 0 ? bestRec.skillGap.needToLearn.map(s => (
                            <span key={s} className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded text-xs">{s}</span>
                          )) : <span className="text-xs text-green-600">All skills matched!</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-xl p-3">
                  <h5 className="text-xs font-bold text-gray-700 mb-2 uppercase">Deterministic Explanation</h5>
                  <ul className="space-y-1">
                    {bestRec.whyThisMatch.reasons.map((r, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        {r}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="text-xs font-bold text-gray-500">NEXT STEP: </span>
                    <span className="text-sm text-gray-800">{bestRec.whyThisMatch.nextStep}</span>
                  </div>
                </div>

              </div>
            </div>
          )}
          
          <div className="border border-gray-200 rounded-2xl overflow-hidden h-64 bg-gray-100 relative">
            <Map 
              center={[profile.location?.lat || 19.2183, profile.location?.lng || 73.0867]}
              radiusKm={profile.radius}
              markers={recommendations.map(r => ({
                id: r.opportunity.id,
                lat: r.opportunity.lat,
                lng: r.opportunity.lng,
                title: r.opportunity.title,
                type: r.opportunity.type
              }))}
            />
          </div>

        </div>
      </div>
      
    </div>
  );
}
