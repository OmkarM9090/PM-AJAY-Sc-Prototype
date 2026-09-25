import { Profile } from '../models/types';
import { extractProfileSlots } from './extractor';

export class ConversationEngine {
  
  public static async processUserInput(text: string, currentProfile: Profile): Promise<{
    agentResponse: string;
    profileUpdates: Partial<Profile>;
  }> {
    
    // 1. Extract slots
    const profileUpdates = await extractProfileSlots(text, currentProfile);
    const updatedProfile = { ...currentProfile, ...profileUpdates };

    // 2. Determine what's missing and generate next response
    let agentResponse = this.generateNextQuestion(updatedProfile, text);

    return {
      agentResponse,
      profileUpdates
    };
  }

  private static generateNextQuestion(p: Profile, lastInput: string): string {
    const isMarathi = p.language === 'mr' || lastInput.toLowerCase().includes('marathi');
    const isHindi = p.language === 'hi' || lastInput.toLowerCase().includes('hindi');
    
    // Helper to pick language string
    const say = (en: string, hi: string, mr: string) => {
      if (isMarathi) return mr;
      if (isHindi) return hi;
      return en;
    };

    // If language was just switched
    if (lastInput.toLowerCase().includes('marathi')) {
      return say('', '', "Chalel, ata apan Marathi madhye boluya. Tumhi kiti shikla ahat?");
    }
    if (lastInput.toLowerCase().includes('hindi')) {
      return say('', "Theek hai, ab hum Hindi mein baat karenge. Aapki padhai kahan tak hui hai?", '');
    }

    // Goal/Intent checks
    if (!p.education) {
      return say(
        "Could you tell me about your educational background?",
        "Aapki padhai kahan tak hui hai?",
        "Tumhi kiti shikla ahat?"
      );
    }

    if (!p.skills || p.skills.length === 0) {
      return say(
        "What kind of work do you have experience in?",
        "Aapko kis kaam ka anubhav hai?",
        "Tumhala kontya kamacha anubhav aahe?"
      );
    }

    if (!p.employmentPreference) {
      return say(
        "Are you looking for a job, to start your own business, or for training?",
        "Aapko naukri chahiye, apna kaam shuru karna hai, ya training leni hai?",
        "Tumhala nokri pahije aahe ki swatahcha vyavsay suru karaycha aahe?"
      );
    }

    if (!p.radius) {
      return say(
        "How far are you willing to travel for work or training?",
        "Aap kaam ya training ke liye kitni door tak ja sakte hain?",
        "Tumhala kaam kiti door paryant chalel?"
      );
    }

    // Profile confirmation step
    if (p.education && p.skills?.length > 0 && p.employmentPreference && p.radius && !p.consent) {
        return say(
            `Okay, I understand. You have studied till ${p.education}, know ${p.skills.join(', ')}, want ${p.employmentPreference} within ${p.radius} km. Should I search for opportunities for you?`,
            `Theek hai, maine samjha. Aapki padhai ${p.education} hui hai, aapko ${p.skills.join(', ')} ka anubhav hai, aap ${p.radius} km ke andar ${p.employmentPreference} dhundh rahe hain. Kya main aapke liye mauke dhundu?`,
            `Barobar. Tumhi ${p.education} shikla ahat, tumhala ${p.skills.join(', ')} ye kaam yete, ani tumhala ${p.radius} km chya aat ${p.employmentPreference} pahije. Mi tumchya sathi sandhi shodhu ka?`
        );
    }

    // Default conversational fallback
    return say(
      "I am checking the best opportunities based on what you told me.",
      "Main aapke bataye anusar sabse behtar mauke dhundh raha hoon.",
      "Tumhi dilelya mahitinusar mi tumchya sathi uttam sandhi shodhata ahe."
    );
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
