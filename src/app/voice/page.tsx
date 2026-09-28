"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, CheckCircle2, Keyboard, LoaderCircle, Mic, PhoneOff, Sparkles, Volume2, VolumeX } from "lucide-react";
import { useRouter } from "next/navigation";
import { api, BeneficiaryProfile, ChatMessage, LanguageCode } from "@/lib/api";
import { speechLocale } from "@/lib/languages";
import { getRecognitionConstructor, RecognitionLike } from "@/lib/speech";
import { readSavedSession, saveSavedSession } from "@/lib/session";
import { ScreenRecorder } from "@/components/jeevika/ScreenRecorder";

type VoiceState = "idle" | "listening" | "processing" | "speaking" | "understood";
const TOPICS = [
  ["name", "Name"], ["location", "Location"], ["education", "Education"], ["family_occupation", "Traditional work"],
  ["current_livelihood", "Current work"], ["interests", "Goals"], ["employment_preference", "Work preference"], ["mobility_km", "Travel"], ["physical_constraints", "Constraints"],
];

export default function VoiceConversationPage() {
  const router = useRouter();
  const [language, setLanguage] = useState<LanguageCode>("hi");
  const [sessionId, setSessionId] = useState<string>();
  const [profile, setProfile] = useState<BeneficiaryProfile>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [interim, setInterim] = useState("");
  const [typedText, setTypedText] = useState("");
  const [error, setError] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState<LanguageCode>();
  const [showConsent, setShowConsent] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 9, covered: [] as string[] });
  const recognition = useRef<RecognitionLike | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const recorderStream = useRef<MediaStream | null>(null);
  const recorderChunks = useRef<Blob[]>([]);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const saved = readSavedSession();
    // Defer local-storage hydration until after the initial server render.
    const timer = window.setTimeout(() => {
      setLanguage(saved.language);
      if (saved.sessionId) {
        setSessionId(saved.sessionId);
        if (saved.profile) setProfile(saved.profile);
        api.getSession(saved.sessionId).then((session) => {
          setSessionId(session.id); setProfile(session.profile); setMessages(session.messages); setProgress(session.progress);
        }).catch(() => { /* an expired backend session simply starts fresh */ });
      }
    }, 0);
    return () => { window.clearTimeout(timer); recognition.current?.abort(); recorder.current?.stop(); audio.current?.pause(); window.speechSynthesis?.cancel(); };
  }, []);

  const browserSpeak = (text: string, lang: LanguageCode, onEnd: () => void) => {
    if (!("speechSynthesis" in window)) { onEnd(); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text); utterance.lang = speechLocale(lang); utterance.rate = 0.93;
    utterance.onend = onEnd; utterance.onerror = onEnd; window.speechSynthesis.speak(utterance);
  };

  const speak = async (text: string, lang: LanguageCode) => {
    setVoiceState("speaking");
    const done = () => setVoiceState("understood");
    try {
      const response = await api.synthesize(text, lang);
      if (response.headers.get("content-type")?.includes("audio/")) {
        const url = URL.createObjectURL(await response.blob());
        const player = new Audio(url); audio.current = player;
        player.onended = () => { URL.revokeObjectURL(url); done(); };
        player.onerror = () => { URL.revokeObjectURL(url); browserSpeak(text, lang, done); };
        await player.play(); return;
      }
    } catch { /* browser speech is the intentional local fallback */ }
    browserSpeak(text, lang, done);
  };

  const startConversation = async () => {
    setError(""); setVoiceState("processing");
    try {
      const created = await api.createSession("web", language, true);
      setSessionId(created.session_id); setProfile(created.profile); setProgress(created.progress);
      setMessages([{ speaker: "agent", text: created.greeting, language }]);
      saveSavedSession({ sessionId: created.session_id, language, profile: created.profile, recommendations: [] });
      await speak(created.greeting, language);
    } catch (caught) { setVoiceState("idle"); setError(caught instanceof Error ? caught.message : "We could not start the conversation."); }
  };

  const sendTurn = async (text: string) => {
    if (!sessionId || !text.trim()) return;
    recognition.current?.stop?.(); setInterim(""); setVoiceState("processing"); setError("");
    const user: ChatMessage = { speaker: "user", text: text.trim(), language };
    setMessages((existing) => [...existing, user]); setTypedText("");
    try {
      const result = await api.sendMessage(sessionId, text.trim(), language);
      const agent: ChatMessage = { speaker: "agent", text: result.agent_text, language: result.response_language };
      setMessages((existing) => [...existing, agent]); setProfile(result.profile); setProgress(result.progress); setDetectedLanguage(result.detected_language as LanguageCode);
      saveSavedSession({ sessionId, language, profile: result.profile });
      await speak(result.agent_text, result.response_language as LanguageCode);
      if (result.completed) setVoiceState("understood");
    } catch (caught) { setVoiceState("understood"); setError(caught instanceof Error ? caught.message : "We could not understand that. Please try again."); }
  };

  const stopRecorder = () => { if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop(); };
  const startMediaRecorder = async () => {
    try {
      recorderStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const media = new MediaRecorder(recorderStream.current); recorder.current = media; recorderChunks.current = [];
      media.ondataavailable = (event) => { if (event.data.size) recorderChunks.current.push(event.data); };
      media.onstop = async () => {
        recorderStream.current?.getTracks().forEach((track) => track.stop()); setVoiceState("processing");
        try {
          const result = await api.transcribe(new Blob(recorderChunks.current, { type: media.mimeType || "audio/webm" }), language);
          if (result.transcript) await sendTurn(result.transcript); else { setVoiceState("understood"); setError(result.message || "Please use the text box; server transcription is not configured."); }
        } catch (caught) { setVoiceState("understood"); setError(caught instanceof Error ? caught.message : "Microphone transcription failed."); }
      };
      media.start(); setVoiceState("listening");
    } catch { setVoiceState("understood"); setError("Microphone permission was not granted. You can type your answer instead."); }
  };

  const toggleListening = async () => {
    if (!sessionId) { setShowConsent(true); return; }
    if (voiceState === "listening") { recognition.current?.stop?.(); stopRecorder(); return; }
    setError(""); window.speechSynthesis?.cancel(); audio.current?.pause();
    const Recognition = getRecognitionConstructor();
    if (!Recognition) { await startMediaRecorder(); return; }
    const nextRecognition = new Recognition(); recognition.current = nextRecognition;
    nextRecognition.lang = speechLocale(language); nextRecognition.continuous = false; nextRecognition.interimResults = true;
    nextRecognition.onstart = () => setVoiceState("listening");
    nextRecognition.onresult = (event) => {
      let finalText = ""; let partial = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (event.results[index].isFinal) finalText += event.results[index][0].transcript; else partial += event.results[index][0].transcript;
      }
      setInterim(partial); if (finalText) { nextRecognition.stop(); void sendTurn(finalText); }
    };
    nextRecognition.onerror = (event) => { setVoiceState("understood"); if (event.error !== "no-speech" && event.error !== "aborted") setError("I could not hear that clearly. Please try again or type your answer."); };
    nextRecognition.onend = () => setInterim("");
    try { nextRecognition.start(); } catch { await startMediaRecorder(); }
  };

  const submitText = (event: FormEvent) => { event.preventDefault(); void sendTurn(typedText); };
  const loadDemo = async () => { try { const demo = await api.loadDemo("ramesh", language); saveSavedSession({ sessionId: demo.session_id, language, profile: demo.profile, recommendations: demo.recommendations }); router.push("/profile"); } catch { setError("Demo profile could not be loaded. Please start a live conversation."); } };
  const stateLabel: Record<VoiceState, string> = { idle: "Ready", listening: "Listening…", processing: "Processing…", speaking: "Speaking…", understood: "Understood" };

  return <div className="voice-layout">
    <div className="voice-top"><div><p className="page-eyebrow">WebRTC-style browser voice channel</p><h1 className="page-title" style={{ fontSize: "clamp(28px,4vw,38px)" }}>Talk to JeevikaSetu</h1><p className="page-subtitle" style={{ fontSize: 14 }}>Speak naturally or use the text fallback. The assistant asks one simple question at a time and saves each understood detail.</p></div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><ScreenRecorder/><button className="btn btn-secondary btn-small" onClick={loadDemo}><Sparkles size={15}/> Demo Mode: Ramesh</button></div></div>
    <div className="notice notice--blue" style={{ marginBottom: 18 }}><b>Consent first:</b> Voice is used only for this prototype conversation. Do not share Aadhaar, bank details or other sensitive IDs. Audio is not retained by the local fallback.</div>
    <div className="voice-grid">
      <section className="conversation-card card" aria-live="polite">
        <div className="conversation-meta"><div className="agent-mini"><span className="avatar"><Bot size={20}/></span><div><b>JeevikaSetu</b><span>Warm livelihood guide</span></div></div><span className={`status-pill status-${voiceState}`}>{voiceState === "processing" && <LoaderCircle size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} className="animate-spin"/>}{stateLabel[voiceState]}</span></div>
        {error && <div className="voice-error">{error}</div>}
        <div className="transcript">
          {!messages.length && <div className="bubble bubble--agent">{language === "hi" ? "बात शुरू करने के लिए नीचे microphone दबाइए।" : "Press the microphone below to begin."}</div>}
          {messages.map((message, index) => <div className={`bubble bubble--${message.speaker === "user" ? "user" : "agent"}`} key={`${message.text}-${index}`}>{message.text}</div>)}
          {interim && <div className="bubble bubble--user bubble--interim">{interim}</div>}
        </div>
        <div className="voice-controls"><div className={voiceState === "listening" || voiceState === "speaking" ? "wave wave--active" : "wave"}>{Array.from({ length: 11 }).map((_, index) => <i key={index}/>)}</div><div className="mic-row"><button className="btn btn-secondary btn-small" aria-label="Stop assistant voice" onClick={() => { audio.current?.pause(); window.speechSynthesis?.cancel(); setVoiceState("understood"); }}><VolumeX size={16}/></button><button className={voiceState === "listening" ? "mic-button mic-button--live" : "mic-button"} aria-label={voiceState === "listening" ? "Stop listening" : "Start listening"} onClick={() => void toggleListening()}><Mic size={27}/></button><button className="btn btn-secondary btn-small" aria-label="End session" onClick={() => { recognition.current?.stop?.(); stopRecorder(); setVoiceState("idle"); }}><PhoneOff size={16}/></button></div><form className="composer" onSubmit={submitText}><input value={typedText} onChange={(event) => setTypedText(event.target.value)} placeholder={language === "hi" ? "या अपना जवाब लिखें…" : "Or type your answer…"} aria-label="Text fallback"/><button className="btn btn-primary btn-small" type="submit"><Keyboard size={15}/>Send</button></form><p className="recorder-note">Uses browser Speech Recognition when available; MediaRecorder → Whisper is used when a server key is configured.</p></div>
      </section>
      <aside className="voice-side"><section className="side-card card"><h3>Conversation progress</h3><div className="progress-steps">{TOPICS.map(([id, label]) => <div key={id} className={progress.covered.includes(id) ? "progress-step progress-step--done" : progress.covered.length === TOPICS.findIndex(([topic]) => topic === id) ? "progress-step progress-step--current" : "progress-step"}>{progress.covered.includes(id) ? <CheckCircle2 size={13}/> : null} {label}</div>)}</div><p className="muted" style={{ fontSize: 11, marginTop: 12 }}>{progress.completed} of {progress.total} topics understood</p></section><section className="side-card card"><h3><Volume2 size={15} style={{ verticalAlign: "-3px" }}/> Language signal</h3><p style={{ margin: 0, fontSize: 13 }}>Selected response language: <b>{({ hi: "Hindi", en: "English", mr: "Marathi", ta: "Tamil", te: "Telugu", bn: "Bengali" } as Record<string,string>)[language]}</b></p>{detectedLanguage && <p className="tag tag--green" style={{ marginTop: 8 }}>Detected this turn: {({ hi: "Hindi", en: "English", mr: "Marathi", ta: "Tamil", te: "Telugu", bn: "Bengali" } as Record<string,string>)[detectedLanguage]}</p>}<p className="muted" style={{ fontSize: 11, lineHeight: 1.5 }}>Speech language is detected on every turn. Your selected language remains stable for clear replies.</p></section><section className="side-card card"><h3>After the conversation</h3><p className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>Review or correct your profile, then see skill gaps, RPL screening and nearby illustrative centres.</p>{profile && <button className="btn btn-green btn-small" style={{ width: "100%" }} onClick={() => router.push("/profile")}>Review profile</button>}</section></aside>
    </div>
    {showConsent && <div className="consent-modal" role="dialog" aria-modal="true"><div className="consent-box card"><h2>{language === "hi" ? "क्या आप voice conversation के लिए सहमत हैं?" : "Do you consent to a voice conversation?"}</h2><p>{language === "hi" ? "हम आपकी आवाज़ से आपके हुनर और रोज़गार की ज़रूरत समझेंगे। कृपया Aadhaar, बैंक जानकारी या अन्य sensitive ID न बोलें।" : "We use your voice to understand skills and livelihood needs. Please do not say Aadhaar, bank information or other sensitive IDs."}</p><div className="consent-actions"><button className="btn btn-secondary" onClick={() => setShowConsent(false)}>Not now</button><button className="btn btn-primary" onClick={() => { setShowConsent(false); void startConversation(); }}>I agree & start</button></div></div></div>}
  </div>;
}
