import { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceOption, VoiceEngineId, PlayerStatus, TTSEngine } from '../tts/types';
import { BrowserTTSEngine, rankBrowserVoices } from '../tts/browserEngine';
import { PiperTTSEngine } from '../tts/piperEngine';
import { GoogleByokEngine } from '../tts/googleByokEngine';
import { SpeechChunk } from '../utils/textChunker';
import { mergeWavBlobs } from '../tts/wavMerger';
import { useLocalStorage } from './useLocalStorage';

interface UseVoicePlayerProps {
  chunks: SpeechChunk[];
  onChunkChange?: (index: number, chunk: SpeechChunk | null) => void;
  customEngine?: TTSEngine; // Allows plugging mock engine for tests
}

function getInitialVoices(): VoiceOption[] {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    const raw = window.speechSynthesis.getVoices();
    if (raw && raw.length > 0) {
      return rankBrowserVoices(raw);
    }
  }
  return [];
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
  const [voices, setVoices] = useState<VoiceOption[]>(getInitialVoices);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [isVoiceManagerOpen, setIsVoiceManagerOpen] = useState<boolean>(false);
  const [isExportingAudio, setIsExportingAudio] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);

  // Engines
  const browserEngineRef = useRef<BrowserTTSEngine>(new BrowserTTSEngine());
  const piperEngineRef = useRef<PiperTTSEngine>(new PiperTTSEngine());
  const googleByokEngineRef = useRef<GoogleByokEngine>(new GoogleByokEngine());

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

  // Initialize engines and load voices
  const refreshVoices = useCallback(async () => {
    try {
      if (customEngine) {
        await customEngine.init();
        const loaded = await customEngine.listVoices();
        setVoices(loaded);
        if (loaded.length > 0 && !loaded.some((v) => v.id === selectedVoiceId)) {
          setSelectedVoiceId(loaded[0].id);
        }
        return;
      }

      await browserEngineRef.current.init();
      const bVoices = await browserEngineRef.current.listVoices();

      // Attempt initializing Piper engine in background
      try {
        await piperEngineRef.current.init();
      } catch {
        // Piper non-critical failure
      }
      const pVoices = await piperEngineRef.current.listVoices();

      // Check BYOK key
      const gkey = typeof window !== 'undefined' ? localStorage.getItem('markread_gcloud_tts_key') : null;
      if (gkey) {
        googleByokEngineRef.current.setApiKey(gkey);
        await googleByokEngineRef.current.init();
      }
      const gVoices = googleByokEngineRef.current.isReady
        ? await googleByokEngineRef.current.listVoices()
        : [];

      const combined = [...pVoices, ...bVoices, ...gVoices];
      setVoices(combined);

      // Prefer browser smart-ranked natural voice on first visit (zero downloads needed out of the box)
      if (combined.length > 0) {
        const found = combined.find((v) => v.id === selectedVoiceId);
        if (!found) {
          const naturalBrowserDefault = bVoices.find((v) => v.quality === 'natural') || bVoices[0];
          const chosen = naturalBrowserDefault || combined[0];
          setSelectedVoiceId(chosen.id);
          setSelectedEngineId(chosen.engine);
        }
      }
    } catch (err) {
      console.warn('[useVoicePlayer] Voice initialization error, falling back:', err);
      // Graceful fallback to browser engine
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
      stop();
    }
  }, [chunks]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      browserEngineRef.current.stop();
      piperEngineRef.current.stop();
      googleByokEngineRef.current.stop();
    };
  }, []);

  const selectedVoice =
    voices.find((v) => v.id === selectedVoiceId) ||
    voices.find((v) => v.quality === 'natural') ||
    voices[0] ||
    null;

  const getEngineForVoice = (voice: VoiceOption | null): TTSEngine => {
    if (customEngine) return customEngine;
    if (!voice) return browserEngineRef.current;
    if (voice.engine === 'piper') return piperEngineRef.current;
    if (voice.engine === 'google-cloud') return googleByokEngineRef.current;
    return browserEngineRef.current;
  };

  const speakChunkAtIndex = useCallback(
    (index: number) => {
      const currentChunks = chunksRef.current;
      if (index < 0 || index >= currentChunks.length) {
        const engine = getEngineForVoice(selectedVoice);
        engine.stop();
        setStatus('idle');
        setCurrentChunkIndex(0);
        onChunkChangeRef.current?.(0, null);
        return;
      }

      const chunk = currentChunks[index];
      let voice = selectedVoice;
      if (!voice && typeof window !== 'undefined' && window.speechSynthesis) {
        const raw = window.speechSynthesis.getVoices();
        if (raw.length > 0) {
          const ranked = rankBrowserVoices(raw);
          voice = ranked[0] || null;
        }
      }
      if (!voice) return;

      const engine = getEngineForVoice(voice);

      // NV-4.1: Trigger lookahead prefetch for chunk i + 1 if using Piper neural engine
      if (voice.engine === 'piper' && index + 1 < currentChunks.length) {
        piperEngineRef.current.prefetchChunk(currentChunks[index + 1], voice.id);
      }

      engine.speakChunk(chunk, voice, {
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
    },
    [selectedVoice]
  );

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
    const engine = getEngineForVoice(selectedVoice);
    engine.pause();
    setStatus('paused');
    statusRef.current = 'paused';
  }, [selectedVoice]);

  const resume = useCallback(() => {
    if (statusRef.current === 'paused') {
      const engine = getEngineForVoice(selectedVoice);
      engine.resume();
      setStatus('playing');
      statusRef.current = 'playing';
    }
  }, [selectedVoice]);

  const stop = useCallback(() => {
    browserEngineRef.current.stop();
    piperEngineRef.current.stop();
    googleByokEngineRef.current.stop();
    if (customEngine) customEngine.stop();
    setStatus('idle');
    statusRef.current = 'idle';
    setCurrentChunkIndex(0);
    onChunkChangeRef.current?.(0, null);
  }, [customEngine]);

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

  const selectVoice = useCallback(
    (voice: VoiceOption) => {
      setSelectedVoiceId(voice.id);
      setSelectedEngineId(voice.engine);
      if (statusRef.current === 'playing') {
        speakChunkAtIndex(currentChunkIndexRef.current);
      }
    },
    [setSelectedEngineId, setSelectedVoiceId, speakChunkAtIndex]
  );

  /**
   * NV-4.3: Export Narrated Document as single continuous .wav file
   */
  const exportNarrationAsWav = useCallback(async (): Promise<Blob | null> => {
    const currentChunks = chunksRef.current;
    if (currentChunks.length === 0) return null;

    const voice = selectedVoice;
    if (!voice) return null;

    setIsExportingAudio(true);
    setExportProgress(0);

    try {
      const blobs: Blob[] = [];

      for (let i = 0; i < currentChunks.length; i++) {
        const c = currentChunks[i];
        let chunkBlob: Blob;

        if (voice.engine === 'piper') {
          chunkBlob = await piperEngineRef.current.synthesizeChunkToBlob(c.index, c.text, voice.id);
        } else if (voice.engine === 'google-cloud') {
          chunkBlob = await googleByokEngineRef.current.synthesizeChunkToBlob(c.text, voice.id);
        } else {
          // Browser engine does not support direct binary export, use fallback Piper voice
          chunkBlob = await piperEngineRef.current.synthesizeChunkToBlob(
            c.index,
            c.text,
            'en_US-lessac-medium'
          );
        }

        blobs.push(chunkBlob);
        setExportProgress(Math.round(((i + 1) / currentChunks.length) * 100));
      }

      const merged = await mergeWavBlobs(blobs);
      setIsExportingAudio(false);
      return merged;
    } catch (err) {
      console.warn('[useVoicePlayer] Audio export failed:', err);
      setIsExportingAudio(false);
      return null;
    }
  }, [selectedVoice]);

  return {
    status,
    currentChunkIndex,
    voices,
    selectedVoice,
    selectedEngineId,
    setSelectedEngineId,
    selectedVoiceId,
    setSelectedVoiceId,
    selectVoice,
    rate,
    setRate,
    fallbackNotice,
    setFallbackNotice,
    isVoiceManagerOpen,
    setIsVoiceManagerOpen,
    isExportingAudio,
    exportProgress,
    exportNarrationAsWav,
    piperEngine: piperEngineRef.current,
    googleByokEngine: googleByokEngineRef.current,
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
