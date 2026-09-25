"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { BrowserVoiceAdapter } from "@/core/adapters/browserVoiceAdapter";
import { ConversationEngine } from "@/core/engine/ConversationEngine";
import { Mic, PhoneCall, Phone, PhoneOff, Settings2, Globe, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

let voiceAdapter: BrowserVoiceAdapter | null = null;

export default function VoiceAssistantPage() {
  const { currentSession, startSession, updateSessionStatus, addMessage, profile, updateProfile, language } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);
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
    setModalOpen(false);
    startSession('web');
    startConversationFlow();
  };

  const handleStartPhoneCall = () => {
    setModalOpen(false);
    startSession('phone');
    // For phone call demo, it would integrate with an actual webhook. Here we just show the state.
    addMessage("Ringing Livelihood Mitra...", "system");
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
      // Automatically start listening when agent finishes speaking
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
    updateSessionStatus('active'); // processing state
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

  return (
    <div className="flex-1 bg-surface flex flex-col items-center justify-center relative overflow-hidden min-h-[calc(100vh-64px)]">
      
      {/* Background decoration */}
      <div className="absolute top-0 w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50/50 -z-10" />

      {!currentSession || currentSession.status === 'completed' ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center flex flex-col items-center max-w-lg p-8 bg-white rounded-3xl shadow-xl border border-gray-100"
        >
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Mic className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Voice Assistant</h1>
          <p className="text-gray-500 mb-8">Start a conversation to find the right livelihood opportunities based on your skills.</p>
          
          <button 
            onClick={() => setModalOpen(true)}
            className="w-full py-4 px-6 bg-primary text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-primary-700 transition shadow-lg shadow-primary/25"
          >
            <PhoneCall className="w-5 h-5" />
            Connect with Mitra
          </button>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-3xl flex flex-col h-full py-12 px-6"
        >
          {/* Header */}
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                {currentSession.channel === 'phone' ? <Phone className="w-6 h-6 text-blue-600"/> : <Globe className="w-6 h-6 text-blue-600"/>}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Livelihood Mitra</h3>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  {isSpeaking ? "AI is speaking" : isListening ? "Listening..." : "Processing"}
                </p>
              </div>
            </div>
            
            <button 
              onClick={handleEndCall}
              className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>

          {/* Transcript Area */}
          <div className="flex-1 overflow-y-auto mb-8 space-y-4 px-2 custom-scrollbar">
            {currentSession.messages.map((msg, idx) => (
              <div key={idx} className={`flex w-full ${msg.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.speaker === 'user' ? 'bg-primary text-white rounded-tr-none' : 
                  msg.speaker === 'system' ? 'bg-gray-100 text-gray-500 text-sm text-center w-full mx-auto italic' : 
                  'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {currentText && (
              <div className="flex w-full justify-end">
                <div className="max-w-[80%] p-4 rounded-2xl bg-primary/20 text-gray-800 rounded-tr-none animate-pulse">
                  {currentText}
                </div>
              </div>
            )}
          </div>

          {/* Voice Visualizer / Controls */}
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="h-16 flex items-center gap-1">
              {[...Array(9)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: (isSpeaking || isListening) ? [20, Math.random() * 40 + 20, 20] : 10
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.5 + (Math.random() * 0.5),
                  }}
                  className={`w-2 rounded-full ${isSpeaking ? 'bg-blue-500' : isListening ? 'bg-green-500' : 'bg-gray-300'}`}
                />
              ))}
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={() => {}}
                className="w-14 h-14 bg-white text-gray-700 rounded-full flex items-center justify-center shadow-sm border border-gray-200"
              >
                <Settings2 className="w-6 h-6" />
              </button>
              
              <button 
                onClick={() => isListening ? voiceAdapter?.stopListening() : startListening()}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition ${
                  isListening ? 'bg-red-500 text-white' : 'bg-primary text-white hover:bg-primary-700'
                }`}
              >
                <Mic className="w-6 h-6" />
              </button>
              
              <button 
                onClick={() => voiceAdapter?.stopSpeaking()}
                className="w-14 h-14 bg-white text-gray-700 rounded-full flex items-center justify-center shadow-sm border border-gray-200"
              >
                <VolumeX className="w-6 h-6" />
              </button>
            </div>
          </div>

        </motion.div>
      )}

      {/* Call Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Call with Livelihood Mitra</h2>
              
              <div className="space-y-4">
                <button 
                  onClick={handleStartPhoneCall}
                  className="w-full flex items-center p-4 bg-gray-50 border border-gray-200 rounded-2xl hover:bg-gray-100 hover:border-gray-300 transition group"
                >
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 mr-4">
                    <Phone className="w-6 h-6 text-gray-700 group-hover:text-primary transition" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-gray-900">Phone Call</h4>
                    <p className="text-sm text-gray-500">+91 800-123-4567</p>
                  </div>
                </button>
                
                <button 
                  onClick={handleStartWebCall}
                  className="w-full flex items-center p-4 bg-blue-50 border border-blue-200 rounded-2xl hover:bg-blue-100 transition group"
                >
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-blue-100 mr-4">
                    <Globe className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-blue-900">Web Call</h4>
                    <p className="text-sm text-blue-600/80">Using your browser audio</p>
                  </div>
                </button>
              </div>

              <button 
                onClick={() => setModalOpen(false)}
                className="mt-6 w-full text-center text-gray-500 font-medium py-2 hover:bg-gray-50 rounded-xl"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
