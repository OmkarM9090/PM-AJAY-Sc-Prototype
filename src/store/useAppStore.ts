import { create } from 'zustand';
import { 
  Profile, 
  ConversationSession, 
  Opportunity, 
  Recommendation, 
  Notification,
  Roadmap,
  SkillMapping
} from '@/core/models/types';
import { RecommendationEngine } from '@/core/engine/RecommendationEngine';
import opportunitiesData from '@/data/seed/opportunities.json';

interface AppState {
  language: 'hi' | 'mr' | 'en';
  setLanguage: (lang: 'hi' | 'mr' | 'en') => void;

  currentSession: ConversationSession | null;
  startSession: (channel: 'web' | 'phone') => void;
  updateSessionStatus: (status: ConversationSession['status']) => void;
  addMessage: (text: string, speaker: 'user' | 'agent' | 'system') => void;
  
  profile: Profile;
  updateProfile: (updates: Partial<Profile>) => void;
  
  opportunities: Opportunity[];
  setOpportunities: (opps: Opportunity[]) => void;
  recommendations: Recommendation[];
  refreshRecommendations: () => void;
  
  skillMappings: SkillMapping[];
  setSkillMappings: (mappings: SkillMapping[]) => void;

  roadmap: Roadmap | null;
  setRoadmap: (roadmap: Roadmap) => void;

  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => void;
  markNotificationRead: (id: string) => void;

  resetState: () => void;
}

const initialProfile: Profile = {
  language: 'hi',
  skills: [],
  interests: [],
  constraints: [],
  consent: false
};

export const useAppStore = create<AppState>((set, get) => ({
  language: 'hi',
  setLanguage: (lang) => set({ language: lang }),

  currentSession: null,
  startSession: (channel) => set({
    currentSession: {
      sessionId: Math.random().toString(36).substring(7),
      channel,
      language: get().language,
      status: 'active',
      messages: [],
      profile: get().profile,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }),
  updateSessionStatus: (status) => set(state => ({
    currentSession: state.currentSession ? { ...state.currentSession, status, updatedAt: new Date() } : null
  })),
  addMessage: (text, speaker) => set(state => {
    if (!state.currentSession) return state;
    const newMessage = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      speaker,
      text
    };
    return {
      currentSession: {
        ...state.currentSession,
        messages: [...state.currentSession.messages, newMessage],
        updatedAt: new Date()
      }
    };
  }),

  profile: initialProfile,
  updateProfile: (updates) => {
    set((state) => {
      const newProfile = { ...state.profile, ...updates };
      return {
        profile: newProfile,
        currentSession: state.currentSession ? {
          ...state.currentSession,
          profile: newProfile,
          updatedAt: new Date()
        } : null
      };
    });
    get().refreshRecommendations();
  },

  opportunities: opportunitiesData as Opportunity[],
  setOpportunities: (opps) => {
    set({ opportunities: opps });
    get().refreshRecommendations();
  },
  
  recommendations: [],
  refreshRecommendations: () => {
    const { profile, opportunities } = get();
    if (profile.location && profile.radius) {
      const recs = RecommendationEngine.generateRecommendations(profile, opportunities);
      set({ recommendations: recs });
    }
  },

  skillMappings: [],
  setSkillMappings: (mappings) => set({ skillMappings: mappings }),

  roadmap: null,
  setRoadmap: (roadmap) => set({ roadmap }),

  notifications: [],
  addNotification: (notif) => set((state) => ({
    notifications: [{ 
      ...notif, 
      id: Math.random().toString(36).substring(7),
      read: false, 
      timestamp: new Date() 
    }, ...state.notifications]
  })),
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),

  resetState: () => set({
    profile: initialProfile,
    currentSession: null,
    recommendations: [],
    skillMappings: [],
    roadmap: null
  })
}));
