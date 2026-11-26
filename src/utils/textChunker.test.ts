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

  it('extracts nested list items without duplicating sub-parts into parent items (Issue 8)', () => {
    const div = document.createElement('div');
    div.innerHTML = `
      <ol>
        <li>
          <strong>1st main point</strong> with <code>inline()</code>
          <ul>
            <li>Sub-part A</li>
            <li>Sub-part B</li>
          </ul>
        </li>
        <li>2nd main point</li>
      </ol>
    `;

    const chunks = extractSpeechChunksFromElement(div);

    expect(chunks.map((c) => c.text)).toEqual([
      '1st main point with inline()',
      'Sub-part A',
      'Sub-part B',
      '2nd main point',
    ]);
    expect(chunks.map((c) => c.blockIndex)).toEqual([0, 1, 2, 3]);

    const tagged = Array.from(div.querySelectorAll('[data-block-index]'));
    expect(tagged).toHaveLength(4);
  });

  it('prevents duplication in loose lists, blockquotes with p tags, and nested code blocks (Issue 8)', () => {
    const div = document.createElement('div');
    div.innerHTML = `
      <ul>
        <li>
          <p>Loose main point</p>
          <div class="not-prose"><code>const skipped = 1;</code></div>
          <ul>
            <li><p>Nested sub-point 1</p></li>
            <li><p>Nested sub-point 2</p></li>
          </ul>
        </li>
      </ul>
      <blockquote>
        <p>Quoted sentence inside p.</p>
      </blockquote>
    `;

    const chunks = extractSpeechChunksFromElement(div, { skipCodeBlocks: true });

    expect(chunks.map((c) => c.text)).toEqual([
      'Loose main point',
      'Nested sub-point 1',
      'Nested sub-point 2',
      'Quoted sentence inside p.',
    ]);

    // Empty container wrappers (outer/inner <li> and <blockquote>) should not retain block tags
    expect(div.querySelector('blockquote')?.getAttribute('data-block-index')).toBeNull();
    expect(div.querySelector('li')?.getAttribute('data-block-index')).toBeNull();
  });

  it('clears stale data-block-index attributes when re-extracting on updated DOM', () => {
    const div = document.createElement('div');
    const wrapper = document.createElement('blockquote');
    wrapper.setAttribute('data-block-index', '99');
    const p = document.createElement('p');
    p.textContent = 'Inner paragraph';
    wrapper.appendChild(p);
    div.appendChild(wrapper);

    const chunks = extractSpeechChunksFromElement(div);
    expect(chunks).toHaveLength(1);
    expect(wrapper.getAttribute('data-block-index')).toBeNull();
    expect(p.getAttribute('data-block-index')).toBe('0');
  });
});
