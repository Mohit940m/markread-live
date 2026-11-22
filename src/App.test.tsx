import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from './App';

describe('App Component — Epics 1, 2, 3 Integration Tests', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.className = '';
    vi.restoreAllMocks();
  });

  it('renders application branding, default sample markdown, and reading stats', () => {
    render(<App />);
    expect(screen.getByText('MarkRead')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByText(/words/i)).toBeInTheDocument();
    expect(screen.getByText(/min read/i)).toBeInTheDocument();
    expect(screen.getByTestId('markdown-textarea')).toBeInTheDocument();
    expect(screen.getByTestId('markdown-article')).toBeInTheDocument();
  });

  it('toggles editor visibility when Show/Hide Code button is clicked (US-3.2)', () => {
    render(<App />);
    const toggleBtn = screen.getByRole('button', { name: /hide code/i });

    // Click to hide editor
    fireEvent.click(toggleBtn);
    expect(screen.getByRole('button', { name: /show code/i })).toBeInTheDocument();

    // Click again to show editor
    fireEvent.click(screen.getByRole('button', { name: /show code/i }));
    expect(screen.getByRole('button', { name: /hide code/i })).toBeInTheDocument();
  });

  it('toggles editor visibility via Ctrl+E keyboard shortcut (US-3.2)', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /hide code/i })).toBeInTheDocument();

    // Trigger Ctrl+E
    fireEvent.keyDown(window, { key: 'e', ctrlKey: true });
    expect(screen.getByRole('button', { name: /show code/i })).toBeInTheDocument();

    // Trigger Ctrl+E again
    fireEvent.keyDown(window, { key: 'e', ctrlKey: true });
    expect(screen.getByRole('button', { name: /hide code/i })).toBeInTheDocument();
  });

  it('auto-hides editor when long content is pasted (US-3.1)', async () => {
    vi.useFakeTimers();
    render(<App />);

    const textarea = screen.getByTestId('markdown-textarea');
    const pastedArticle = 'A very long markdown article exceeding 40 characters easily.\n\nSecond line.';

    act(() => {
      fireEvent.paste(textarea, {
        clipboardData: {
          getData: () => pastedArticle,
        },
      });
      vi.advanceTimersByTime(200);
    });

    // Editor should now show "Show Code" (meaning editor was collapsed)
    expect(screen.getByRole('button', { name: /show code/i })).toBeInTheDocument();
    // Toast status should be displayed
    expect(screen.getByRole('status')).toHaveTextContent(/code hidden/i);

    vi.useRealTimers();
  });

  it('toggles dark and light mode and applies CSS classes (US-3.3)', () => {
    render(<App />);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    const themeBtn = screen.getByRole('button', { name: /toggle color theme/i });
    fireEvent.click(themeBtn);

    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Click again to return to dark mode
    fireEvent.click(themeBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
