"use client";

import { useAppStore } from "@/store/useAppStore";
import { translations } from "@/lib/translations";
import { ShieldCheck, ArrowRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function ConsentPage() {
  const { language } = useAppStore();
  const router = useRouter();
  const t = (key: keyof typeof translations['en']) => translations[language as keyof typeof translations][key as any] || key;

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 bg-surface">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-white rounded-3xl p-8 sm:p-10 shadow-lg border border-gray-100 flex flex-col items-center text-center"
      >
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-8">
          <ShieldCheck className="w-12 h-12 text-green-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-4">
          {t("consent_title" as any)}
        </h1>
        <p className="text-lg text-gray-600 leading-relaxed mb-10">
          {t("consent_text" as any)}
        </p>

        <div className="w-full space-y-4">
          <button
            onClick={() => router.push("/voice")}
            className="w-full py-4 px-6 bg-primary text-white rounded-2xl font-bold text-xl flex items-center justify-center gap-3 hover:bg-primary-700 transition-colors shadow-md active:scale-[0.98]"
          >
            <ShieldCheck className="w-6 h-6" />
            {t("consent_agree" as any)}
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
          
          <button
            onClick={() => router.push("/")}
            className="w-full py-4 px-6 bg-gray-50 text-gray-600 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors active:scale-[0.98]"
          >
            <X className="w-5 h-5" />
            {t("consent_decline" as any)}
          </button>
        </div>
      </motion.div>
    </main>
  );
}
