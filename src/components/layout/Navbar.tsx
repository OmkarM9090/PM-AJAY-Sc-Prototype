"use client";

import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { translations, Language } from '@/lib/translations';
import { Bell, User, Mic, History, HelpCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { language, setLanguage, notifications } = useAppStore();
  const pathname = usePathname();
  const t = (key: keyof typeof translations['en']) => translations[language][key as any] || key;

  const unreadCount = notifications.filter(n => !n.read).length;

  if (pathname === '/' || pathname === '/consent') {
    return (
      <header className="absolute top-0 w-full p-6 flex justify-between items-center z-10">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <Mic className="w-6 h-6" /> Livelihood Mitra
        </Link>
        <select 
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="bg-white/80 backdrop-blur border-2 border-gray-200 rounded-xl px-4 py-2 font-medium text-gray-700 outline-none focus:border-primary"
        >
          <option value="mr">मराठी</option>
          <option value="hi">हिंदी</option>
          <option value="en">English</option>
        </select>
      </header>
    );
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
              <Mic className="w-6 h-6" />
              <span className="hidden sm:block">Livelihood Mitra</span>
            </Link>

            <nav className="hidden lg:flex space-x-1">
              <Link href="/voice" className={`px-3 py-2 rounded-md text-sm font-medium ${pathname === '/voice' ? 'bg-primary/5 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}>
                Voice Assistant
              </Link>
              <Link href="/profile" className={`px-3 py-2 rounded-md text-sm font-medium ${pathname === '/profile' ? 'bg-primary/5 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}>
                My Profile
              </Link>
              <Link href="/skills" className={`px-3 py-2 rounded-md text-sm font-medium ${pathname === '/skills' ? 'bg-primary/5 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}>
                Skills
              </Link>
              <Link href="/recommendations" className={`px-3 py-2 rounded-md text-sm font-medium ${pathname.includes('/recommendations') ? 'bg-primary/5 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}>
                Opportunities
              </Link>
              <Link href="/roadmap" className={`px-3 py-2 rounded-md text-sm font-medium ${pathname === '/roadmap' ? 'bg-primary/5 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}>
                Roadmap
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            
            <Link href="/judge" className="hidden lg:flex px-3 py-1.5 text-xs font-bold bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 uppercase tracking-wide border border-amber-200">
              {t('nav_judge' as any) || 'Judge Mode'}
            </Link>

            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 outline-none focus:border-primary hidden sm:block"
            >
              <option value="mr">मराठी</option>
              <option value="hi">हिंदी</option>
              <option value="en">English</option>
            </select>

            <Link href="/sessions" className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full" title="Recent Sessions">
              <History className="w-5 h-5" />
            </Link>

            <button className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full" title="Help">
              <HelpCircle className="w-5 h-5" />
            </button>

            <Link href="/notifications" className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full" title="Notifications">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </Link>

            <button className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
              <User className="w-5 h-5" />
            </button>
          </div>
          
        </div>
      </div>
    </header>
  );
}
