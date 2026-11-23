import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  classifyVoiceQuality,
  rankBrowserVoices,
  BrowserTTSEngine,
} from './browserEngine';
import { VoiceOption } from './types';

describe('Smart Browser Voice Ranking & Engine (NV-1.1 & NV-1.2)', () => {
  const createMockVoice = (
    name: string,
    voiceURI: string,
    lang = 'en-US',
    isDefault = false
  ): SpeechSynthesisVoice => ({
    name,
    voiceURI,
    lang,
    default: isDefault,
    localService: true,
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('classifies Microsoft Online (Natural) and Google voices as natural quality', () => {
    const naturalVoice = createMockVoice('Microsoft Christopher Online (Natural) - English', 'chris-nat');
    const googleVoice = createMockVoice('Google US English', 'google-us');
    const legacyVoice = createMockVoice('Microsoft David Desktop - English (United States)', 'david');

    expect(classifyVoiceQuality(naturalVoice).quality).toBe('natural');
    expect(classifyVoiceQuality(googleVoice).quality).toBe('natural');
    expect(classifyVoiceQuality(legacyVoice).quality).toBe('standard');
  });

  it('ranks natural and Google voices above legacy OS synthesizers in list', () => {
    const voices = [
      createMockVoice('Microsoft David Desktop', 'david'),
      createMockVoice('Microsoft Jenny Online (Natural)', 'jenny-nat'),
      createMockVoice('Google US English', 'google-us'),
      createMockVoice('eSpeak English', 'espeak'),
    ];

    const ranked = rankBrowserVoices(voices);

    expect(ranked[0].name).toContain('Natural');
    expect(ranked[1].name).toContain('Google');
    expect(ranked[0].quality).toBe('natural');
    expect(ranked[1].quality).toBe('natural');
    expect(ranked[2].quality).toBe('standard');
    expect(ranked[3].quality).toBe('standard');
  });

  it('BrowserTTSEngine initializes and lists ranked voices', async () => {
    const engine = new BrowserTTSEngine();
    await engine.init();
    expect(engine.isReady).toBe(true);

    const voices = await engine.listVoices();
    expect(Array.isArray(voices)).toBe(true);
    expect(voices.length).toBeGreaterThan(0);
  });

  it('BrowserTTSEngine speaks chunks and handles cancel/stop', async () => {
    const engine = new BrowserTTSEngine();
    const onStart = vi.fn();
    const onEnd = vi.fn();

    const mockVoice: VoiceOption = {
      id: 'Google US English',
      name: 'Google US English',
      engine: 'browser',
      lang: 'en-US',
      tier: 1,
      quality: 'natural',
    };

    await engine.speakChunk(
      { index: 0, text: 'Hello world' },
      mockVoice,
      { onStart, onEnd }
    );

    expect(window.speechSynthesis.speak).toHaveBeenCalled();

    engine.stop();
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
  });
});
