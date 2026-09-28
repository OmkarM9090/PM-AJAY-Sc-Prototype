export interface RecognitionResultItem { transcript: string; }
export interface RecognitionResultLike { isFinal: boolean; 0: RecognitionResultItem; }
export interface RecognitionEventLike { resultIndex: number; results: ArrayLike<RecognitionResultLike>; }
export interface RecognitionErrorEventLike { error: string; }
export interface RecognitionLike {
  lang: string; continuous: boolean; interimResults: boolean;
  onstart: (() => void) | null; onend: (() => void) | null;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: ((event: RecognitionErrorEventLike) => void) | null;
  start: () => void; stop: () => void; abort: () => void;
}
export type RecognitionConstructor = new () => RecognitionLike;
export function getRecognitionConstructor(): RecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const candidate = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return candidate.SpeechRecognition || candidate.webkitSpeechRecognition;
}
