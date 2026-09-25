"use client";

import { useAppStore } from "@/store/useAppStore";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, MapPin, Building, GraduationCap, Clock, IndianRupee, 
  Phone, Globe, Share2, BookmarkPlus, Map as MapIcon, CheckCircle2,
  AlertTriangle, Check, BookOpen
} from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Recommendation } from "@/core/models/types";

const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="w-full h-48 bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center text-gray-400"><MapIcon /></div>
});

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { recommendations, addNotification, roadmap, setRoadmap } = useAppStore();
  
  const [rec, setRec] = useState<Recommendation | null>(null);

  useEffect(() => {
    if (params.id) {
      const found = recommendations.find(r => r.opportunity.id === params.id);
      if (found) setRec(found);
    }
  }, [params.id, recommendations]);

  if (!rec) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-500">Loading opportunity details...</p>
      </div>
    );
  }

  const { opportunity: opp, skillGap, whyThisMatch } = rec;

  const handleAddToRoadmap = () => {
    addNotification({
      type: 'roadmap',
      title: 'Added to Roadmap',
      message: `${opp.title} has been added to your actionable roadmap.`
    });
    router.push('/roadmap');
  };

  return (
    <div className="flex-1 bg-surface flex flex-col min-h-screen pb-20">
      
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition"
          >
            <ArrowLeft className="w-5 h-5" /> Back to List
          </button>
          <div className="flex gap-3">
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition">
              <BookmarkPlus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full px-6 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* MAIN CONTENT */}
        <div className="flex-1 space-y-8">
          
          {/* TITLE CARD */}
          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold uppercase tracking-wider">
                {opp.type}
              </span>
              {(opp.nsqfLevel || opp.rplRelevant) && (
                <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-lg text-xs font-bold tracking-wider uppercase">
                  {opp.nsqfLevel ? `NSQF Level ${opp.nsqfLevel}` : 'RPL Eligible'}
                </span>
              )}
            </div>
            
            <h1 className="text-3xl font-extrabold text-gray-900 mb-4">{opp.title}</h1>
            
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              {opp.description}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-t border-gray-100">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1"><Building className="w-3 h-3"/> Provider</span>
                <span className="font-medium text-gray-900">{opp.provider}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1"><MapPin className="w-3 h-3"/> Location</span>
                <span className="font-medium text-gray-900">{opp.location}</span>
              </div>
              {opp.duration && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1"><Clock className="w-3 h-3"/> Duration</span>
                  <span className="font-medium text-gray-900">{opp.duration}</span>
                </div>
              )}
              {opp.fees && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1"><IndianRupee className="w-3 h-3"/> Cost</span>
                  <span className="font-medium text-green-700">{opp.fees}</span>
                </div>
              )}
            </div>
          </div>

          {/* WHY THIS MATCH & NEXT STEPS */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 p-8 rounded-3xl border border-green-100">
            <h2 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              Why this is a {(rec.scoreComponents.total * 100).toFixed(0)}% Match for you
            </h2>
            
            <ul className="space-y-3 mb-8">
              {whyThisMatch.reasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-green-700" />
                  </div>
                  <span className="text-gray-800">{reason}</span>
                </li>
              ))}
            </ul>

            <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Recommended Next Step</h3>
              <p className="font-medium text-gray-900 text-lg mb-6">{whyThisMatch.nextStep}</p>
              
              <button 
                onClick={handleAddToRoadmap}
                className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition shadow-lg shadow-gray-200"
              >
                Add to My Roadmap
              </button>
            </div>
          </div>

          {/* SKILL GAP ANALYSIS */}
          {skillGap && (
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-blue-600" />
                Skill Gap Analysis
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" /> Skills You Have
                  </h3>
                  {skillGap.alreadyKnow.length > 0 ? (
                    <ul className="space-y-2">
                      {skillGap.alreadyKnow.map((s, i) => (
                        <li key={i} className="text-gray-700 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> {s}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-sm italic">No direct skills matched yet.</p>
                  )}
                </div>
                
                <div className="p-6 bg-red-50/50 rounded-2xl border border-red-100">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" /> Skills You Need
                  </h3>
                  {skillGap.needToLearn.length > 0 ? (
                    <ul className="space-y-2">
                      {skillGap.needToLearn.map((s, i) => (
                        <li key={i} className="text-gray-700 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400" /> {s}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-green-600 text-sm font-medium">You have all the required skills!</p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* SIDEBAR */}
        <div className="w-full lg:w-80 space-y-6">
          
          {/* MAP */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="h-48 relative">
              <Map 
                center={[opp.lat, opp.lng]}
                markers={[{ id: opp.id, lat: opp.lat, lng: opp.lng, title: opp.title, type: opp.type }]}
              />
            </div>
            <div className="p-5 bg-white">
              <p className="text-sm font-bold text-gray-900">{Math.round(rec.distance)} km away</p>
              <p className="text-sm text-gray-500 mt-1">{opp.location}</p>
            </div>
          </div>

          {/* CONTACT INFO */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Contact Provider</h3>
            <div className="space-y-4">
              {opp.contactName && (
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Point of Contact</span>
                  <span className="text-sm font-medium text-gray-900">{opp.contactName}</span>
                </div>
              )}
              {opp.phone && (
                <a href={`tel:${opp.phone}`} className="flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition">
                  <Phone className="w-5 h-5" />
                  <span className="font-bold">{opp.phone}</span>
                </a>
              )}
            </div>
          </div>
          
          {/* SOURCE METADATA */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Data Source</h4>
            <p className="text-sm text-gray-700 font-medium">{opp.sourceMetadata.source}</p>
            {opp.sourceMetadata.verificationStatus === 'demo' && (
              <span className="inline-block mt-2 px-2 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold uppercase rounded">Demo Data</span>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
