"use client";

import Link from "next/link";
import { BarChart3, MapPinned, MessageCircle, Mic, PhoneCall, ShieldCheck, Sparkles, Volume2 } from "lucide-react";
import { useState } from "react";
import { readSavedSession } from "@/lib/session";

export default function LandingPage() {
  const [language] = useState(() => readSavedSession().language);
  const hindi = language === "hi";
  return <>
    <section className="hero">
      <div className="hero__inner">
        <div>
          <p className="page-eyebrow">SIH 2026 • Problem Statement 26097 • MoSJE</p>
          <h1>{hindi ? <>आपकी भाषा में,<br/><span>आपके हुनर की पहचान</span></> : <>Your skills. Your language.<br/><span>Your future.</span></>}</h1>
          <p>{hindi ? "JeevikaSetu एक voice-first prototype है जो बातचीत से आपके हुनर, रुचि और बाधाओं को समझकर skill और livelihood pathways सुझाता है।" : "JeevikaSetu is a voice-first prototype that understands informal skills, aspirations and constraints through a simple conversation, then suggests practical livelihood pathways."}</p>
          <div className="hero__actions">
            <Link href="/voice" className="btn btn-primary"><Mic size={20}/>{hindi ? "बात करें" : "Start voice conversation"}</Link>
            <Link href="/ivr" className="btn btn-saffron"><PhoneCall size={19}/>{hindi ? "Call करें" : "Simulate IVR call"}</Link>
            <Link href="/whatsapp" className="btn btn-secondary"><MessageCircle size={19}/>WhatsApp</Link>
          </div>
          <p className="live-badge" style={{ marginTop: 18 }}>Voice + text fallback • Hindi, English, Marathi, Tamil, Telugu, Bengali</p>
        </div>
        <div className="hero-visual" aria-hidden="true"><div className="voice-orb"><div className="voice-orb__inner"><div><b>☸</b><span>Jeevika<br/>Setu</span></div></div></div></div>
      </div>
    </section>
    <section className="trust-strip" aria-label="Key benefits">
      <div className="trust-item"><Volume2 size={23}/><div><b>Voice-first</b>Zero typing required</div></div>
      <div className="trust-item"><Sparkles size={23}/><div><b>Skill discovery</b>Values informal work</div></div>
      <div className="trust-item"><MapPinned size={23}/><div><b>Local pathways</b>Checks travel distance</div></div>
      <div className="trust-item"><ShieldCheck size={23}/><div><b>Human-centred</b>Consent and clear choices</div></div>
    </section>
    <section className="landing-section">
      <p className="page-eyebrow">Three ways to reach the last mile</p>
      <h2 className="page-title" style={{ fontSize: "clamp(28px, 3.2vw, 38px)" }}>One decision engine, accessible channels</h2>
      <div className="channel-grid">
        <article className="channel-card card"><div className="channel-icon"><Mic size={24}/></div><h3>Web voice conversation</h3><p>Speak naturally. Watch live subtitles, detected language and profile progress.</p><Link className="btn btn-primary" href="/voice">Try live voice</Link></article>
        <article className="channel-card card"><div className="channel-icon"><PhoneCall size={24}/></div><h3>Feature-phone IVR</h3><p>See a simple dial-pad journey for callers who cannot use a smartphone app.</p><Link className="btn btn-secondary" href="/ivr">Open IVR demo</Link></article>
        <article className="channel-card card"><div className="channel-icon"><MessageCircle size={24}/></div><h3>WhatsApp voice note</h3><p>Record a voice note and continue the same guided conversation in chat.</p><Link className="btn btn-secondary" href="/whatsapp">Open chat demo</Link></article>
      </div>
    </section>
    <section className="landing-section" style={{ paddingTop: 8 }}>
      <p className="page-eyebrow">From lived experience to a practical next step</p>
      <div className="feature-grid">
        <article className="feature-card card"><span className="feature-number">01</span><h3>Listen with empathy</h3><p>One gentle question at a time in the beneficiary&apos;s selected language.</p></article>
        <article className="feature-card card"><span className="feature-number">02</span><h3>Recognise informal skills</h3><p>Traditional work and daily experience are mapped to an illustrative NSQF-aligned catalogue.</p></article>
        <article className="feature-card card"><span className="feature-number">03</span><h3>Show a clear pathway</h3><p>Skill gaps, RPL screening, nearby training options and GIA referral prompts in one view.</p></article>
      </div>
      <div className="notice notice--blue" style={{ marginTop: 24 }}><b>Important:</b> This SIH prototype uses curated illustrative data. Qualification details, centre availability, opportunities and PM-AJAY GIA eligibility must be verified with authoritative sources before any referral or sanction.</div>
      <div style={{ marginTop: 20 }}><Link className="btn btn-secondary" href="/admin"><BarChart3 size={17}/> View demo official dashboard</Link></div>
    </section>
  </>;
}
