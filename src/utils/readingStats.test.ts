import { describe, it, expect } from 'vitest';
import { calculateReadingStats } from './readingStats';

describe('calculateReadingStats (US-3.4)', () => {
  it('returns 0 words and 0 reading time for empty content', () => {
    const stats = calculateReadingStats('');
    expect(stats.words).toBe(0);
    expect(stats.characters).toBe(0);
    expect(stats.readingTimeMinutes).toBe(0);
  });

  it('accurately counts words and estimates reading time for markdown text', () => {
    const markdown = `# Heading

This is a clean markdown sentence with some words to calculate reading time.

- Item one
- Item two
`;
    const stats = calculateReadingStats(markdown);
    expect(stats.words).toBeGreaterThan(10);
    expect(stats.readingTimeMinutes).toBe(1);
  });

  it('scales reading time appropriately for long text (200 words/min)', () => {
    const longText = new Array(450).fill('word').join(' ');
    const stats = calculateReadingStats(longText);
    expect(stats.words).toBe(450);
    expect(stats.readingTimeMinutes).toBe(3); // ceil(450 / 200) = 3
  });
});
