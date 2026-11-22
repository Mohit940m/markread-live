import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TopBar } from './TopBar';

describe('TopBar Component (US-3.2, US-3.3, US-3.4)', () => {
  const defaultProps = {
    showEditor: true,
    onToggleEditor: vi.fn(),
    autoHideOnPaste: true,
    onToggleAutoHide: vi.fn(),
    theme: 'dark' as const,
    onToggleTheme: vi.fn(),
    fontSize: 'base' as const,
    onChangeFontSize: vi.fn(),
    stats: { words: 120, characters: 600, readingTimeMinutes: 1 },
  };

  it('renders branding and reading stats', () => {
    render(<TopBar {...defaultProps} />);
    expect(screen.getByText('MarkRead')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByText('120 words')).toBeInTheDocument();
    expect(screen.getByText('~1 min read')).toBeInTheDocument();
  });

  it('triggers onToggleEditor when Show/Hide Code button is clicked', () => {
    const handleToggle = vi.fn();
    render(<TopBar {...defaultProps} onToggleEditor={handleToggle} showEditor={true} />);

    const button = screen.getByRole('button', { name: /hide code/i });
    fireEvent.click(button);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it('triggers onToggleAutoHide when Auto-Hide badge is clicked', () => {
    const handleToggle = vi.fn();
    render(<TopBar {...defaultProps} onToggleAutoHide={handleToggle} autoHideOnPaste={true} />);

    const badge = screen.getByRole('button', { name: /auto-hide: on/i });
    fireEvent.click(badge);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it('triggers onToggleTheme when theme toggle is clicked', () => {
    const handleToggle = vi.fn();
    render(<TopBar {...defaultProps} onToggleTheme={handleToggle} />);

    const themeBtn = screen.getByRole('button', { name: /toggle color theme/i });
    fireEvent.click(themeBtn);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it('cycles font size when font size button is clicked', () => {
    const handleChangeSize = vi.fn();
    render(<TopBar {...defaultProps} fontSize="base" onChangeFontSize={handleChangeSize} />);

    const fontBtn = screen.getByTitle(/adjust reading font size/i);
    fireEvent.click(fontBtn);
    expect(handleChangeSize).toHaveBeenCalledWith('lg');
  });

  it('triggers onToggleFullWidth when Full Width button is clicked (Issue 4)', () => {
    const handleToggle = vi.fn();
    render(
      <TopBar
        {...defaultProps}
        fullWidth={false}
        onToggleFullWidth={handleToggle}
      />
    );

    const fullWidthBtn = screen.getByRole('button', { name: /switch to full width mode/i });
    expect(fullWidthBtn).toBeInTheDocument();
    fireEvent.click(fullWidthBtn);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });
});
