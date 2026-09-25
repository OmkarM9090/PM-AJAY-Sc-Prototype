import { VoiceAdapter } from './voiceAdapter';

export class BrowserVoiceAdapter implements VoiceAdapter {
  private recognition: any = null;
  private synthesis: SpeechSynthesis = window.speechSynthesis;
  private isListening: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
      } else {
        console.warn("SpeechRecognition not supported in this browser.");
      }
    }
  }

  startListening(onResult: (text: string, isFinal: boolean) => void, onError: (error: Error) => void): void {
    if (!this.recognition) {
      onError(new Error("Speech recognition not supported."));
      return;
    }
    
    if (this.isListening) return;

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        onResult(finalTranscript, true);
      } else if (interimTranscript) {
        onResult(interimTranscript, false);
      }
    };

    this.recognition.onerror = (event: any) => {
      // Ignore no-speech errors for continuous listening
      if (event.error !== 'no-speech') {
        onError(new Error(event.error));
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      // Could automatically restart here if we wanted true continuous without stop
    };

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (e) {
      console.error(e);
      onError(e as Error);
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  speak(text: string, language: string, onEnd?: () => void): void {
    if (!this.synthesis) return;
    
    this.stopSpeaking(); // Stop anything currently speaking

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Map our lang codes to BCP 47
    let langCode = 'hi-IN'; // default
    if (language === 'mr') langCode = 'mr-IN';
    if (language === 'en') langCode = 'en-IN';
    
    utterance.lang = langCode;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    if (onEnd) {
      utterance.onend = onEnd;
    }

    this.synthesis.speak(utterance);
  }

  stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }
}
