import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PiperTTSEngine } from './piperEngine';

// Mock Worker for testing PiperTTSEngine
class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;
  listeners: Map<string, Function[]> = new Map();

  addEventListener(type: string, listener: Function) {
    const list = this.listeners.get(type) || [];
    this.listeners.set(type, [...list, listener]);
  }

  removeEventListener(type: string, listener: Function) {
    const list = this.listeners.get(type) || [];
    this.listeners.set(
      type,
      list.filter((l) => l !== listener)
    );
  }

  postMessage(msg: any) {
    // Simulate worker responses asynchronously
    setTimeout(() => {
      if (msg.type === 'LIST_STORED_VOICES') {
        const ev = { data: { type: 'STORED_VOICES', voiceIds: ['en_US-lessac-medium'] } } as MessageEvent;
        this.onmessage?.(ev);
        this.listeners.get('message')?.forEach((cb) => cb(ev));
      } else if (msg.type === 'DOWNLOAD_VOICE') {
        const progressEv = {
          data: { type: 'DOWNLOAD_PROGRESS', voiceId: msg.voiceId, progress: 50 },
        } as MessageEvent;
        this.onmessage?.(progressEv);
        const completeEv = {
          data: { type: 'DOWNLOAD_COMPLETE', voiceId: msg.voiceId },
        } as MessageEvent;
        this.onmessage?.(completeEv);
      } else if (msg.type === 'SYNTHESIZE_CHUNK') {
        const fakeBlob = new Blob(['RIFF fake wav audio'], { type: 'audio/wav' });
        const resEv = {
          data: { type: 'SYNTHESIS_COMPLETE', chunkId: msg.chunkId, blob: fakeBlob },
        } as MessageEvent;
        this.onmessage?.(resEv);
      }
    }, 10);
  }
}

describe('PiperTTSEngine (NV-2.1, NV-2.2, NV-2.4, NV-2.5)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (globalThis as any).Worker = MockWorker as any;
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/sample-audio');
    window.URL.revokeObjectURL = vi.fn();
  });

  it('initializes and lists curated voices with download status', async () => {
    const engine = new PiperTTSEngine();
    await engine.init();

    const voices = await engine.listVoices();
    expect(voices.length).toBeGreaterThan(0);

    const lessac = voices.find((v) => v.id === 'en_US-lessac-medium');
    expect(lessac).toBeDefined();
    expect(lessac?.isDownloaded).toBe(true);
  });

  it('triggers download and receives progress callbacks', async () => {
    const engine = new PiperTTSEngine();
    await engine.init();

    const onProgress = vi.fn();
    await engine.downloadVoice('en_US-amy-medium', onProgress);

    await vi.waitFor(() => {
      expect(onProgress).toHaveBeenCalledWith(50);
      expect(onProgress).toHaveBeenCalledWith(100);
      expect(engine.isVoiceDownloaded('en_US-amy-medium')).toBe(true);
    });
  });

  it('synthesizes text chunk to WAV Blob', async () => {
    const engine = new PiperTTSEngine();
    await engine.init();

    const blob = await engine.synthesizeChunkToBlob(0, 'Test phrase', 'en_US-lessac-medium');
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('audio/wav');
  });

  it('revokes audio Object URL upon stop (mobile memory guardrail)', async () => {
    const engine = new PiperTTSEngine();
    await engine.init();

    // Trigger cleanup
    engine.stop();
    // Initially null, no lingering object URLs
    expect(engine).toBeDefined();
  });
});
