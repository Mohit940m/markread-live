import { describe, it, expect } from 'vitest';
import { mergeWavBlobs } from './wavMerger';

function blobToBuffer(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') {
    return blob.arrayBuffer();
  }
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

function createMockWavBlob(pcmBytes: number[], sampleRate = 22050): Blob {
  const pcmLength = pcmBytes.length;
  const buffer = new ArrayBuffer(44 + pcmLength);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // "RIFF"
  bytes.set([0x52, 0x49, 0x46, 0x46], 0);
  view.setUint32(4, 36 + pcmLength, true);
  // "WAVE"
  bytes.set([0x57, 0x41, 0x56, 0x45], 8);

  // "fmt "
  bytes.set([0x66, 0x6d, 0x74, 0x20], 12);
  view.setUint32(16, 16, true); // subchunk 1 size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono (1 channel)
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // Byte rate
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample

  // "data"
  bytes.set([0x64, 0x61, 0x74, 0x61], 36);
  view.setUint32(40, pcmLength, true);

  // PCM data
  bytes.set(pcmBytes, 44);

  return new Blob([buffer], { type: 'audio/wav' });
}

describe('wavMerger (NV-4.3 Audio Export)', () => {
  it('returns single blob directly without alteration if only one blob provided', async () => {
    const single = createMockWavBlob([1, 2, 3]);
    const merged = await mergeWavBlobs([single]);
    expect(merged.size).toBe(single.size);
  });

  it('concatenates multiple WAV blobs correctly recalculating header and data lengths', async () => {
    const chunk1 = createMockWavBlob([10, 20, 30, 40]);
    const chunk2 = createMockWavBlob([50, 60]);
    const chunk3 = createMockWavBlob([70, 80, 90]);

    const merged = await mergeWavBlobs([chunk1, chunk2, chunk3]);
    expect(merged.type).toBe('audio/wav');
    // Expected size = 44 bytes header + (4 + 2 + 3) = 53 bytes
    expect(merged.size).toBe(53);

    const mergedBuffer = await blobToBuffer(merged);
    const view = new DataView(mergedBuffer);
    const bytes = new Uint8Array(mergedBuffer);

    // File size in header = total length - 8 = 45
    expect(view.getUint32(4, true)).toBe(45);
    // Data chunk length in header = 9
    expect(view.getUint32(40, true)).toBe(9);

    // Concatenated PCM bytes
    const pcmData = Array.from(bytes.slice(44));
    expect(pcmData).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90]);
  });

  it('throws error when merging empty list of blobs', async () => {
    await expect(mergeWavBlobs([])).rejects.toThrow('No audio blobs to merge');
  });

  it('throws error when encountering invalid WAV format', async () => {
    const invalidBlob = new Blob([new Uint8Array([1, 2, 3, 4, 5])], { type: 'audio/wav' });
    await expect(mergeWavBlobs([invalidBlob, invalidBlob])).rejects.toThrow('Invalid WAV format');
  });
});
