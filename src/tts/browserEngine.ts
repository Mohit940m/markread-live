import { VoiceOption, TTSEngine, SpeakOptions, VoiceQuality } from './types';
import { SpeechChunk } from '../utils/textChunker';

/**
 * Evaluates voice quality and priority based on language, accent, gender, and browser naming patterns.
 * Priority hierarchy:
 * 1. UK English Male (Natural / Google / Online) - Score 1000 (Top default preference)
 * 2. UK English Other Natural (e.g. Google UK English Female) - Score 900
 * 3. US English Natural (e.g. Google US English, Edge Natural US) - Score 800
 * 4. Other English Natural (en-IN, en-AU, en-CA, etc.) - Score 700
 * 5. English Enhanced / Siri voices - Score 500
 * 6. English Standard OS voices - Score 300
 * 7. Non-English Natural/Google voices - Score 100
 * 8. Non-English Legacy/Standard voices - Score 20
 */
export function classifyVoiceQuality(voice: SpeechSynthesisVoice): {
  quality: VoiceQuality;
  score: number;
} {
  const name = voice.name.toLowerCase();
  const lang = (voice.lang || '').toLowerCase();

  const isEnglish = lang.startsWith('en') || name.includes('english');
  const isUK =
    lang.includes('en-gb') ||
    lang.includes('en_gb') ||
    name.includes('uk') ||
    name.includes('united kingdom') ||
    name.includes('british') ||
    name.includes('great britain');

  const isFemale =
    name.includes('female') ||
    name.includes('zira') ||
    name.includes('jenny') ||
    name.includes('aria') ||
    name.includes('sonia');

  const isMale =
    !isFemale &&
    (name.includes('male') ||
      name.includes('george') ||
      name.includes('ryan') ||
      name.includes('david') ||
      name.includes('guy') ||
      name.includes('oliver'));

  const isNatural =
    name.includes('natural') ||
    name.includes('online (natural)') ||
    name.includes('neural') ||
    name.includes('google');

  const isEnhanced =
    name.includes('enhanced') ||
    name.includes('siri') ||
    name.includes('premium') ||
    (name.includes('microsoft') && !name.includes('david') && !name.includes('zira'));

  let quality: VoiceQuality = 'standard';
  if (isNatural) {
    quality = 'natural';
  } else if (isEnhanced) {
    quality = 'enhanced';
  }

  let score = 20;

  // PRIORITY 1: English UK Male Natural (User's preferred default at top of list)
  if (isUK && isMale && isNatural) {
    score = 1000;
  }
  // PRIORITY 2: Other English UK Natural voices (e.g. Google UK English Female)
  else if (isUK && isNatural) {
    score = 900;
  }
  // PRIORITY 3: English US Natural voices (e.g. Google US English, Edge Natural US)
  else if (isEnglish && (lang.includes('en-us') || name.includes('us')) && isNatural) {
    score = 800;
  }
  // PRIORITY 4: Other English Natural voices (en-IN, en-AU, en-CA, etc.)
  else if (isEnglish && isNatural) {
    score = 700;
  }
  // PRIORITY 5: English Enhanced / Siri voices
  else if (isEnglish && isEnhanced) {
    score = 500;
  }
  // PRIORITY 6: English Standard voices
  else if (isEnglish) {
    score = 300;
  }
  // PRIORITY 7: Non-English Natural/Google voices
  else if (isNatural) {
    score = 100;
  }
  // PRIORITY 8: Non-English Standard voices
  else {
    score = 20;
  }

  return { quality, score };
}

/**
 * Transforms raw browser SpeechSynthesisVoice array into ranked VoiceOptions,
 * placing English UK Male and high-quality English natural voices at the very top.
 */
export function rankBrowserVoices(voices: SpeechSynthesisVoice[]): VoiceOption[] {
  const optionsWithScores = voices.map((v) => {
    const { quality, score } = classifyVoiceQuality(v);

    let gender: 'male' | 'female' | 'neutral' = 'neutral';
    const lower = v.name.toLowerCase();
    if (lower.includes('female') || lower.includes('zira') || lower.includes('jenny') || lower.includes('aria')) {
      gender = 'female';
    } else if (lower.includes('male') || lower.includes('david') || lower.includes('guy') || lower.includes('george') || lower.includes('ryan')) {
      gender = 'male';
    }

    let accent = 'English';
    const langLower = (v.lang || '').toLowerCase();
    if (langLower.includes('en-gb') || lower.includes('uk') || lower.includes('british')) {
      accent = 'UK English';
    } else if (langLower.includes('en-us') || lower.includes('us')) {
      accent = 'US English';
    } else if (langLower.includes('en-in') || lower.includes('india')) {
      accent = 'Indian English';
    } else if (langLower.includes('en-au') || lower.includes('australia')) {
      accent = 'Australian English';
    } else {
      accent = v.lang;
    }

    const option: VoiceOption = {
      id: v.voiceURI,
      name: v.name,
      engine: 'browser',
      lang: v.lang,
      accent,
      gender,
      tier: 1,
      quality,
      sampleText: 'MarkRead Live lets you read Markdown comfortably with natural voice playback.',
    };

    return { option, score, isDefault: v.default };
  });

  // Sort descending by score, then default status, then alphabetically by name
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
  private utteranceToken = 0;

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

    const token = ++this.utteranceToken;

    // Cancel any active utterance before starting
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(chunk.text);

    // Match browser voice instance by URI or name
    const rawVoices = window.speechSynthesis.getVoices();
    const matchedVoice = rawVoices.find(
      (v) => v.voiceURI === voice.id || v.name === voice.name
    );
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    if (options.rate) {
      utterance.rate = Math.max(0.75, Math.min(2.0, options.rate));
    }

    utterance.onstart = () => {
      if (this.utteranceToken !== token) return;
      options.onStart?.();
    };

    utterance.onend = () => {
      if (this.utteranceToken !== token) return;
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      if (this.utteranceToken !== token) return;
      if (e.error === 'canceled' || e.error === 'interrupted') {
        return;
      }
      options.onError?.(e);
    };

    window.speechSynthesis.speak(utterance);
  }

  pause(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
  }

  resume(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
  }

  stop(): void {
    this.utteranceToken++;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}
