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

  it('ranks English UK Male at the top of the list above other English and non-English voices', () => {
    const voices = [
      createMockVoice('Google português do Brasil', 'google-pt', 'pt-BR'),
      createMockVoice('Google US English', 'google-us', 'en-US'),
      createMockVoice('Google UK English Female', 'google-uk-f', 'en-GB'),
      createMockVoice('Google UK English Male', 'google-uk-m', 'en-GB'),
      createMockVoice('Microsoft David Desktop', 'david', 'en-US'),
    ];

    const ranked = rankBrowserVoices(voices);

    // Google UK English Male must be at the very top (Rank #1)
    expect(ranked[0].name).toBe('Google UK English Male');
    expect(ranked[0].gender).toBe('male');
    expect(ranked[0].accent).toBe('UK English');
    expect(ranked[0].quality).toBe('natural');

    // Google UK English Female next
    expect(ranked[1].name).toBe('Google UK English Female');

    // Google US English next
    expect(ranked[2].name).toBe('Google US English');

    // Non-English Google Portuguese is pushed below all English voices
    expect(ranked[3].name).toBe('Microsoft David Desktop');
    expect(ranked[4].name).toBe('Google português do Brasil');
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

  it('ignores stale onend events from cancelled or superseded utterances (Issue 8)', async () => {
    const engine = new BrowserTTSEngine();
    const spokenUtterances: SpeechSynthesisUtterance[] = [];
    vi.spyOn(window.speechSynthesis, 'speak').mockImplementation((u) => {
      spokenUtterances.push(u);
      u.onstart?.({} as SpeechSynthesisEvent);
    });

    const mockVoice: VoiceOption = {
      id: 'Google UK English Male',
      name: 'Google UK English Male',
      engine: 'browser',
      lang: 'en-GB',
      tier: 1,
      quality: 'natural',
    };

    const onEndFirst = vi.fn();
    const onEndSecond = vi.fn();

    await engine.speakChunk({ index: 0, text: 'First utterance' }, mockVoice, { onEnd: onEndFirst });
    await engine.speakChunk({ index: 1, text: 'Second utterance' }, mockVoice, { onEnd: onEndSecond });

    // Simulate delayed onend firing for cancelled first utterance
    spokenUtterances[0].onend?.({} as SpeechSynthesisEvent);
    expect(onEndFirst).not.toHaveBeenCalled();

    // Active second utterance completes normally (even after pause + resume)
    engine.pause();
    engine.resume();
    spokenUtterances[1].onend?.({} as SpeechSynthesisEvent);
    expect(onEndSecond).toHaveBeenCalledTimes(1);
  });
});
