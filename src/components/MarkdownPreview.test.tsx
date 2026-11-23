import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MarkdownPreview } from './MarkdownPreview';

describe('MarkdownPreview Component (US-2.1)', () => {
  it('renders semantic article tag for DOM fidelity', () => {
    render(<MarkdownPreview content="# Hello World" />);
    const article = screen.getByTestId('markdown-article');
    expect(article.tagName.toLowerCase()).toBe('article');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hello World');
  });

  it('renders GitHub Flavored Markdown (tables, checklists, strikethrough)', () => {
    const markdown = `
| Header 1 | Header 2 |
| :--- | :--- |
| Cell 1 | Cell 2 |

- [x] Completed task
- [ ] Incomplete task

~~strikethrough~~
    `;

    render(<MarkdownPreview content={markdown} />);

    // Table elements
    expect(screen.getByText('Header 1')).toBeInTheDocument();
    expect(screen.getByText('Cell 1')).toBeInTheDocument();

    // Task list items
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(2);
    expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
    expect((checkboxes[1] as HTMLInputElement).checked).toBe(false);

    // Strikethrough
    expect(screen.getByText('strikethrough')).toBeInTheDocument();
  });

  it('renders external links with target="_blank" and rel="noopener noreferrer"', () => {
    const markdown = '[Open Docs](https://antigravity.google)';
    render(<MarkdownPreview content={markdown} />);

    const link = screen.getByRole('link', { name: 'Open Docs' });
    expect(link).toHaveAttribute('href', 'https://antigravity.google');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('wraps tables in horizontal overflow container for mobile responsiveness', () => {
    const markdown = '| Column A | Column B |\n| --- | --- |\n| 1 | 2 |';
    const { container } = render(<MarkdownPreview content={markdown} />);

    const tableContainer = container.querySelector('.overflow-x-auto');
    expect(tableContainer).toBeInTheDocument();
  });

  it('renders fenced code blocks with language and copy button', () => {
    const markdown = '```js\nconsole.log("hello world");\n```';
    render(<MarkdownPreview content={markdown} />);

    expect(screen.getByText('js')).toBeInTheDocument();
    expect(screen.getByText(/hello world/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy code/i })).toBeInTheDocument();
  });
});
