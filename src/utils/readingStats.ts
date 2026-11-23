export interface ReadingStats {
  words: number;
  characters: number;
  readingTimeMinutes: number;
}

/**
 * Calculates live word count and estimated reading time based on 200 words per minute average.
 */
export function calculateReadingStats(content: string): ReadingStats {
  if (!content || !content.trim()) {
    return {
      words: 0,
      characters: 0,
      readingTimeMinutes: 0,
    };
  }

  // Strip Markdown syntax symbols to count actual prose words accurately
  const cleanText = content
    .replace(/```[\s\S]*?```/g, ' ') // remove code blocks
    .replace(/`.*?`/g, ' ') // remove inline code
    .replace(/!\[.*?\]\(.*?\)/g, ' ') // remove images
    .replace(/\[.*?\]\(.*?\)/g, ' ') // remove links
    .replace(/[#*`_~>\-+=|[\]]/g, ' ') // remove Markdown punctuation
    .trim();

  const wordsArray = cleanText.match(/\b\w+\b/g) || [];
  const words = wordsArray.length;
  const characters = content.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

  return {
    words,
    characters,
    readingTimeMinutes: words === 0 ? 0 : readingTimeMinutes,
  };
}
