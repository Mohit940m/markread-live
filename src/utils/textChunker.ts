export interface SpeechChunk {
  index: number;
  text: string;
  blockIndex?: number;
}

export interface ChunkOptions {
  maxChars?: number;
  skipCodeBlocks?: boolean;
}

const SPEAKABLE_BLOCK_SELECTOR = 'h1, h2, h3, h4, h5, h6, p, li, blockquote';

const NESTED_BLOCK_OR_SKIP_TAGS = new Set([
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'P',
  'LI',
  'UL',
  'OL',
  'BLOCKQUOTE',
  'PRE',
  'BUTTON',
  'SVG',
  'SCRIPT',
  'STYLE',
]);

/**
 * Extracts only the direct inline text belonging to `root`, stopping recursion
 * at nested block/list containers (ul, ol, li, p, blockquote, headings) and
 * skipped elements (pre, .not-prose, button, svg, aria-hidden) so sub-parts
 * are never concatenated into parent blocks and repeated during playback.
 */
function extractDirectBlockText(root: Element, skipCodeBlocks: boolean): string {
  const parts: string[] = [];

  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        if (child.textContent) {
          parts.push(child.textContent);
        }
        continue;
      }

      if (child.nodeType !== Node.ELEMENT_NODE) {
        continue;
      }

      const el = child as Element;

      if (el.tagName === 'BR') {
        parts.push(' ');
        continue;
      }

      if (NESTED_BLOCK_OR_SKIP_TAGS.has(el.tagName)) {
        continue;
      }

      if (el.getAttribute('aria-hidden') === 'true') {
        continue;
      }

      if (skipCodeBlocks && el.classList?.contains('not-prose')) {
        continue;
      }

      walk(el);
    }
  };

  walk(root);
  return parts.join('').replace(/\s+/g, ' ').trim();
}

/**
 * Splits a long text string into clean sentences <= maxChars (default 220).
 * Preserves sentence boundaries (. ! ?) and splits cleanly on clauses or spaces
 * if a single sentence exceeds the threshold, preventing Chrome's 15-second TTS stall bug.
 */
export function chunkTextIntoSentences(
  text: string,
  maxChars = 220
): string[] {
  if (!text || !text.trim()) return [];

  // Match sentences ending in punctuation or end of string
  const rawSentences = text.match(/[^.!?\n]+[.!?]+|[^.!?\n]+$/g) || [text];
  const result: string[] = [];

  for (const raw of rawSentences) {
    const trimmed = raw.replace(/\s+/g, ' ').trim();
    if (!trimmed) continue;

    if (trimmed.length <= maxChars) {
      result.push(trimmed);
    } else {
      // Sentence exceeds maxChars — split by clause boundaries (comma, semicolon, dash) or words
      const subParts = trimmed.match(/[^,;:—]+[,;:—]+|[^,;:—]+$/g) || [trimmed];
      let currentSub = '';

      for (const part of subParts) {
        const subTrimmed = part.trim();
        if (!subTrimmed) continue;

        if ((currentSub + ' ' + subTrimmed).trim().length <= maxChars) {
          currentSub = (currentSub + ' ' + subTrimmed).trim();
        } else {
          if (currentSub) {
            result.push(currentSub);
            currentSub = '';
          }

          if (subTrimmed.length <= maxChars) {
            currentSub = subTrimmed;
          } else {
            // Very long uninterrupted word string: hard wrap by words
            const words = subTrimmed.split(' ');
            let wordBuf = '';
            for (const w of words) {
              if ((wordBuf + ' ' + w).trim().length <= maxChars) {
                wordBuf = (wordBuf + ' ' + w).trim();
              } else {
                if (wordBuf) result.push(wordBuf);
                wordBuf = w;
              }
            }
            if (wordBuf) result.push(wordBuf);
          }
        }
      }

      if (currentSub) {
        result.push(currentSub);
      }
    }
  }

  return result;
}

/**
 * Extracts speakable chunks from a DOM container (e.g. rendered <article>).
 * Skips code blocks, SVGs, buttons, decorative elements, and prevents
 * parent containers from duplicating text of nested blocks/sub-lists.
 */
export function extractSpeechChunksFromElement(
  container: HTMLElement,
  options: ChunkOptions = {}
): SpeechChunk[] {
  const { maxChars = 220, skipCodeBlocks = true } = options;
  const chunks: SpeechChunk[] = [];
  let chunkCounter = 0;
  let blockCounter = 0;

  // Clear stale block tags before re-indexing active speakable blocks
  container.querySelectorAll('[data-block-index]').forEach((el) => {
    el.removeAttribute('data-block-index');
  });

  // Query speakable semantic block elements in document order
  const elements = Array.from(container.querySelectorAll(SPEAKABLE_BLOCK_SELECTOR));

  elements.forEach((el) => {
    // If inside a pre/code or not-prose block and skipCodeBlocks is true, skip
    if (skipCodeBlocks && (el.closest('pre') || el.closest('code') || el.closest('.not-prose'))) {
      return;
    }

    // Skip buttons, svg, or aria-hidden elements
    if (el.closest('button') || el.closest('svg') || el.getAttribute('aria-hidden') === 'true') {
      return;
    }

    // Extract only this block's direct text (excluding nested sub-lists/paragraphs)
    const textContent = extractDirectBlockText(el, skipCodeBlocks);
    if (!textContent) return;

    const currentBlockIndex = blockCounter++;
    // Tag element with data attribute for active block highlighting & click-to-read
    el.setAttribute('data-block-index', String(currentBlockIndex));

    const sentenceList = chunkTextIntoSentences(textContent, maxChars);
    sentenceList.forEach((sentence) => {
      chunks.push({
        index: chunkCounter++,
        text: sentence,
        blockIndex: currentBlockIndex,
      });
    });
  });

  return chunks;
}
