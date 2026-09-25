export interface VoiceAdapter {
  startListening(onResult: (text: string, isFinal: boolean) => void, onError: (error: Error) => void): void;
  stopListening(): void;
  speak(text: string, language: string, onEnd?: () => void): void;
  stopSpeaking(): void;
}
