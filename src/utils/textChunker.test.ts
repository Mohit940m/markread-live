import { describe, it, expect } from 'vitest';
import {
  chunkTextIntoSentences,
  extractSpeechChunksFromElement,
} from './textChunker';

describe('Text Chunker Utility (US-4.1)', () => {
  it('returns empty array for empty or whitespace text', () => {
    expect(chunkTextIntoSentences('')).toEqual([]);
    expect(chunkTextIntoSentences('   \n  ')).toEqual([]);
  });

  it('splits simple text by sentence boundaries', () => {
    const text = 'First sentence. Second sentence! Third question?';
    const chunks = chunkTextIntoSentences(text);

    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toBe('First sentence.');
    expect(chunks[1]).toBe('Second sentence!');
    expect(chunks[2]).toBe('Third question?');
  });

  it('ensures no chunk exceeds maxChars (Chrome 15-second stall prevention)', () => {
    const longSentence =
      'This is a remarkably long sentence that goes on and on without any period for quite some time, ' +
      'containing various clauses and commas, designed explicitly to test whether the text chunker splits ' +
      'clauses so that Chrome never stalls on a single long speech utterance.';

    const chunks = chunkTextIntoSentences(longSentence, 100);

    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(100);
    }
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('extracts speech chunks from HTML DOM elements while skipping code blocks and buttons', () => {
    const div = document.createElement('div');
    div.innerHTML = `
      <h1>Main Title</h1>
      <p>Introductory paragraph with clean text.</p>
      <pre><code>const codeShouldBeSkipped = true;</code></pre>
      <button>Button to skip</button>
      <blockquote>Inspiring quote.</blockquote>
    `;

    const chunks = extractSpeechChunksFromElement(div, { skipCodeBlocks: true });

    expect(chunks.length).toBe(3);
    expect(chunks[0].text).toBe('Main Title');
    expect(chunks[1].text).toBe('Introductory paragraph with clean text.');
    expect(chunks[2].text).toBe('Inspiring quote.');

    // Pre/code and buttons were completely skipped
    const allText = chunks.map((c) => c.text).join(' ');
    expect(allText).not.toContain('codeShouldBeSkipped');
    expect(allText).not.toContain('Button to skip');
  });
});
