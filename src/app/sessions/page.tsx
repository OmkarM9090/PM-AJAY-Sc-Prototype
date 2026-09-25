"use client";

import { useAppStore } from "@/store/useAppStore";
import { History, Clock, FileText, Phone, Globe } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SessionsPage() {
  const { currentSession } = useAppStore();
  const router = useRouter();

  const sessions = currentSession ? [currentSession] : [];

  return (
    <div className="flex-1 bg-surface p-6 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Recent Sessions</h1>
        <p className="text-gray-500 mt-2">History of your conversations with Livelihood Mitra.</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        {sessions.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <History className="w-12 h-12 text-gray-300 mb-4" />
            <p>No recent sessions found.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sessions.map(s => (
              <div key={s.sessionId} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                    {s.channel === 'phone' ? <Phone className="w-5 h-5"/> : <Globe className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      Session {s.sessionId.toUpperCase()}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {s.status}
                      </span>
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 
                      {new Date(s.createdAt || Date.now()).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">Language: {s.language === 'en' ? 'English' : s.language === 'hi' ? 'Hindi' : 'Marathi'} • {s.messages.length} messages</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => router.push('/judge')} // For demo purposes, we link to judge dashboard to view transcripts
                  className="px-4 py-2 border border-gray-200 text-gray-700 font-medium text-sm rounded-xl hover:bg-gray-50 transition flex items-center gap-2 whitespace-nowrap"
                >
                  <FileText className="w-4 h-4" />
                  View Transcript
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
