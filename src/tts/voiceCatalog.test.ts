import { describe, it, expect } from 'vitest';
import {
  CURATED_PIPER_VOICES,
  getCuratedPiperVoices,
  findPiperVoice,
} from './voiceCatalog';

describe('Voice Catalog (NV-2.3)', () => {
  it('provides a curated list of high quality English and lightweight voices', () => {
    const voices = getCuratedPiperVoices();
    expect(voices.length).toBeGreaterThanOrEqual(6);

    const lessac = findPiperVoice('en_US-lessac-medium');
    expect(lessac).toBeDefined();
    expect(lessac?.engine).toBe('piper');
    expect(lessac?.tier).toBe(2);
    expect(lessac?.quality).toBe('natural');
    expect(lessac?.downloadSizeMB).toBeGreaterThan(0);
  });

  it('includes lightweight models optimized for mobile/low-RAM devices', () => {
    const lightweight = CURATED_PIPER_VOICES.filter((v) => v.isLightweight);
    expect(lightweight.length).toBeGreaterThanOrEqual(2);
    for (const v of lightweight) {
      expect(v.downloadSizeMB).toBeLessThanOrEqual(20);
    }
  });
});
