import { LanguageCode } from "@/lib/api";

export const LANGUAGES: { code: LanguageCode; native: string; english: string; speech: string }[] = [
  { code: "hi", native: "हिंदी", english: "Hindi", speech: "hi-IN" },
  { code: "en", native: "English", english: "English", speech: "en-IN" },
  { code: "mr", native: "मराठी", english: "Marathi", speech: "mr-IN" },
  { code: "ta", native: "தமிழ்", english: "Tamil", speech: "ta-IN" },
  { code: "te", native: "తెలుగు", english: "Telugu", speech: "te-IN" },
  { code: "bn", native: "বাংলা", english: "Bengali", speech: "bn-IN" },
];
export const speechLocale = (code: LanguageCode) => LANGUAGES.find((item) => item.code === code)?.speech || "hi-IN";
