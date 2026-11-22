import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CodeBlock } from './CodeBlock';

describe('CodeBlock Component (US-2.2)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders language header and code content', () => {
    render(
      <CodeBlock language="typescript" codeString="const greeting = 'Hello';" />
    );

    expect(screen.getByText('typescript')).toBeInTheDocument();
    expect(screen.getByText("const greeting = 'Hello';")).toBeInTheDocument();
  });

  it('copies code to clipboard when Copy button is clicked and shows Copied feedback', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <CodeBlock language="python" codeString="print('hello world')" />
    );

    const copyBtn = screen.getByRole('button', { name: /copy code/i });
    expect(copyBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(writeTextMock).toHaveBeenCalledWith("print('hello world')");
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });
});
