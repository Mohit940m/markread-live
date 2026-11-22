import { SpeechChunk } from '../utils/textChunker';

export type VoiceEngineId = 'browser' | 'piper' | 'kokoro' | 'google-cloud';

export type VoiceTier = 1 | 2 | 3 | 4;

export type VoiceQuality = 'natural' | 'enhanced' | 'standard';

export interface VoiceOption {
  id: string; // voiceURI or model id
  name: string;
  engine: VoiceEngineId;
  lang: string;
  accent?: string;
  gender?: 'male' | 'female' | 'neutral';
  tier: VoiceTier;
  quality: VoiceQuality;
  isDownloaded?: boolean;
  downloadSizeMB?: number;
  sampleText?: string;
}

export type PlayerStatus = 'idle' | 'playing' | 'paused' | 'buffering';

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
  onProgress?: (progress: number) => void;
}

export interface TTSEngine {
  id: VoiceEngineId;
  name: string;
  isReady: boolean;
  init(): Promise<void>;
  listVoices(): Promise<VoiceOption[]>;
  speakChunk(chunk: SpeechChunk, voice: VoiceOption, options: SpeakOptions): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
}
