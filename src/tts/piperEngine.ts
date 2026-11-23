import { TTSEngine, VoiceOption, SpeakOptions } from './types';
import { SpeechChunk } from '../utils/textChunker';
import { CURATED_PIPER_VOICES } from './voiceCatalog';

export interface DownloadProgressCallback {
  (progressPercent: number): void;
}

export class PiperTTSEngine implements TTSEngine {
  id = 'piper' as const;
  name = 'Piper Local Neural Voices';
  isReady = false;

  private worker: Worker | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private currentBlobUrl: string | null = null;

  // Dedicated preview audio element for testing voices
  private previewAudio: HTMLAudioElement | null = null;
  private previewBlobUrl: string | null = null;

  private storedVoiceIds: Set<string> = new Set();
  private downloadCallbacks: Map<string, DownloadProgressCallback[]> = new Map();
  private synthesisResolvers: Map<
    number,
    { resolve: (blob: Blob) => void; reject: (err: any) => void }
  > = new Map();

  // Lookahead chunk prefetch cache (chunkId -> Blob)
  private prefetchedBlobs: Map<number, Blob> = new Map();
  private pendingPrefetches: Set<number> = new Set();

  async init(): Promise<void> {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      this.isReady = false;
      return;
    }

    if (!this.worker) {
      try {
        this.worker = new Worker(new URL('./piper.worker.ts', import.meta.url), {
          type: 'module',
        });
        this.worker.onmessage = this.handleWorkerMessage.bind(this);
      } catch (e) {
        console.warn('[PiperTTSEngine] Worker instantiation failed:', e);
      }
    }

    await this.refreshStoredVoices();
    this.isReady = true;
  }

  private handleWorkerMessage(e: MessageEvent) {
    const data = e.data;
    if (!data) return;

    switch (data.type) {
      case 'DOWNLOAD_PROGRESS': {
        const cbs = this.downloadCallbacks.get(data.voiceId) || [];
        cbs.forEach((cb) => cb(data.progress));
        break;
      }
      case 'DOWNLOAD_COMPLETE': {
        this.storedVoiceIds.add(data.voiceId);
        const cbs = this.downloadCallbacks.get(data.voiceId) || [];
        cbs.forEach((cb) => cb(100));
        this.downloadCallbacks.delete(data.voiceId);
        break;
      }
      case 'DOWNLOAD_ERROR': {
        this.downloadCallbacks.delete(data.voiceId);
        break;
      }
      case 'SYNTHESIS_COMPLETE': {
        const handler = this.synthesisResolvers.get(data.chunkId);
        if (handler) {
          handler.resolve(data.blob);
          this.synthesisResolvers.delete(data.chunkId);
        }
        break;
      }
      case 'SYNTHESIS_ERROR': {
        const handler = this.synthesisResolvers.get(data.chunkId);
        if (handler) {
          handler.reject(new Error(data.error));
          this.synthesisResolvers.delete(data.chunkId);
        }
        break;
      }
      case 'STORED_VOICES': {
        this.storedVoiceIds = new Set(data.voiceIds || []);
        break;
      }
      case 'VOICE_DELETED': {
        this.storedVoiceIds.delete(data.voiceId);
        break;
      }
    }
  }

  async refreshStoredVoices(): Promise<string[]> {
    if (!this.worker) return [];
    const activeWorker = this.worker;
    return new Promise((resolve) => {
      const handler = (e: MessageEvent) => {
        if (e.data?.type === 'STORED_VOICES') {
          activeWorker.removeEventListener('message', handler);
          resolve(e.data.voiceIds || []);
        }
      };
      activeWorker.addEventListener('message', handler);
      activeWorker.postMessage({ type: 'LIST_STORED_VOICES' });
      // Fallback timeout in case OPFS is not supported
      setTimeout(() => resolve([]), 500);
    });
  }

  async listVoices(): Promise<VoiceOption[]> {
    return CURATED_PIPER_VOICES.map((v) => ({
      ...v,
      isDownloaded: this.storedVoiceIds.has(v.id),
    }));
  }

  async downloadVoice(voiceId: string, onProgress?: DownloadProgressCallback): Promise<void> {
    if (!this.worker) await this.init();
    if (!this.worker) throw new Error('Worker unavailable');

    if (onProgress) {
      const existing = this.downloadCallbacks.get(voiceId) || [];
      this.downloadCallbacks.set(voiceId, [...existing, onProgress]);
    }

    this.worker.postMessage({ type: 'DOWNLOAD_VOICE', voiceId });
  }

  async deleteVoice(voiceId: string): Promise<void> {
    if (this.worker) {
      this.worker.postMessage({ type: 'DELETE_VOICE', voiceId });
      this.storedVoiceIds.delete(voiceId);
    }
  }

  isVoiceDownloaded(voiceId: string): boolean {
    return this.storedVoiceIds.has(voiceId);
  }

  async synthesizeChunkToBlob(chunkId: number, text: string, voiceId: string): Promise<Blob> {
    if (!this.worker) await this.init();
    if (!this.worker) throw new Error('Worker unavailable');

    return new Promise((resolve, reject) => {
      this.synthesisResolvers.set(chunkId, { resolve, reject });
      this.worker?.postMessage({
        type: 'SYNTHESIZE_CHUNK',
        chunkId,
        text,
        voiceId,
      });
    });
  }

  /**
   * Lookahead Chunk Prefetch (NV-4.1)
   * Preemptively synthesizes the next sentence chunk in background worker
   */
  async prefetchChunk(chunk: SpeechChunk, voiceId: string): Promise<void> {
    if (this.prefetchedBlobs.has(chunk.index) || this.pendingPrefetches.has(chunk.index)) {
      return;
    }
    this.pendingPrefetches.add(chunk.index);
    try {
      const blob = await this.synthesizeChunkToBlob(chunk.index, chunk.text, voiceId);
      this.prefetchedBlobs.set(chunk.index, blob);
    } catch {
      // Ignore prefetch error; speakChunk will retry
    } finally {
      this.pendingPrefetches.delete(chunk.index);
    }
  }

  clearPrefetch(): void {
    this.prefetchedBlobs.clear();
    this.pendingPrefetches.clear();
  }

  async speakChunk(
    chunk: SpeechChunk,
    voice: VoiceOption,
    options: SpeakOptions
  ): Promise<void> {
    this.cleanupAudio();

    try {
      let blob = this.prefetchedBlobs.get(chunk.index);
      if (blob) {
        this.prefetchedBlobs.delete(chunk.index);
      } else {
        blob = await this.synthesizeChunkToBlob(chunk.index, chunk.text, voice.id);
      }

      const blobUrl = URL.createObjectURL(blob);
      this.currentBlobUrl = blobUrl;

      const audio = new Audio(blobUrl);
      this.currentAudio = audio;

      if (options.rate) {
        audio.playbackRate = options.rate;
      }

      audio.onplay = () => {
        options.onStart?.();
      };

      audio.onended = () => {
        this.cleanupAudio();
        options.onEnd?.();
      };

      audio.onerror = (e) => {
        this.cleanupAudio();
        options.onError?.(e);
      };

      await audio.play();
    } catch (err) {
      this.cleanupAudio();
      options.onError?.(err);
    }
  }

  pause(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
    }
  }

  resume(): void {
    if (this.currentAudio) {
      this.currentAudio.play().catch(console.warn);
    }
  }

  stop(): void {
    this.cleanupAudio();
    this.clearPrefetch();
  }

  /**
   * Preview a voice sample without affecting document reading position (NV-3.3)
   */
  async previewVoice(
    voice: VoiceOption,
    sampleText = 'MarkRead brings your markdown to life with natural voices.'
  ): Promise<void> {
    this.stopPreview();

    try {
      const blob = await this.synthesizeChunkToBlob(-999, sampleText, voice.id);
      const url = URL.createObjectURL(blob);
      this.previewBlobUrl = url;

      const audio = new Audio(url);
      this.previewAudio = audio;

      audio.onended = () => {
        this.stopPreview();
      };
      audio.onerror = () => {
        this.stopPreview();
      };

      await audio.play();
    } catch (err) {
      this.stopPreview();
      throw err;
    }
  }

  stopPreview(): void {
    if (this.previewAudio) {
      this.previewAudio.pause();
      this.previewAudio.src = '';
      this.previewAudio = null;
    }
    if (this.previewBlobUrl) {
      URL.revokeObjectURL(this.previewBlobUrl);
      this.previewBlobUrl = null;
    }
  }

  private cleanupAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = '';
      this.currentAudio = null;
    }
    // Mobile memory leak prevention: revoke object URL immediately
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }
  }
}
