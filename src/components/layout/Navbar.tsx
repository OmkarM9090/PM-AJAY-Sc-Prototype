"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Accessibility, BarChart3, ChevronDown, Menu, Mic, PhoneCall, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/jeevika/Brand";
import { LANGUAGES } from "@/lib/languages";
import { readSavedSession, saveSavedSession, SavedSession } from "@/lib/session";

const links = [
  { href: "/voice", label: "Voice assistant", icon: Mic },
  { href: "/ivr", label: "IVR demo", icon: PhoneCall },
  { href: "/whatsapp", label: "WhatsApp demo", icon: PhoneCall },
  { href: "/admin", label: "Official view", icon: BarChart3 },
];

export default function Navbar() {
  const pathname = usePathname();
  const [settings, setSettings] = useState<SavedSession>({ language: "hi" });
  const [open, setOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  useEffect(() => {
    const load = () => setSettings(readSavedSession());
    load(); window.addEventListener("jeevika-session-change", load);
    return () => window.removeEventListener("jeevika-session-change", load);
  }, []);
  useEffect(() => {
    document.body.classList.toggle("large-text", Boolean(settings.largeText));
    document.body.classList.toggle("high-contrast", Boolean(settings.highContrast));
  }, [settings.largeText, settings.highContrast]);
  const change = (update: Partial<SavedSession>) => setSettings(saveSavedSession(update));
  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <>
      <div className="gov-ribbon"><span>भारत सरकार • Government of India</span><span>Inclusive livelihoods • Demo prototype</span></div>
      <header className="portal-header">
        <div className="portal-header__inner">
          <Brand />
          <nav className="desktop-nav" aria-label="Primary navigation">
            {links.map(({ href, label, icon: Icon }) => <Link className={isActive(href) ? "nav-link nav-link--active" : "nav-link"} href={href} key={href}><Icon size={16}/>{label}</Link>)}
          </nav>
          <div className="header-actions">
            <div className="language-select">
              <label htmlFor="language">Language</label>
              <select id="language" value={settings.language} onChange={(event) => change({ language: event.target.value as SavedSession["language"] })}>
                {LANGUAGES.map((language) => <option value={language.code} key={language.code}>{language.native} · {language.english}</option>)}
              </select>
              <ChevronDown size={14}/>
            </div>
            <button className="icon-button" aria-label="Accessibility options" aria-expanded={accessOpen} onClick={() => setAccessOpen(!accessOpen)}><Accessibility size={19}/></button>
            <button className="mobile-menu-button" aria-label="Open navigation" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
          </div>
        </div>
        {accessOpen && <div className="access-menu">
          <strong>Accessibility</strong>
          <label><input type="checkbox" checked={Boolean(settings.largeText)} onChange={(event) => change({ largeText: event.target.checked })}/> Larger text</label>
          <label><input type="checkbox" checked={Boolean(settings.highContrast)} onChange={(event) => change({ highContrast: event.target.checked })}/> High contrast</label>
          <p>Settings are saved on this device.</p>
        </div>}
        {open && <nav className="mobile-nav" aria-label="Mobile navigation">{links.map(({ href, label, icon: Icon }) => <Link onClick={() => setOpen(false)} className={isActive(href) ? "nav-link nav-link--active" : "nav-link"} href={href} key={href}><Icon size={17}/>{label}</Link>)}</nav>}
      </header>
    </>
  );
}
