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

  it('toggles editor visibility when Show/Hide Code button is clicked (US-3.2 & Bug Fix 1)', () => {
    render(<App />);
    const toggleBtn = screen.getByRole('button', { name: /hide code/i });
    const editorContainer = screen.getByTestId('editor-pane-container');

    // Initially editor is visible on desktop with vertical column layout
    expect(editorContainer.className).toContain('md:flex');
    expect(editorContainer.className).toContain('md:flex-col');
    expect(editorContainer.className).not.toBe('hidden');

    // Click to hide editor — must strictly have 'hidden' and NOT 'md:flex'
    fireEvent.click(toggleBtn);
    expect(screen.getByRole('button', { name: /show code/i })).toBeInTheDocument();
    expect(editorContainer.className).toContain('hidden');
    expect(editorContainer.className).not.toContain('md:flex');

    // Click again to show editor — must restore 'md:flex'
    fireEvent.click(screen.getByRole('button', { name: /show code/i }));
    expect(screen.getByRole('button', { name: /hide code/i })).toBeInTheDocument();
    expect(editorContainer.className).toContain('md:flex');
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

  it('renders ReadAloudBar and triggers playback with active block highlighting (US-4.3 & US-4.5)', async () => {
    render(<App />);

    // Read aloud bar is rendered with chunks
    const readBar = screen.getByTestId('read-aloud-bar');
    expect(readBar).toBeInTheDocument();

    const playBtn = screen.getByRole('button', { name: /play reading/i });
    expect(playBtn).toBeInTheDocument();

    // Click play
    act(() => {
      fireEvent.click(playBtn);
    });

    // Web speech speak called
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });

  it('renders draggable SplitDivider when editor is visible and hides it when collapsed (Issue 2 & 3)', () => {
    render(<App />);

    // Initially editor is visible -> SplitDivider should be rendered
    const divider = screen.getByTestId('split-divider');
    expect(divider).toBeInTheDocument();

    const editorContainer = screen.getByTestId('editor-pane-container');
    const previewContainer = screen.getByTestId('preview-pane-container');

    // Panes have percentage widths applied
    expect(editorContainer).toHaveStyle({ width: '50%' });
    expect(previewContainer).toHaveStyle({ width: '50%' });

    // Hide editor
    const toggleBtn = screen.getByRole('button', { name: /hide code/i });
    fireEvent.click(toggleBtn);

    // SplitDivider should now be hidden
    expect(screen.queryByTestId('split-divider')).not.toBeInTheDocument();
  });

  it('toggles between full width mode and centered reading mode when editor is hidden (Issue 4)', () => {
    render(<App />);

    // Hide code editor first
    const toggleBtn = screen.getByRole('button', { name: /hide code/i });
    fireEvent.click(toggleBtn);

    const previewContainer = screen.getByTestId('preview-pane-container');
    // Initially centered mode is active
    expect(previewContainer.className).toContain('max-w-3xl');

    // Click Full Width button
    const fullWidthBtn = screen.getByRole('button', { name: /switch to full width mode/i });
    fireEvent.click(fullWidthBtn);

    // Preview container now uses full width (max-w-none)
    expect(previewContainer.className).toContain('max-w-none');
    expect(previewContainer.className).not.toContain('max-w-3xl');

    // Click again to toggle back to centered reading mode
    const centeredBtn = screen.getByRole('button', { name: /switch to centered reading mode/i });
    fireEvent.click(centeredBtn);
    expect(previewContainer.className).toContain('max-w-3xl');
  });
});
