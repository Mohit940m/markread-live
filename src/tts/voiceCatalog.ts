import { VoiceOption } from './types';

export interface PiperVoiceMetadata extends VoiceOption {
  modelId: string;
  accent: string;
  gender: 'male' | 'female' | 'neutral';
  downloadSizeMB: number;
  sampleText: string;
  isLightweight?: boolean;
}

/**
 * Curated list of high-quality Piper neural voices (VITS models).
 * Balances natural speech quality, lightweight download sizes (15–63 MB),
 * and reliable ONNX/WASM browser execution.
 */
export const CURATED_PIPER_VOICES: PiperVoiceMetadata[] = [
  {
    id: 'en_US-lessac-medium',
    modelId: 'en_US-lessac-medium',
    name: 'Lessac (US English - High Fidelity)',
    engine: 'piper',
    lang: 'en-US',
    accent: 'US English',
    gender: 'female',
    tier: 2,
    quality: 'natural',
    downloadSizeMB: 63,
    sampleText: 'MarkRead Live uses local neural models to narrate your markdown naturally.',
  },
  {
    id: 'en_US-amy-medium',
    modelId: 'en_US-amy-medium',
    name: 'Amy (US English - Warm & Natural)',
    engine: 'piper',
    lang: 'en-US',
    accent: 'US English',
    gender: 'female',
    tier: 2,
    quality: 'natural',
    downloadSizeMB: 60,
    sampleText: 'Welcome to offline natural speech with zero external server tracking.',
  },
  {
    id: 'en_US-ryan-medium',
    modelId: 'en_US-ryan-medium',
    name: 'Ryan (US English - Clear Male)',
    engine: 'piper',
    lang: 'en-US',
    accent: 'US English',
    gender: 'male',
    tier: 2,
    quality: 'natural',
    downloadSizeMB: 60,
    sampleText: 'Enjoy distraction-free reading with smooth voice playback.',
  },
  {
    id: 'en_GB-alba-medium',
    modelId: 'en_GB-alba-medium',
    name: 'Alba (British English - Natural Female)',
    engine: 'piper',
    lang: 'en-GB',
    accent: 'British',
    gender: 'female',
    tier: 2,
    quality: 'natural',
    downloadSizeMB: 60,
    sampleText: 'Listen to articles and documentation hands-free anywhere on your device.',
  },
  {
    id: 'en_GB-alan-medium',
    modelId: 'en_GB-alan-medium',
    name: 'Alan (British English - Articulate Male)',
    engine: 'piper',
    lang: 'en-GB',
    accent: 'British',
    gender: 'male',
    tier: 2,
    quality: 'natural',
    downloadSizeMB: 60,
    sampleText: 'A lightweight and private way to experience Markdown documents.',
  },
  {
    id: 'en_US-kathleen-low',
    modelId: 'en_US-kathleen-low',
    name: 'Kathleen (US English - Mobile Lightweight)',
    engine: 'piper',
    lang: 'en-US',
    accent: 'US English',
    gender: 'female',
    tier: 2,
    quality: 'natural',
    downloadSizeMB: 15,
    isLightweight: true,
    sampleText: 'Fast download optimized for mobile devices and low-bandwidth connections.',
  },
  {
    id: 'en_US-danny-low',
    modelId: 'en_US-danny-low',
    name: 'Danny (US English - Mobile Lightweight)',
    engine: 'piper',
    lang: 'en-US',
    accent: 'US English',
    gender: 'male',
    tier: 2,
    quality: 'natural',
    downloadSizeMB: 15,
    isLightweight: true,
    sampleText: 'Lightweight neural model with fast synthesis and minimal memory footprint.',
  },
];

export function getCuratedPiperVoices(): PiperVoiceMetadata[] {
  return [...CURATED_PIPER_VOICES];
}

export function findPiperVoice(id: string): PiperVoiceMetadata | undefined {
  return CURATED_PIPER_VOICES.find((v) => v.id === id || v.modelId === id);
}
