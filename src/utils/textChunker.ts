export interface SpeechChunk {
  index: number;
  text: string;
  blockIndex?: number;
}

export interface ChunkOptions {
  maxChars?: number;
  skipCodeBlocks?: boolean;
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
 * Skips code blocks, SVGs, buttons, and decorative elements.
 */
export function extractSpeechChunksFromElement(
  container: HTMLElement,
  options: ChunkOptions = {}
): SpeechChunk[] {
  const { maxChars = 220, skipCodeBlocks = true } = options;
  const chunks: SpeechChunk[] = [];
  let chunkCounter = 0;

  // Query speakable semantic block elements in document order
  const blockSelectors = 'h1, h2, h3, h4, h5, h6, p, li, blockquote';
  const elements = Array.from(container.querySelectorAll(blockSelectors));

  elements.forEach((el, blockIndex) => {
    // If inside a pre/code or not-prose block and skipCodeBlocks is true, skip
    if (skipCodeBlocks && (el.closest('pre') || el.closest('code') || el.closest('.not-prose'))) {
      return;
    }

    // Skip buttons, svg, or aria-hidden elements
    if (el.closest('button') || el.closest('svg') || el.getAttribute('aria-hidden') === 'true') {
      return;
    }

    // Clean text
    const textContent = el.textContent?.replace(/\s+/g, ' ').trim() || '';
    if (!textContent) return;

    // Tag element with data attribute for active block highlighting
    el.setAttribute('data-block-index', String(blockIndex));

    const sentenceList = chunkTextIntoSentences(textContent, maxChars);
    sentenceList.forEach((sentence) => {
      chunks.push({
        index: chunkCounter++,
        text: sentence,
        blockIndex,
      });
    });
  });

  return chunks;
}
