"use client";

import { useAppStore } from "@/store/useAppStore";
import { Zap, CheckCircle2, Bookmark } from "lucide-react";

export default function SkillsPage() {
  const { profile } = useAppStore();

  return (
    <div className="flex-1 bg-surface p-6 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Skills</h1>
        <p className="text-gray-500 mt-2">Skills extracted from your conversation and their official NSQF/RPL mappings.</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> Extracted Informal Skills
          </h2>
        </div>
        <div className="p-6">
          {profile.skills?.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {profile.skills.map((skill, idx) => (
                <div key={idx} className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">{skill}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No skills detected yet. Start a conversation to build your profile.</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-purple-500" /> Official Mappings (NSQF / RPL)
          </h2>
          <p className="text-sm text-gray-500 mt-1">Sourced from National Qualifications Register (NQR)</p>
        </div>
        <div className="p-0">
          {profile.skills?.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {profile.skills.map((skill, idx) => {
                // Mock mapping logic
                const isMapped = skill.toLowerCase().includes('pump') || skill.toLowerCase().includes('electric');
                return (
                  <div key={idx} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 transition">
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">"{skill}"</h3>
                      {isMapped ? (
                        <p className="text-sm text-gray-600">Maps to: <span className="font-medium">Assistant Technician / Mechanic</span></p>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No direct occupational pathway mapped.</p>
                      )}
                    </div>
                    {isMapped ? (
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold border border-purple-200">NSQF Level 3</span>
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200">RPL Eligible</span>
                      </div>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold border border-gray-200">Unmapped</span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6">
              <p className="text-gray-500 italic">Waiting for skills to perform mapping...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
