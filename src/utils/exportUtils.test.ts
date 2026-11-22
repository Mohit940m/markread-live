import { describe, it, expect, vi, beforeEach } from 'vitest';
import { copyToClipboard, downloadMarkdownFile } from './exportUtils';

describe('Export and Copy Utilities (US-6.2)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('copies text via navigator.clipboard.writeText', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const success = await copyToClipboard('# Header Text');
    expect(success).toBe(true);
    expect(writeTextMock).toHaveBeenCalledWith('# Header Text');
  });

  it('triggers browser download link using Blob for markdown content', () => {
    const createObjectURLMock = vi.fn().mockReturnValue('blob:http://localhost/sample-blob');
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadMarkdownFile('# Download Sample', 'my-notes.md');

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:http://localhost/sample-blob');
  });
});
