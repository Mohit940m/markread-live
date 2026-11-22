import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleByokEngine, GOOGLE_BYOK_VOICES } from './googleByokEngine';

describe('GoogleByokEngine (NV-5.2 BYOK Zero Backend)', () => {
  let engine: GoogleByokEngine;

  beforeEach(() => {
    vi.restoreAllMocks();
    engine = new GoogleByokEngine();
  });

  it('initializes with unready state when no API key provided', async () => {
    await engine.init();
    expect(engine.isReady).toBe(false);
  });

  it('initializes with ready state when API key is provided', async () => {
    engine.setApiKey('AIzaSyMockKey');
    await engine.init();
    expect(engine.isReady).toBe(true);
    expect(engine.getApiKey()).toBe('AIzaSyMockKey');
  });

  it('lists curated Google Neural2 voices', async () => {
    const voices = await engine.listVoices();
    expect(voices.length).toBeGreaterThan(0);
    expect(voices[0].engine).toBe('google-cloud');
    expect(voices[0].quality).toBe('natural');
  });

  it('synthesizes text to wav blob using Google Cloud REST API', async () => {
    engine.setApiKey('AIzaSyMockKey');

    // Mock fetch
    const mockBase64 = btoa('RIFF....WAVEfmt ....data....');
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        audioContent: mockBase64,
      }),
    } as any);

    const blob = await engine.synthesizeChunkToBlob('Hello world', GOOGLE_BYOK_VOICES[0].id);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('audio/wav');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://texttospeech.googleapis.com/v1/text:synthesize?key=AIzaSyMockKey'),
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('handles Google Cloud API errors cleanly', async () => {
    engine.setApiKey('invalid-key');
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: { message: 'API key not valid' },
      }),
    } as any);

    await expect(
      engine.synthesizeChunkToBlob('Hello world', GOOGLE_BYOK_VOICES[0].id)
    ).rejects.toThrow('API key not valid');
  });
});
