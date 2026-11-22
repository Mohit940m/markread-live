import { useState, useEffect, useRef, useCallback } from 'react';
import { SpeechChunk } from '../utils/textChunker';

export type ReadAloudStatus = 'idle' | 'playing' | 'paused';

interface UseReadAloudOptions {
  chunks: SpeechChunk[];
  rate?: number;
  voiceURI?: string | null;
  onChunkChange?: (chunkIndex: number, chunk: SpeechChunk | null) => void;
}

export function useReadAloud({
  chunks,
  rate = 1.0,
  voiceURI = null,
  onChunkChange,
}: UseReadAloudOptions) {
  const [status, setStatus] = useState<ReadAloudStatus>('idle');
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Refs to avoid stale closures in Web Speech callbacks
  const statusRef = useRef<ReadAloudStatus>('idle');
  statusRef.current = status;

  const currentChunkIndexRef = useRef<number>(0);
  currentChunkIndexRef.current = currentChunkIndex;

  const chunksRef = useRef<SpeechChunk[]>(chunks);
  chunksRef.current = chunks;

  const rateRef = useRef<number>(rate);
  rateRef.current = rate;

  const voiceURIRef = useRef<string | null>(voiceURI);
  voiceURIRef.current = voiceURI;

  const onChunkChangeRef = useRef(onChunkChange);
  onChunkChangeRef.current = onChunkChange;

  // Populate browser voices and listen to voiceschanged event
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const updateVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available && available.length > 0) {
        setVoices(available);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Stop playback if document content changes completely
  useEffect(() => {
    if (statusRef.current !== 'idle') {
      window.speechSynthesis?.cancel();
      setStatus('idle');
      setCurrentChunkIndex(0);
      onChunkChangeRef.current?.(0, null);
    }
  }, [chunks]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakChunk = useCallback((index: number) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const currentChunks = chunksRef.current;
    if (index < 0 || index >= currentChunks.length) {
      window.speechSynthesis.cancel();
      setStatus('idle');
      setCurrentChunkIndex(0);
      onChunkChangeRef.current?.(0, null);
      return;
    }

    const chunk = currentChunks[index];
    window.speechSynthesis.cancel(); // Cancel any lingering speech

    const utterance = new SpeechSynthesisUtterance(chunk.text);
    utterance.rate = rateRef.current;

    // Apply voice if selected
    if (voiceURIRef.current) {
      const selectedVoice = window.speechSynthesis
        .getVoices()
        .find((v) => v.voiceURI === voiceURIRef.current);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    utterance.onstart = () => {
      setCurrentChunkIndex(index);
      onChunkChangeRef.current?.(index, chunk);
    };

    utterance.onend = () => {
      // If still playing, advance to next chunk
      if (statusRef.current === 'playing') {
        const nextIdx = index + 1;
        if (nextIdx < currentChunks.length) {
          speakChunk(nextIdx);
        } else {
          setStatus('idle');
          setCurrentChunkIndex(0);
          onChunkChangeRef.current?.(0, null);
        }
      }
    };

    utterance.onerror = (e) => {
      // Ignore user cancellation errors
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.warn('[useReadAloud] Speech synthesis error:', e);
      }
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const play = useCallback(
    (startIndex?: number) => {
      const idx = startIndex !== undefined ? startIndex : currentChunkIndexRef.current;
      setStatus('playing');
      statusRef.current = 'playing';
      speakChunk(idx);
    },
    [speakChunk]
  );

  /**
   * Resilient Pause:
   * Chrome on Android terminates utterances on window.speechSynthesis.pause().
   * We cancel the current utterance while preserving currentChunkIndex in state,
   * so resume() restarts playback seamlessly at the exact same chunk.
   */
  const pause = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setStatus('paused');
    statusRef.current = 'paused';
  }, []);

  const resume = useCallback(() => {
    if (statusRef.current === 'paused') {
      setStatus('playing');
      statusRef.current = 'playing';
      speakChunk(currentChunkIndexRef.current);
    }
  }, [speakChunk]);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setStatus('idle');
    statusRef.current = 'idle';
    setCurrentChunkIndex(0);
    onChunkChangeRef.current?.(0, null);
  }, []);

  const next = useCallback(() => {
    const nextIdx = Math.min(chunksRef.current.length - 1, currentChunkIndexRef.current + 1);
    setCurrentChunkIndex(nextIdx);
    if (statusRef.current === 'playing') {
      speakChunk(nextIdx);
    }
  }, [speakChunk]);

  const prev = useCallback(() => {
    const prevIdx = Math.max(0, currentChunkIndexRef.current - 1);
    setCurrentChunkIndex(prevIdx);
    if (statusRef.current === 'playing') {
      speakChunk(prevIdx);
    }
  }, [speakChunk]);

  const seek = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(chunksRef.current.length - 1, index));
      setCurrentChunkIndex(clamped);
      if (statusRef.current === 'playing') {
        speakChunk(clamped);
      }
    },
    [speakChunk]
  );

  return {
    status,
    currentChunkIndex,
    voices,
    play,
    pause,
    resume,
    stop,
    next,
    prev,
    seek,
  };
}
