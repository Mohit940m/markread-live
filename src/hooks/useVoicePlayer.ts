import { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceOption, VoiceEngineId, PlayerStatus, TTSEngine } from '../tts/types';
import { BrowserTTSEngine } from '../tts/browserEngine';
import { SpeechChunk } from '../utils/textChunker';
import { useLocalStorage } from './useLocalStorage';

interface UseVoicePlayerProps {
  chunks: SpeechChunk[];
  onChunkChange?: (index: number, chunk: SpeechChunk | null) => void;
  customEngine?: TTSEngine; // Allows plugging Piper, Kokoro or test mock
}

export function useVoicePlayer({
  chunks,
  onChunkChange,
  customEngine,
}: UseVoicePlayerProps) {
  const [selectedEngineId, setSelectedEngineId] = useLocalStorage<VoiceEngineId>(
    'markread_voice_engine',
    'browser'
  );
  const [selectedVoiceId, setSelectedVoiceId] = useLocalStorage<string | null>(
    'markread_voice_id',
    null
  );
  const [rate, setRate] = useLocalStorage<number>('markread_tts_rate', 1.0);

  const [status, setStatus] = useState<PlayerStatus>('idle');
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(0);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);

  // Default browser engine instance
  const browserEngineRef = useRef<BrowserTTSEngine>(new BrowserTTSEngine());
  const activeEngineRef = useRef<TTSEngine>(customEngine || browserEngineRef.current);

  const statusRef = useRef<PlayerStatus>('idle');
  statusRef.current = status;

  const currentChunkIndexRef = useRef<number>(0);
  currentChunkIndexRef.current = currentChunkIndex;

  const chunksRef = useRef<SpeechChunk[]>(chunks);
  chunksRef.current = chunks;

  const rateRef = useRef<number>(rate);
  rateRef.current = rate;

  const onChunkChangeRef = useRef(onChunkChange);
  onChunkChangeRef.current = onChunkChange;

  // Initialize active engine and load voices
  const refreshVoices = useCallback(async () => {
    try {
      const engine = customEngine || browserEngineRef.current;
      activeEngineRef.current = engine;
      await engine.init();
      const loaded = await engine.listVoices();
      setVoices(loaded);

      // Default selection to first high quality natural voice if none selected
      if (loaded.length > 0) {
        const found = loaded.find((v) => v.id === selectedVoiceId);
        if (!found) {
          const naturalDefault = loaded.find((v) => v.quality === 'natural') || loaded[0];
          setSelectedVoiceId(naturalDefault.id);
        }
      }
    } catch (err) {
      console.warn('[useVoicePlayer] Voice initialization error, falling back:', err);
      // Graceful fallback to browser engine
      activeEngineRef.current = browserEngineRef.current;
      await browserEngineRef.current.init();
      const fallbackList = await browserEngineRef.current.listVoices();
      setVoices(fallbackList);
      setSelectedEngineId('browser');
      setFallbackNotice('Neural voice unavailable. Falling back to Smart Browser Voice.');
      if (fallbackList.length > 0) {
        setSelectedVoiceId(fallbackList[0].id);
      }
    }
  }, [customEngine, selectedVoiceId, setSelectedEngineId, setSelectedVoiceId]);

  useEffect(() => {
    refreshVoices();

    const handleVoicesChanged = () => {
      refreshVoices();
    };

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      }
    };
  }, [refreshVoices]);

  // Stop playback when document content changes
  useEffect(() => {
    if (statusRef.current !== 'idle') {
      activeEngineRef.current.stop();
      setStatus('idle');
      setCurrentChunkIndex(0);
      onChunkChangeRef.current?.(0, null);
    }
  }, [chunks]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeEngineRef.current.stop();
    };
  }, []);

  const selectedVoice = voices.find((v) => v.id === selectedVoiceId) || voices[0] || null;

  const speakChunkAtIndex = useCallback((index: number) => {
    const currentChunks = chunksRef.current;
    if (index < 0 || index >= currentChunks.length) {
      activeEngineRef.current.stop();
      setStatus('idle');
      setCurrentChunkIndex(0);
      onChunkChangeRef.current?.(0, null);
      return;
    }

    const chunk = currentChunks[index];
    const voice = selectedVoice;
    if (!voice) return;

    activeEngineRef.current.speakChunk(chunk, voice, {
      rate: rateRef.current,
      onStart: () => {
        setCurrentChunkIndex(index);
        onChunkChangeRef.current?.(index, chunk);
      },
      onEnd: () => {
        if (statusRef.current === 'playing') {
          const nextIdx = index + 1;
          if (nextIdx < currentChunks.length) {
            speakChunkAtIndex(nextIdx);
          } else {
            setStatus('idle');
            setCurrentChunkIndex(0);
            onChunkChangeRef.current?.(0, null);
          }
        }
      },
      onError: (err) => {
        console.warn('[useVoicePlayer] Playback error at chunk', index, err);
        setStatus('idle');
      },
    });
  }, [selectedVoice]);

  const play = useCallback(
    (startIndex?: number) => {
      const idx = startIndex !== undefined ? startIndex : currentChunkIndexRef.current;
      setStatus('playing');
      statusRef.current = 'playing';
      speakChunkAtIndex(idx);
    },
    [speakChunkAtIndex]
  );

  const pause = useCallback(() => {
    activeEngineRef.current.pause();
    setStatus('paused');
    statusRef.current = 'paused';
  }, []);

  const resume = useCallback(() => {
    if (statusRef.current === 'paused') {
      setStatus('playing');
      statusRef.current = 'playing';
      speakChunkAtIndex(currentChunkIndexRef.current);
    }
  }, [speakChunkAtIndex]);

  const stop = useCallback(() => {
    activeEngineRef.current.stop();
    setStatus('idle');
    statusRef.current = 'idle';
    setCurrentChunkIndex(0);
    onChunkChangeRef.current?.(0, null);
  }, []);

  const next = useCallback(() => {
    const nextIdx = Math.min(chunksRef.current.length - 1, currentChunkIndexRef.current + 1);
    setCurrentChunkIndex(nextIdx);
    if (statusRef.current === 'playing') {
      speakChunkAtIndex(nextIdx);
    }
  }, [speakChunkAtIndex]);

  const prev = useCallback(() => {
    const prevIdx = Math.max(0, currentChunkIndexRef.current - 1);
    setCurrentChunkIndex(prevIdx);
    if (statusRef.current === 'playing') {
      speakChunkAtIndex(prevIdx);
    }
  }, [speakChunkAtIndex]);

  const seek = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(chunksRef.current.length - 1, index));
      setCurrentChunkIndex(clamped);
      if (statusRef.current === 'playing') {
        speakChunkAtIndex(clamped);
      }
    },
    [speakChunkAtIndex]
  );

  return {
    status,
    currentChunkIndex,
    voices,
    selectedVoice,
    selectedEngineId,
    setSelectedEngineId,
    selectedVoiceId,
    setSelectedVoiceId,
    rate,
    setRate,
    fallbackNotice,
    setFallbackNotice,
    play,
    pause,
    resume,
    stop,
    next,
    prev,
    seek,
    refreshVoices,
  };
}
