import { VoiceOption, TTSEngine, SpeakOptions, VoiceQuality } from './types';
import { SpeechChunk } from '../utils/textChunker';

/**
 * Evaluates voice quality and priority based on browser naming patterns.
 * High priority: Edge "Natural" / "Online", Chrome "Google", Apple "Enhanced" / "Siri".
 * Low priority: Legacy desktop OS voices (Windows SAPI David/Zira, Linux eSpeak).
 */
export function classifyVoiceQuality(voice: SpeechSynthesisVoice): {
  quality: VoiceQuality;
  score: number;
} {
  const name = voice.name.toLowerCase();

  // Tier 1 Top Tier: Neural / Natural / Online Remote Voices
  if (
    name.includes('natural') ||
    name.includes('online (natural)') ||
    name.includes('neural')
  ) {
    return { quality: 'natural', score: 100 };
  }

  // Chrome Google Voices (Remote high quality neural synthesis)
  if (name.includes('google')) {
    return { quality: 'natural', score: 90 };
  }

  // Apple Siri / Enhanced
  if (name.includes('enhanced') || name.includes('siri') || name.includes('premium')) {
    return { quality: 'enhanced', score: 80 };
  }

  // Microsoft Desktop modern voices
  if (name.includes('microsoft') && !name.includes('david') && !name.includes('zira')) {
    return { quality: 'enhanced', score: 60 };
  }

  // Legacy or default OS voices (Windows David, Zira, Desktop, eSpeak)
  return { quality: 'standard', score: 20 };
}

/**
 * Transforms raw browser SpeechSynthesisVoice array into ranked VoiceOptions,
 * placing natural/online voices at the very top.
 */
export function rankBrowserVoices(voices: SpeechSynthesisVoice[]): VoiceOption[] {
  const optionsWithScores = voices.map((v) => {
    const { quality, score } = classifyVoiceQuality(v);

    let gender: 'male' | 'female' | 'neutral' = 'neutral';
    const lower = v.name.toLowerCase();
    if (lower.includes('female') || lower.includes('zira') || lower.includes('jenny') || lower.includes('aria')) {
      gender = 'female';
    } else if (lower.includes('male') || lower.includes('david') || lower.includes('guy') || lower.includes('george')) {
      gender = 'male';
    }

    const option: VoiceOption = {
      id: v.voiceURI,
      name: v.name,
      engine: 'browser',
      lang: v.lang,
      gender,
      tier: 1,
      quality,
      sampleText: 'MarkRead Live lets you read Markdown comfortably with natural voice playback.',
    };

    return { option, score, isDefault: v.default };
  });

  // Sort descending by score, default status, then locale
  optionsWithScores.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.isDefault && !a.isDefault) return -1;
    if (!b.isDefault && a.isDefault) return 1;
    return a.option.name.localeCompare(b.option.name);
  });

  return optionsWithScores.map((item) => item.option);
}

export class BrowserTTSEngine implements TTSEngine {
  id = 'browser' as const;
  name = 'Smart Browser Speech';
  isReady = true;

  async init(): Promise<void> {
    this.isReady = typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  async listVoices(): Promise<VoiceOption[]> {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];
    const raw = window.speechSynthesis.getVoices();
    return rankBrowserVoices(raw);
  }

  async speakChunk(
    chunk: SpeechChunk,
    voice: VoiceOption,
    options: SpeakOptions
  ): Promise<void> {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(chunk.text);

    if (options.rate !== undefined) utterance.rate = options.rate;
    if (options.pitch !== undefined) utterance.pitch = options.pitch;
    if (options.volume !== undefined) utterance.volume = options.volume;

    // Match browser voice object
    const rawVoices = window.speechSynthesis.getVoices();
    const match = rawVoices.find((v) => v.voiceURI === voice.id);
    if (match) {
      utterance.voice = match;
    }

    utterance.onstart = () => {
      options.onStart?.();
    };

    utterance.onend = () => {
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        options.onError?.(e);
      }
    };

    window.speechSynthesis.speak(utterance);
  }

  pause(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Android Chrome bug fix: cancel rather than pause, preserving chunk index in state
      window.speechSynthesis.cancel();
    }
  }

  resume(): void {
    // Resume is handled at player level by re-invoking speakChunk from currentChunkIndex
  }

  stop(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}
