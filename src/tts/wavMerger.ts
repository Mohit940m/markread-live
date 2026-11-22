/**
 * Utility for concatenating multiple WAV audio blobs client-side.
 * Parses RIFF/WAVE headers, strips headers from subsequent chunks,
 * recalculates total file and data chunk sizes, and outputs a single merged .wav Blob.
 */

interface WavDataSlice {
  header: Uint8Array;
  dataOffset: number;
  dataSizeOffset: number;
  pcmData: Uint8Array;
}

async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') {
    return await blob.arrayBuffer();
  }
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error || new Error('Failed to read blob'));
    reader.readAsArrayBuffer(blob);
  });
}

function parseWav(buffer: ArrayBuffer): WavDataSlice {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  if (buffer.byteLength < 12) {
    throw new Error('Invalid WAV format: Buffer too short');
  }

  // Validate RIFF header
  const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));

  if (riff !== 'RIFF' || wave !== 'WAVE') {
    throw new Error('Invalid WAV format: Missing RIFF/WAVE identifier');
  }

  let offset = 12;
  let dataOffset = -1;
  let dataSizeOffset = -1;
  let dataLength = 0;

  while (offset + 8 <= buffer.byteLength) {
    const chunkId = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3)
    );
    const chunkSize = view.getUint32(offset + 4, true);

    if (chunkId === 'data') {
      dataSizeOffset = offset + 4;
      dataOffset = offset + 8;
      dataLength = Math.min(chunkSize, buffer.byteLength - dataOffset);
      break;
    }

    // Skip to next chunk
    offset += 8 + chunkSize;
  }

  if (dataOffset === -1 || dataSizeOffset === -1) {
    throw new Error('Invalid WAV format: data chunk not found');
  }

  const header = bytes.slice(0, dataOffset);
  const pcmData = bytes.slice(dataOffset, dataOffset + dataLength);

  return {
    header,
    dataOffset,
    dataSizeOffset,
    pcmData,
  };
}

/**
 * Merges multiple WAV Blobs into a single continuous WAV Blob.
 */
export async function mergeWavBlobs(blobs: Blob[]): Promise<Blob> {
  if (blobs.length === 0) {
    throw new Error('No audio blobs to merge');
  }

  if (blobs.length === 1) {
    return blobs[0];
  }

  const arrayBuffers = await Promise.all(blobs.map((b) => blobToArrayBuffer(b)));
  const parsedChunks = arrayBuffers.map((ab) => parseWav(ab));

  const first = parsedChunks[0];
  const totalPcmLength = parsedChunks.reduce((sum, chunk) => sum + chunk.pcmData.length, 0);
  const totalBufferLength = first.header.length + totalPcmLength;

  const mergedBuffer = new Uint8Array(totalBufferLength);
  const view = new DataView(mergedBuffer.buffer);

  // Copy base header from the first chunk
  mergedBuffer.set(first.header, 0);

  // Update RIFF total size: totalBufferLength - 8
  view.setUint32(4, totalBufferLength - 8, true);

  // Update data chunk size in header
  view.setUint32(first.dataSizeOffset, totalPcmLength, true);

  // Concat all PCM samples
  let currentOffset = first.header.length;
  for (const chunk of parsedChunks) {
    mergedBuffer.set(chunk.pcmData, currentOffset);
    currentOffset += chunk.pcmData.length;
  }

  return new Blob([mergedBuffer], { type: 'audio/wav' });
}
