/** Global app state: language, accessibility, demo mode, session, profile, recs. */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../utils/apiClient'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [language, setLanguage] = useState('hi')
  const [demoMode, setDemoMode] = useState(false)
  const [largeText, setLargeText] = useState(false)
  const [highContrast, setHighContrast] = useState(false)
  const [session, setSession] = useState(null)      // { id, channel }
  const [transcript, setTranscript] = useState([])  // [{speaker, text, lang}]
  const [profile, setProfile] = useState(null)
  const [recommendations, setRecommendations] = useState(null)
  const [health, setHealth] = useState(null)

  useEffect(() => {
    api.health().then(setHealth).catch(() => setHealth({ status: 'offline', ai_mode: 'unreachable' }))
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('large-text', largeText)
    document.documentElement.classList.toggle('high-contrast', highContrast)
  }, [largeText, highContrast])

  const reset = useCallback(() => {
    setSession(null)
    setTranscript([])
    setProfile(null)
    setRecommendations(null)
  }, [])

  const value = useMemo(
    () => ({
      language, setLanguage,
      demoMode, setDemoMode,
      largeText, setLargeText,
      highContrast, setHighContrast,
      session, setSession,
      transcript, setTranscript,
      profile, setProfile,
      recommendations, setRecommendations,
      health, reset,
    }),
    [language, demoMode, largeText, highContrast, session, transcript, profile, recommendations, health, reset],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}

export default AppContext
