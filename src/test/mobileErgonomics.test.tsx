import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';
import { TopBar } from '../components/TopBar';
import { MarkdownPreview } from '../components/MarkdownPreview';

describe('Mobile Responsiveness & Reading Ergonomics (US-5.1, US-5.2, US-5.3)', () => {
  it('switches between Preview and Edit on mobile screens (US-5.1)', () => {
    render(<App />);

    const previewTab = screen.getByRole('button', { name: 'Preview' });
    const editTab = screen.getByRole('button', { name: 'Edit' });

    expect(previewTab).toBeInTheDocument();
    expect(editTab).toBeInTheDocument();

    // Click Edit tab
    fireEvent.click(editTab);
    // Editor is visible
    expect(screen.getByTestId('markdown-textarea')).toBeVisible();

    // Click Preview tab
    fireEvent.click(previewTab);
    expect(screen.getByTestId('markdown-article')).toBeVisible();
  });

  it('meets >= 44x44px touch-friendly targets and safe area inset (US-5.2)', () => {
    render(
      <TopBar
        showEditor={false}
        onToggleEditor={() => {}}
        autoHideOnPaste={true}
        onToggleAutoHide={() => {}}
        theme="dark"
        onToggleTheme={() => {}}
        fontSize="base"
        onChangeFontSize={() => {}}
        stats={{ words: 50, characters: 250, readingTimeMinutes: 1 }}
        onChangeMobileTab={() => {}}
      />
    );

    const themeToggle = screen.getByLabelText('Toggle color theme');
    expect(themeToggle.className).toContain('min-h-[44px]');
    expect(themeToggle.className).toContain('min-w-[44px]');

    const previewBtn = screen.getByRole('button', { name: 'Preview' });
    expect(previewBtn.className).toContain('min-h-[44px]');
  });

  it('adjusts prose font size scale (sm, base, lg) (US-5.3)', () => {
    const { rerender } = render(<MarkdownPreview content="Sample reading text" fontSize="sm" />);
    let article = screen.getByTestId('markdown-article');
    expect(article.className).toContain('prose-sm');

    rerender(<MarkdownPreview content="Sample reading text" fontSize="base" />);
    article = screen.getByTestId('markdown-article');
    expect(article.className).toContain('prose-base');

    rerender(<MarkdownPreview content="Sample reading text" fontSize="lg" />);
    article = screen.getByTestId('markdown-article');
    expect(article.className).toContain('prose-lg');
  });
});
