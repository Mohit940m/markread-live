/// <reference lib="webworker" />
import { download, predict, stored, remove, Progress } from '@mintplex-labs/piper-tts-web';

export type WorkerInMessage =
  | { type: 'DOWNLOAD_VOICE'; voiceId: string }
  | { type: 'SYNTHESIZE_CHUNK'; chunkId: number; text: string; voiceId: string }
  | { type: 'LIST_STORED_VOICES' }
  | { type: 'DELETE_VOICE'; voiceId: string };

export type WorkerOutMessage =
  | { type: 'DOWNLOAD_PROGRESS'; voiceId: string; progress: number }
  | { type: 'DOWNLOAD_COMPLETE'; voiceId: string }
  | { type: 'DOWNLOAD_ERROR'; voiceId: string; error: string }
  | { type: 'SYNTHESIS_COMPLETE'; chunkId: number; blob: Blob }
  | { type: 'SYNTHESIS_ERROR'; chunkId: number; error: string }
  | { type: 'STORED_VOICES'; voiceIds: string[] }
  | { type: 'VOICE_DELETED'; voiceId: string };

self.addEventListener('message', async (event: MessageEvent<WorkerInMessage>) => {
  const msg = event.data;
  if (!msg) return;

  switch (msg.type) {
    case 'DOWNLOAD_VOICE': {
      try {
        await download(msg.voiceId as any, (p: Progress) => {
          const percent = p.total > 0 ? Math.round((p.loaded / p.total) * 100) : 0;
          self.postMessage({
            type: 'DOWNLOAD_PROGRESS',
            voiceId: msg.voiceId,
            progress: percent,
          } as WorkerOutMessage);
        });
        self.postMessage({
          type: 'DOWNLOAD_COMPLETE',
          voiceId: msg.voiceId,
        } as WorkerOutMessage);
      } catch (err: any) {
        self.postMessage({
          type: 'DOWNLOAD_ERROR',
          voiceId: msg.voiceId,
          error: err?.message || String(err),
        } as WorkerOutMessage);
      }
      break;
    }

    case 'SYNTHESIZE_CHUNK': {
      try {
        const audioBlob = await predict({
          text: msg.text,
          voiceId: msg.voiceId as any,
        });
        self.postMessage({
          type: 'SYNTHESIS_COMPLETE',
          chunkId: msg.chunkId,
          blob: audioBlob,
        } as WorkerOutMessage);
      } catch (err: any) {
        self.postMessage({
          type: 'SYNTHESIS_ERROR',
          chunkId: msg.chunkId,
          error: err?.message || String(err),
        } as WorkerOutMessage);
      }
      break;
    }

    case 'LIST_STORED_VOICES': {
      try {
        const saved = await stored();
        self.postMessage({
          type: 'STORED_VOICES',
          voiceIds: saved as string[],
        } as WorkerOutMessage);
      } catch (err) {
        self.postMessage({
          type: 'STORED_VOICES',
          voiceIds: [],
        } as WorkerOutMessage);
      }
      break;
    }

    case 'DELETE_VOICE': {
      try {
        await remove(msg.voiceId as any);
        self.postMessage({
          type: 'VOICE_DELETED',
          voiceId: msg.voiceId,
        } as WorkerOutMessage);
      } catch (err) {
        // Ignore deletion errors
      }
      break;
    }
  }
});
