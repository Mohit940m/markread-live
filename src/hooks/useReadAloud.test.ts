import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useReadAloud } from './useReadAloud';
import { SpeechChunk } from '../utils/textChunker';

describe('useReadAloud Hook (US-4.2)', () => {
  const sampleChunks: SpeechChunk[] = [
    { index: 0, text: 'Sentence one.', blockIndex: 0 },
    { index: 1, text: 'Sentence two.', blockIndex: 1 },
    { index: 2, text: 'Sentence three.', blockIndex: 2 },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    window.speechSynthesis.cancel();
  });

  it('initializes in idle state with currentChunkIndex 0', () => {
    const { result } = renderHook(() => useReadAloud({ chunks: sampleChunks }));
    expect(result.current.status).toBe('idle');
    expect(result.current.currentChunkIndex).toBe(0);
  });

  it('starts speaking when play() is called', () => {
    const onChunkChange = vi.fn();
    const { result } = renderHook(() =>
      useReadAloud({ chunks: sampleChunks, onChunkChange })
    );

    act(() => {
      result.current.play();
    });

    expect(result.current.status).toBe('playing');
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    expect(onChunkChange).toHaveBeenCalledWith(0, sampleChunks[0]);
  });

  it('implements pause by cancelling speech and keeping currentChunkIndex (Android Chrome fix)', () => {
    const { result } = renderHook(() => useReadAloud({ chunks: sampleChunks }));

    act(() => {
      result.current.play(1);
    });
    expect(result.current.currentChunkIndex).toBe(1);

    act(() => {
      result.current.pause();
    });

    expect(result.current.status).toBe('paused');
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    // Index is retained!
    expect(result.current.currentChunkIndex).toBe(1);
  });

  it('resumes playback from currentChunkIndex', () => {
    const { result } = renderHook(() => useReadAloud({ chunks: sampleChunks }));

    act(() => {
      result.current.play(1);
      result.current.pause();
    });
    expect(result.current.status).toBe('paused');

    act(() => {
      result.current.resume();
    });

    expect(result.current.status).toBe('playing');
    expect(result.current.currentChunkIndex).toBe(1);
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });

  it('stops speech and resets index to 0 when stop() is called', () => {
    const { result } = renderHook(() => useReadAloud({ chunks: sampleChunks }));

    act(() => {
      result.current.play(1);
      result.current.stop();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.currentChunkIndex).toBe(0);
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
  });

  it('navigates to next and previous chunks', () => {
    const { result } = renderHook(() => useReadAloud({ chunks: sampleChunks }));

    act(() => {
      result.current.next();
    });
    expect(result.current.currentChunkIndex).toBe(1);

    act(() => {
      result.current.next();
    });
    expect(result.current.currentChunkIndex).toBe(2);

    act(() => {
      result.current.prev();
    });
    expect(result.current.currentChunkIndex).toBe(1);
  });
});
