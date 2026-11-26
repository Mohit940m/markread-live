import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useVoicePlayer } from './useVoicePlayer';
import { SpeechChunk } from '../utils/textChunker';
import { TTSEngine } from '../tts/types';

describe('useVoicePlayer Unified Hook (NV-1.3)', () => {
  const sampleChunks: SpeechChunk[] = [
    { index: 0, text: 'First chunk.', blockIndex: 0 },
    { index: 1, text: 'Second chunk.', blockIndex: 1 },
  ];

  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('initializes with default browser engine and ranks natural voices', async () => {
    let hookResult: any;
    await act(async () => {
      hookResult = renderHook(() => useVoicePlayer({ chunks: sampleChunks }));
    });

    await vi.waitFor(() => {
      expect(hookResult.result.current.voices.length).toBeGreaterThan(0);
      expect(hookResult.result.current.selectedEngineId).toBe('browser');
    });

    expect(hookResult.result.current.status).toBe('idle');
  });

  it('plays, pauses, and resumes using the unified interface', async () => {
    const onChunkChange = vi.fn();
    let hookResult: any;
    await act(async () => {
      hookResult = renderHook(() =>
        useVoicePlayer({ chunks: sampleChunks, onChunkChange })
      );
    });

    await vi.waitFor(() => {
      expect(hookResult.result.current.voices.length).toBeGreaterThan(0);
    });

    act(() => {
      hookResult.result.current.play();
    });

    expect(hookResult.result.current.status).toBe('playing');
    expect(window.speechSynthesis.speak).toHaveBeenCalled();

    act(() => {
      hookResult.result.current.pause();
    });

    expect(hookResult.result.current.status).toBe('paused');
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();

    act(() => {
      hookResult.result.current.resume();
    });

    expect(hookResult.result.current.status).toBe('playing');
  });

  it('gracefully falls back to browser engine when custom neural engine fails', async () => {
    const failingEngine: TTSEngine = {
      id: 'piper',
      name: 'Failing Piper Engine',
      isReady: false,
      init: vi.fn().mockRejectedValue(new Error('WASM compilation failed')),
      listVoices: vi.fn().mockRejectedValue(new Error('Failed to load models')),
      speakChunk: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      stop: vi.fn(),
    };

    let hookResult: any;
    await act(async () => {
      hookResult = renderHook(() =>
        useVoicePlayer({ chunks: sampleChunks, customEngine: failingEngine })
      );
    });

      await vi.waitFor(() => {
      expect(hookResult.result.current.selectedEngineId).toBe('browser');
      expect(hookResult.result.current.fallbackNotice).toContain('Falling back to Smart Browser Voice');
      expect(hookResult.result.current.voices.length).toBeGreaterThan(0);
    });
  });

  it('ignores stale onEnd callbacks when jumping to another chunk while playing (Issue 8)', async () => {
    const callbacks: Record<number, { onStart?: () => void; onEnd?: () => void }> = {};
    const mockEngine: TTSEngine = {
      id: 'piper',
      name: 'Mock Neural Engine',
      isReady: true,
      init: vi.fn().mockResolvedValue(undefined),
      listVoices: vi.fn().mockResolvedValue([
        {
          id: 'mock-voice',
          name: 'Mock Voice',
          engine: 'piper',
          lang: 'en-US',
          tier: 2,
          quality: 'natural',
          isDownloaded: true,
        },
      ]),
      speakChunk: vi.fn().mockImplementation(async (chunk, _voice, opts) => {
        callbacks[chunk.index] = opts;
        opts.onStart?.();
      }),
      pause: vi.fn(),
      resume: vi.fn(),
      stop: vi.fn(),
    };

    const threeChunks: SpeechChunk[] = [
      { index: 0, text: 'Chunk 0.', blockIndex: 0 },
      { index: 1, text: 'Chunk 1.', blockIndex: 1 },
      { index: 2, text: 'Chunk 2.', blockIndex: 2 },
    ];

    let hookResult: any;
    await act(async () => {
      hookResult = renderHook(() =>
        useVoicePlayer({ chunks: threeChunks, customEngine: mockEngine })
      );
    });

    await vi.waitFor(() => {
      expect(hookResult.result.current.voices.length).toBe(1);
    });

    // Start at chunk 0, then click/jump directly to chunk 2
    act(() => {
      hookResult.result.current.play(0);
    });
    act(() => {
      hookResult.result.current.play(2);
    });

    // Simulate stale onEnd from chunk 0 resolving late
    act(() => {
      callbacks[0].onEnd?.();
    });

    // Must remain on chunk 2 and NOT jump back to chunk 1!
    expect(hookResult.result.current.currentChunkIndex).toBe(2);
    expect(mockEngine.speakChunk).toHaveBeenCalledTimes(2);
  });
});
