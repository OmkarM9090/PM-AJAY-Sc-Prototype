"use client";

import { useAppStore } from "@/store/useAppStore";
import { useState } from "react";
import dynamic from 'next/dynamic';
import { Target, MapPin, Navigation, Map as MapIcon, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Opportunity } from "@/core/models/types";

const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center text-gray-400"><MapIcon /></div>
});

export default function RecommendationsPage() {
  const { recommendations, profile } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'training' | 'job' | 'self-employment'>('all');
  const router = useRouter();

  const filteredRecs = filter === 'all' 
    ? recommendations 
    : recommendations.filter(r => r.opportunity.type === filter);

  const getMarkerData = () => {
    return filteredRecs.map(r => ({
      id: r.opportunity.id,
      lat: r.opportunity.lat,
      lng: r.opportunity.lng,
      title: r.opportunity.title,
      type: r.opportunity.type
    }));
  };

  return (
    <div className="flex-1 bg-surface flex flex-col p-6 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Opportunities for you</h1>
          <p className="text-gray-500 mt-2">
            Based on your {profile.skills?.length || 0} skills and {profile.radius || 'any'}km limit
          </p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-xl">
          {['all', 'training', 'job', 'self-employment'].map((f) => (
            <button 
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f === 'all' ? 'All Types' : f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-8 h-[calc(100vh-200px)]">
        
        {/* LIST */}
        <div className="w-1/2 flex flex-col gap-4 overflow-y-auto pr-4 custom-scrollbar">
          {filteredRecs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-3xl border border-gray-100 border-dashed text-gray-500 text-center p-8">
              <Target className="w-12 h-12 mb-4 text-gray-300" />
              <p>No opportunities found for the current filters.</p>
              <p className="text-sm mt-2">Try changing your preferences or search radius.</p>
            </div>
          ) : (
            filteredRecs.map((rec, i) => (
              <div 
                key={rec.opportunity.id} 
                className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-primary/50 hover:shadow-lg transition cursor-pointer group"
                onClick={() => router.push(`/recommendations/${rec.opportunity.id}`)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 text-lg group-hover:text-primary transition">{rec.opportunity.title}</h3>
                  <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-md whitespace-nowrap ml-4 border border-green-100">
                    {(rec.scoreComponents.total * 100).toFixed(0)}% MATCH
                  </span>
                </div>
                
                <p className="text-sm text-gray-500 mb-4">{rec.opportunity.provider}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium capitalize flex items-center gap-1">
                    {rec.opportunity.type}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium flex items-center gap-1">
                    <Navigation className="w-3 h-3" /> {Math.round(rec.distance)} km away
                  </span>
                  {rec.opportunity.nsqfLevel && (
                    <span className="px-2 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded text-xs font-medium">
                      NSQF L{rec.opportunity.nsqfLevel}
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                  <p className="text-sm text-gray-600 line-clamp-1">{rec.whyThisMatch.reasons[0]}</p>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* MAP */}
        <div className="w-1/2 h-full bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm relative">
          <Map 
            center={[profile.location?.lat || 19.2183, profile.location?.lng || 73.0867]}
            radiusKm={profile.radius}
            markers={getMarkerData()}
          />
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-md border border-gray-200 z-[400]">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> 
              {profile.location?.locationName || 'Your Location'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">Showing {filteredRecs.length} opportunities within {profile.radius || 50}km</p>
          </div>
        </div>

      </div>
    </div>
  );
}
