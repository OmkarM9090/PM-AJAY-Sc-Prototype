import { Profile } from '../models/types';
import { extractProfileSlots } from './extractor';

export class ConversationEngine {
  
  public static async processUserInput(text: string, currentProfile: Profile, sessionId: string): Promise<{
    agentResponse: string;
    profileUpdates: Partial<Profile>;
  }> {
    
    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          text: text
        })
      });

      if (!response.ok) {
        throw new Error("Backend API failed");
      }

      const data = await response.json();
      
      // Note: Actual profile updates are now received via SSE (Server-Sent Events) in the backend.
      // We return empty profileUpdates here so Zustand doesn't overwrite.
      return {
        agentResponse: data.text,
        profileUpdates: {}
      };
    } catch (e) {
      console.error(e);
      return {
        agentResponse: "Mujhe connection me samasya ho rahi hai. Kripya baad me prayas karein.",
        profileUpdates: {}
      };
    }
  }

  public static getInitialGreeting(language: string = 'hi'): string {
    if (language === 'mr') {
      return "Namaste, main Livelihood Mitra hoon. Mi tumhala tumchya hunaranusar ani aavdinusar yogya kaam kiva training shodhnyas madat karen. Tumhi kiti shikla ahat?";
    } else if (language === 'en') {
      return "Hello, I am Livelihood Mitra. I will help you find the right work or training based on your skills. Could you tell me about your education?";
    } else {
      return "Namaste, main Livelihood Mitra hoon. Main aapke hunar aur aapke liye sahi kaam ya training dhoondhne mein madad karunga. Aapki padhai kahan tak hui hai?";
    }
  }
}

