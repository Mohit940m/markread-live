import { TTSEngine, VoiceOption, SpeakOptions } from './types';
import { SpeechChunk } from '../utils/textChunker';

export const GOOGLE_BYOK_VOICES: VoiceOption[] = [
  {
    id: 'en-US-Neural2-F',
    name: 'Google Neural2 (Female - US)',
    lang: 'en-US',
    engine: 'google-cloud',
    tier: 4,
    quality: 'natural',
    gender: 'female',
    accent: 'US English',
  },
  {
    id: 'en-US-Neural2-D',
    name: 'Google Neural2 (Male - US)',
    lang: 'en-US',
    engine: 'google-cloud',
    tier: 4,
    quality: 'natural',
    gender: 'male',
    accent: 'US English',
  },
  {
    id: 'en-GB-Neural2-A',
    name: 'Google Neural2 (Female - UK)',
    lang: 'en-GB',
    engine: 'google-cloud',
    tier: 4,
    quality: 'natural',
    gender: 'female',
    accent: 'UK English',
  },
  {
    id: 'en-IN-Neural2-A',
    name: 'Google Neural2 (Female - India)',
    lang: 'en-IN',
    engine: 'google-cloud',
    tier: 4,
    quality: 'natural',
    gender: 'female',
    accent: 'Indian English',
  },
];

export class GoogleByokEngine implements TTSEngine {
  id = 'google-cloud' as const;
  name = 'Google Cloud TTS (BYOK)';
  isReady = false;

  private apiKey: string | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private currentBlobUrl: string | null = null;

  constructor(apiKey?: string | null) {
    this.apiKey = apiKey || null;
  }

  setApiKey(key: string | null): void {
    this.apiKey = key;
  }

  getApiKey(): string | null {
    return this.apiKey;
  }

  async init(): Promise<void> {
    this.isReady = Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async listVoices(): Promise<VoiceOption[]> {
    return GOOGLE_BYOK_VOICES;
  }

  async synthesizeChunkToBlob(text: string, voiceId: string): Promise<Blob> {
    if (!this.apiKey) {
      throw new Error('Google Cloud API Key is required.');
    }

    const endpoint = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(
      this.apiKey.trim()
    )}`;

    const voice = GOOGLE_BYOK_VOICES.find((v) => v.id === voiceId) || GOOGLE_BYOK_VOICES[0];

    const body = {
      input: { text },
      voice: {
        languageCode: voice.lang,
        name: voice.id,
      },
      audioConfig: {
        audioEncoding: 'LINEAR16', // Standard uncompressed WAV PCM
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(
        errorJson.error?.message || `Google Cloud TTS request failed with status ${response.status}`
      );
    }

    const data = await response.json();
    if (!data.audioContent) {
      throw new Error('No audio content received from Google Cloud TTS');
    }

    // Decode base64 audio
    const binary = atob(data.audioContent);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return new Blob([bytes], { type: 'audio/wav' });
  }

  async speakChunk(
    chunk: SpeechChunk,
    voice: VoiceOption,
    options: SpeakOptions
  ): Promise<void> {
    this.cleanupAudio();

    try {
      const blob = await this.synthesizeChunkToBlob(chunk.text, voice.id);
      const url = URL.createObjectURL(blob);
      this.currentBlobUrl = url;

      const audio = new Audio(url);
      this.currentAudio = audio;

      if (options.rate) {
        audio.playbackRate = options.rate;
      }

      audio.onplay = () => {
        options.onStart?.();
      };

      audio.onended = () => {
        this.cleanupAudio();
        options.onEnd?.();
      };

      audio.onerror = (e) => {
        this.cleanupAudio();
        options.onError?.(e);
      };

      await audio.play();
    } catch (err) {
      this.cleanupAudio();
      options.onError?.(err);
    }
  }

  pause(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
    }
  }

  resume(): void {
    if (this.currentAudio) {
      this.currentAudio.play().catch(console.warn);
    }
  }

  stop(): void {
    this.cleanupAudio();
  }

  private cleanupAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = '';
      this.currentAudio = null;
    }
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }
  }
}
