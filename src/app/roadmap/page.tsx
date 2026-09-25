"use client";

import { useAppStore } from "@/store/useAppStore";
import { CheckCircle2, Circle, ArrowRight, Save, Target } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RoadmapPage() {
  const { profile, recommendations } = useAppStore();
  const router = useRouter();
  
  const hasProfile = profile.education || profile.skills?.length > 0;
  const bestRec = recommendations.length > 0 ? recommendations[0] : null;

  return (
    <div className="flex-1 bg-surface p-6 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Actionable Roadmap</h1>
        <p className="text-gray-500 mt-2">A personalized step-by-step guide based on your profile.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
        
        <div className="absolute left-12 top-12 bottom-12 w-0.5 bg-gray-100 z-0" />

        <div className="space-y-8 relative z-10">
          
          {/* STEP 1: PROFILE */}
          <div className="flex gap-6">
            <div className="shrink-0 mt-1 bg-white">
              {hasProfile ? <CheckCircle2 className="w-8 h-8 text-green-500" /> : <Circle className="w-8 h-8 text-gray-300" />}
            </div>
            <div>
              <h3 className={`text-lg font-bold ${hasProfile ? 'text-gray-900' : 'text-gray-500'}`}>1. Build your Profile</h3>
              <p className="text-gray-500 mt-1">Talk to Livelihood Mitra to share your education and interests.</p>
              {!hasProfile && (
                <button onClick={() => router.push('/voice')} className="mt-3 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2">
                  Start Talking <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* STEP 2: SKILLS IDENTIFICATION */}
          <div className="flex gap-6">
            <div className="shrink-0 mt-1 bg-white">
              {profile.skills?.length > 0 ? <CheckCircle2 className="w-8 h-8 text-green-500" /> : <Circle className="w-8 h-8 text-gray-300" />}
            </div>
            <div>
              <h3 className={`text-lg font-bold ${profile.skills?.length > 0 ? 'text-gray-900' : 'text-gray-500'}`}>2. Identify Skills</h3>
              <p className="text-gray-500 mt-1">Automatically extract informal skills from your conversation.</p>
              {profile.skills?.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {profile.skills.slice(0, 3).map(s => <span key={s} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 font-bold">{s}</span>)}
                </div>
              )}
            </div>
          </div>

          {/* STEP 3: MAPPING & RECOMMENDATION */}
          <div className="flex gap-6">
            <div className="shrink-0 mt-1 bg-white">
              {bestRec ? <CheckCircle2 className="w-8 h-8 text-green-500" /> : <Circle className="w-8 h-8 text-gray-300" />}
            </div>
            <div>
              <h3 className={`text-lg font-bold ${bestRec ? 'text-gray-900' : 'text-gray-500'}`}>3. Find Opportunities</h3>
              <p className="text-gray-500 mt-1">Map your skills to NSQF pathways and find local opportunities.</p>
              {bestRec && (
                <div className="mt-3 p-4 bg-blue-50 border border-blue-100 rounded-xl flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-blue-900 text-sm">{bestRec.opportunity.title}</h4>
                    <p className="text-xs text-blue-700 mt-0.5">{bestRec.opportunity.provider} • {Math.round(bestRec.distance)}km away</p>
                  </div>
                  <Target className="w-5 h-5 text-blue-500" />
                </div>
              )}
            </div>
          </div>

          {/* STEP 4: NEXT ACTION */}
          <div className="flex gap-6">
            <div className="shrink-0 mt-1 bg-white">
              <Circle className="w-8 h-8 text-gray-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-500">4. Take Action</h3>
              {bestRec?.skillGap?.needToLearn.length ? (
                <p className="text-gray-500 mt-1">Complete a short-term skill gap training.</p>
              ) : (
                <p className="text-gray-500 mt-1">Connect with the provider to start your livelihood.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
