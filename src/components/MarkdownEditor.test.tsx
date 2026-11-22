import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MarkdownEditor } from './MarkdownEditor';
import { DEFAULT_SAMPLE_MARKDOWN } from '../utils/sampleMarkdown';

describe('MarkdownEditor Component (US-2.3)', () => {
  it('renders editor textarea with placeholder', () => {
    render(<MarkdownEditor value="" onChange={vi.fn()} />);
    const textarea = screen.getByTestId('markdown-textarea');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('placeholder', 'Type or paste Markdown here, or drop a .md file...');
    expect(textarea.className).toContain('h-full');
    expect(textarea.className).toContain('min-h-0');

    const container = screen.getByTestId('markdown-editor-container');
    expect(container.className).toContain('h-full');
    expect(container.className).toContain('w-full');
    expect(container.className).toContain('flex-1');
  });

  it('triggers onChange when user types in textarea', () => {
    const handleChange = vi.fn();
    render(<MarkdownEditor value="" onChange={handleChange} />);

    const textarea = screen.getByTestId('markdown-textarea');
    fireEvent.change(textarea, { target: { value: '# New Content' } });

    expect(handleChange).toHaveBeenCalledWith('# New Content');
  });

  it('loads sample markdown when Sample button is clicked', () => {
    const handleChange = vi.fn();
    render(<MarkdownEditor value="" onChange={handleChange} />);

    const sampleBtn = screen.getByRole('button', { name: /sample/i });
    fireEvent.click(sampleBtn);

    expect(handleChange).toHaveBeenCalledWith(DEFAULT_SAMPLE_MARKDOWN);
  });

  it('clears editor when Clear button is clicked', () => {
    const handleChange = vi.fn();
    render(<MarkdownEditor value="Some text" onChange={handleChange} />);

    const clearBtn = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearBtn);

    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('invokes onPasteMarkdown callback when content is pasted into textarea', () => {
    const handlePaste = vi.fn();
    render(
      <MarkdownEditor
        value=""
        onChange={vi.fn()}
        onPasteMarkdown={handlePaste}
      />
    );

    const textarea = screen.getByTestId('markdown-textarea');
    fireEvent.paste(textarea, {
      clipboardData: {
        getData: () => 'Pasted Markdown Content',
      },
    });

    expect(handlePaste).toHaveBeenCalledWith('Pasted Markdown Content');
  });

  it('handles drag over and drop of markdown file', async () => {
    const handleChange = vi.fn();
    const handleFileLoaded = vi.fn();

    render(
      <MarkdownEditor
        value=""
        onChange={handleChange}
        onFileLoaded={handleFileLoaded}
      />
    );

    const container = screen.getByTestId('markdown-editor-container');

    // Drag over activates dragging overlay
    fireEvent.dragOver(container);
    expect(screen.getByText('Drop your Markdown file here')).toBeInTheDocument();

    // Drag leave removes overlay
    fireEvent.dragLeave(container);
    expect(screen.queryByText('Drop your Markdown file here')).not.toBeInTheDocument();

    // Drop file
    const file = new File(['# File Content from Drop'], 'test.md', { type: 'text/markdown' });
    fireEvent.drop(container, {
      dataTransfer: {
        files: [file],
      },
    });

    // FileReader is async, wait for read
    await vi.waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith('# File Content from Drop');
      expect(handleFileLoaded).toHaveBeenCalledWith('test.md', '# File Content from Drop');
    });
  });
});
