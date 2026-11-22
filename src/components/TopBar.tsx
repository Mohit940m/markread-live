import { FC } from 'react';
import {
  Code2,
  Eye,
  Sun,
  Moon,
  Type,
  Copy,
  Download,
  Sparkles,
} from 'lucide-react';
import { ReadingStats } from '../utils/readingStats';

interface TopBarProps {
  showEditor: boolean;
  onToggleEditor: () => void;
  autoHideOnPaste: boolean;
  onToggleAutoHide: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  fontSize: 'sm' | 'base' | 'lg';
  onChangeFontSize: (size: 'sm' | 'base' | 'lg') => void;
  stats: ReadingStats;
  onCopyMarkdown?: () => void;
  onDownloadMarkdown?: () => void;
  activeMobileTab?: 'preview' | 'editor';
  onChangeMobileTab?: (tab: 'preview' | 'editor') => void;
}

export const TopBar: FC<TopBarProps> = ({
  showEditor,
  onToggleEditor,
  autoHideOnPaste,
  onToggleAutoHide,
  theme,
  onToggleTheme,
  fontSize,
  onChangeFontSize,
  stats,
  onCopyMarkdown,
  onDownloadMarkdown,
  activeMobileTab = 'preview',
  onChangeMobileTab,
}) => {
  const nextFontSize: Record<'sm' | 'base' | 'lg', 'sm' | 'base' | 'lg'> = {
    sm: 'base',
    base: 'lg',
    lg: 'sm',
  };

  return (
    <header className="h-14 bg-surface border-b border-borderSubtle px-3 md:px-5 flex items-center justify-between gap-2 select-none sticky top-0 z-30">
      {/* Brand & Mobile View Toggle */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-bold tracking-tight text-textPrimary text-base md:text-lg">
          <span className="text-accent">MarkRead</span>
          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-accent/15 text-accent font-semibold uppercase">
            Live
          </span>
        </div>

        {/* Mobile View Switcher (< 768px) */}
        {onChangeMobileTab && (
          <div className="flex md:hidden bg-elevated p-0.5 rounded-lg border border-borderSubtle text-xs">
            <button
              type="button"
              onClick={() => onChangeMobileTab('preview')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                activeMobileTab === 'preview'
                  ? 'bg-surface text-accent shadow-sm'
                  : 'text-textMuted hover:text-textPrimary'
              }`}
            >
              Preview
            </button>
            <button
              type="button"
              onClick={() => onChangeMobileTab('editor')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                activeMobileTab === 'editor'
                  ? 'bg-surface text-accent shadow-sm'
                  : 'text-textMuted hover:text-textPrimary'
              }`}
            >
              Edit
            </button>
          </div>
        )}

        {/* Live Word Count & Reading Time Stats */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-textMuted pl-2 border-l border-borderSubtle">
          <span>{stats.words} words</span>
          <span>•</span>
          <span>~{stats.readingTimeMinutes} min read</span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Auto-Hide Toggle Badge */}
        <button
          type="button"
          onClick={onToggleAutoHide}
          title={
            autoHideOnPaste
              ? 'Auto-hide editor on paste is enabled (click to disable)'
              : 'Auto-hide editor on paste is disabled (click to enable)'
          }
          className={`hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            autoHideOnPaste
              ? 'border-accent/40 bg-accent/10 text-accent'
              : 'border-borderSubtle bg-elevated/50 text-textMuted hover:text-textPrimary'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Auto-Hide: {autoHideOnPaste ? 'ON' : 'OFF'}</span>
        </button>

        {/* Desktop Show / Hide Code Button (Ctrl+E) */}
        <button
          type="button"
          onClick={onToggleEditor}
          title={`${showEditor ? 'Hide Code' : 'Show Code'} (Ctrl+E)`}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-elevated hover:bg-borderSubtle text-textPrimary border border-borderSubtle transition-colors shadow-sm"
        >
          {showEditor ? (
            <>
              <Eye className="w-4 h-4 text-accent" />
              <span>Hide Code</span>
            </>
          ) : (
            <>
              <Code2 className="w-4 h-4 text-textMuted" />
              <span>Show Code</span>
            </>
          )}
          <kbd className="hidden xl:inline text-[10px] px-1 py-0.5 rounded bg-surface border border-borderSubtle text-textMuted">
            Ctrl+E
          </kbd>
        </button>

        {/* Font Size Adjuster Cycle (sm -> base -> lg) */}
        <button
          type="button"
          onClick={() => onChangeFontSize(nextFontSize[fontSize])}
          title={`Adjust reading font size (Current: ${fontSize.toUpperCase()})`}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-elevated hover:bg-borderSubtle text-textPrimary border border-borderSubtle transition-colors"
        >
          <Type className="w-3.5 h-3.5 text-textMuted" />
          <span className="uppercase text-[11px] font-mono">{fontSize}</span>
        </button>

        {/* Copy Markdown */}
        {onCopyMarkdown && (
          <button
            type="button"
            onClick={onCopyMarkdown}
            title="Copy raw Markdown to clipboard"
            className="hidden sm:flex p-2 rounded-lg bg-elevated hover:bg-borderSubtle text-textMuted hover:text-textPrimary border border-borderSubtle transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
        )}

        {/* Download .md */}
        {onDownloadMarkdown && (
          <button
            type="button"
            onClick={onDownloadMarkdown}
            title="Download as .md file"
            className="hidden sm:flex p-2 rounded-lg bg-elevated hover:bg-borderSubtle text-textMuted hover:text-textPrimary border border-borderSubtle transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        {/* Dark / Light Mode Toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          className="p-2 rounded-lg bg-elevated hover:bg-borderSubtle text-textPrimary border border-borderSubtle transition-colors"
          aria-label="Toggle color theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-300" />
          ) : (
            <Moon className="w-4 h-4 text-sky-600" />
          )}
        </button>
      </div>
    </header>
  );
};
