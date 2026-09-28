/**
 * JeevikaSetu — SIH 2026 (PS 26097) prototype shell.
 * Routing + global layout. State lives in <AppProvider>.
 */

import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import DemoRecorder from './components/DemoRecorder'
import { AppProvider } from './store/AppContext'
import LandingPage from './pages/LandingPage'
import VoiceConversationPage from './pages/VoiceConversationPage'
import ProfilePage from './pages/ProfilePage'
import RecommendationsPage from './pages/RecommendationsPage'
import IVRPage from './pages/IVRPage'
import WhatsAppPage from './pages/WhatsAppPage'
import DashboardPage from './pages/DashboardPage'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="flex min-h-full flex-col">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/voice" element={<VoiceConversationPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/recommendations" element={<RecommendationsPage />} />
              <Route path="/ivr" element={<IVRPage />} />
              <Route path="/whatsapp" element={<WhatsAppPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="*" element={<LandingPage />} />
            </Routes>
          </main>
          <Footer />
          <DemoRecorder />
        </div>
      </BrowserRouter>
    </AppProvider>
  )
}
