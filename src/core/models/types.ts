export interface SourceMetadata {
  source: string;
  sourceUrl?: string;
  sourceVersion?: string;
  retrievedAt?: string;
  verificationStatus?: 'verified' | 'unverified' | 'demo';
}

export interface Location {
  locationName: string;
  pincode?: string;
  lat: number;
  lng: number;
  resolutionSource?: 'browser' | 'pincode' | 'geocoder' | 'demo';
}

export interface Profile {
  identity?: {
    name?: string;
    age?: number;
    gender?: string;
  };
  language: 'hi' | 'mr' | 'en' | string;
  location?: Location;
  education?: string;
  currentLivelihood?: string;
  experience?: string;
  skills: string[];
  interests: string[];
  workPreference?: string;
  employmentPreference?: 'job' | 'self-employment' | 'training' | string;
  mobility?: string; // e.g. "5km"
  radius?: number; // actual km
  transport?: string;
  constraints: string[];
  schedule?: string;
  trainingPreference?: string;
  enterpriseInterest?: string;
  consent: boolean;
}

export interface ConversationMessage {
  id: string;
  timestamp: Date;
  speaker: 'user' | 'agent' | 'system';
  text: string;
  extractedSlots?: Partial<Profile>;
}

export interface ConversationSession {
  sessionId: string;
  channel: 'web' | 'phone';
  language: string;
  status: 'active' | 'completed' | 'failed' | 'paused';
  messages: ConversationMessage[];
  profile: Profile;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Skill {
  originalUserPhrase: string;
  normalizedSkill: string;
  confidence: number;
  evidence: string;
  source: string; // 'conversation' | 'manual'
}

export interface SkillMapping {
  skill: Skill;
  occupationalPathway?: string;
  qpNosCode?: string;
  nsqfLevel?: number;
  rplRelevant: boolean;
  mappingStatus: 'Mapped' | 'Related' | 'No direct mapping' | 'Needs verification';
  sourceMetadata: SourceMetadata;
}

export interface SkillGap {
  targetOccupation: string;
  alreadyKnow: string[];
  needToLearn: string[];
  canImprove: string[];
}

export interface Opportunity {
  id: string;
  title: string;
  type: 'training' | 'job' | 'self-employment';
  description: string;
  provider: string;
  location: string;
  lat: number;
  lng: number;
  requiredSkills: string[];
  preferredSkills: string[];
  educationRequirements?: string;
  experienceRequirements?: string;
  nsqfLevel?: number;
  rplRelevant?: boolean;
  duration?: string;
  schedule?: string;
  fees?: string;
  supportInfo?: string; // Financial support, schemes
  employmentType?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  website?: string;
  sourceMetadata: SourceMetadata;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Recommendation {
  opportunity: Opportunity;
  distance: number;
  scoreComponents: {
    skillFit: number;
    goalFit: number;
    distanceFit: number;
    total: number;
  };
  whyThisMatch: {
    reasons: string[];
    alreadyKnow: string[];
    mayNeed: string[];
    nextStep: string;
  };
  skillGap?: SkillGap;
}

export interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed';
  type: 'profile' | 'skill_id' | 'training' | 'assessment' | 'connection' | 'launch';
}

export interface Roadmap {
  id: string;
  steps: RoadmapStep[];
}

export interface Notification {
  id: string;
  timestamp: Date;
  type: 'profile' | 'recommendation' | 'gap' | 'roadmap' | 'call' | 'system';
  title: string;
  message: string;
  read: boolean;
  actionRoute?: string;
}

export interface SavedOpportunity {
  id: string;
  opportunityId: string;
  savedAt: Date;
  notes?: string;
}
