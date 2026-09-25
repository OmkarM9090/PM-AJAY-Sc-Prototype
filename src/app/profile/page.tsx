"use client";

import { useAppStore } from "@/store/useAppStore";
import { User, MapPin, Briefcase, BookOpen, Clock, AlertCircle } from "lucide-react";

export default function ProfilePage() {
  const { profile } = useAppStore();

  return (
    <div className="flex-1 bg-surface p-6 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-2">Information built automatically from our conversation.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Education</h2>
          <p className="text-xl font-bold text-gray-900">{profile.education || <span className="text-gray-400 italic font-medium">Not detected yet</span>}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
            <Briefcase className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Employment Preference</h2>
          <p className="text-xl font-bold text-gray-900 capitalize">{profile.employmentPreference || <span className="text-gray-400 italic font-medium">Not decided yet</span>}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-4">
            <MapPin className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Location</h2>
          <p className="text-xl font-bold text-gray-900">{profile.location?.locationName || <span className="text-gray-400 italic font-medium">Not detected yet</span>}</p>
          {profile.location?.pincode && <p className="text-sm text-gray-500 mt-1">Pincode: {profile.location.pincode}</p>}
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Mobility Limit</h2>
          <p className="text-xl font-bold text-gray-900">{profile.mobility || <span className="text-gray-400 italic font-medium">No limit set</span>}</p>
        </div>

      </div>

      <div className="mt-8 bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Clock className="w-6 h-6 text-primary" /> Profile Status
        </h2>
        <div className="space-y-4">
          {['education', 'skills', 'employmentPreference', 'radius'].map(slot => {
            const isFilled = (profile as any)[slot] && (profile as any)[slot].length > 0;
            return (
              <div key={slot} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="font-medium text-gray-700 capitalize">{slot.replace(/([A-Z])/g, ' $1').trim()}</span>
                {isFilled ? (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Detected</span>
                ) : (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">Missing</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
