import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MarkdownPreview } from '../components/MarkdownPreview';

describe('Native Browser Right-Click & Selection Fidelity (US-2.4)', () => {
  it('does NOT preventDefault on contextmenu event in the preview article', () => {
    const md = `## Test Heading

Paragraph text for reading aloud.`;
    render(<MarkdownPreview content={md} />);

    const article = screen.getByTestId('markdown-article');
    const paragraph = screen.getByText('Paragraph text for reading aloud.');

    const contextMenuEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
    });

    paragraph.dispatchEvent(contextMenuEvent);

    // Verify context menu is NOT prevented, preserving Chrome's native context menu
    expect(contextMenuEvent.defaultPrevented).toBe(false);

    // Also verify on article container
    const articleContextMenuEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
    });
    article.dispatchEvent(articleContextMenuEvent);
    expect(articleContextMenuEvent.defaultPrevented).toBe(false);
  });

  it('renders standard semantic elements without canvas or iframe', () => {
    const md = `# Heading 1

Some body text.

> Quote

\`\`\`js
code();
\`\`\``;
    const { container } = render(<MarkdownPreview content={md} />);

    // Must not use canvas or iframe
    expect(container.querySelector('canvas')).toBeNull();
    expect(container.querySelector('iframe')).toBeNull();

    // Must use semantic article
    expect(container.querySelector('article')).toBeInTheDocument();
    expect(container.querySelector('h1')).toBeInTheDocument();
    expect(container.querySelector('p')).toBeInTheDocument();
    expect(container.querySelector('blockquote')).toBeInTheDocument();
  });

  it('allows text selection without user-select none blocking', () => {
    render(<MarkdownPreview content="Selectable reading content" />);
    const article = screen.getByTestId('markdown-article');

    // Ensure user-select is not disabled
    expect(article.className).not.toContain('select-none');
  });
});
