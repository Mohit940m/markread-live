import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { TopBar } from './components/TopBar';
import { MarkdownEditor } from './components/MarkdownEditor';
import { MarkdownPreview } from './components/MarkdownPreview';
import { calculateReadingStats } from './utils/readingStats';
import { DEFAULT_SAMPLE_MARKDOWN } from './utils/sampleMarkdown';
import { Eye } from 'lucide-react';

export default function App() {
  const [content, setContent] = useLocalStorage<string>(
    'markread_content',
    DEFAULT_SAMPLE_MARKDOWN
  );
  const [theme, setTheme] = useLocalStorage<'dark' | 'light'>('markread_theme', 'dark');
  const [autoHideOnPaste, setAutoHideOnPaste] = useLocalStorage<boolean>(
    'markread_autohide',
    true
  );
  const [fontSize, setFontSize] = useLocalStorage<'sm' | 'base' | 'lg'>(
    'markread_fontsize',
    'base'
  );

  const [showEditor, setShowEditor] = useState<boolean>(true);
  const [mobileTab, setMobileTab] = useState<'preview' | 'editor'>('preview');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Apply theme class to HTML root element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  // Handle toast notification auto-dismissal
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Handle auto-hide trigger on paste or file load
  const triggerAutoHide = useCallback(
    (incomingText: string) => {
      if (!autoHideOnPaste) return;

      const isLongEnough = incomingText.length >= 40 || incomingText.includes('\n');
      if (isLongEnough) {
        setTimeout(() => {
          setShowEditor(false);
          setMobileTab('preview');
          setToastMessage('Code hidden — click Show Code (Ctrl+E) to edit');
        }, 150);
      }
    },
    [autoHideOnPaste]
  );

  // Handle Ctrl/Cmd + E shortcut for toggling code editor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setShowEditor((prev) => !prev);
        setMobileTab((prev) => (prev === 'editor' ? 'preview' : 'editor'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Copy Markdown utility
  const handleCopyMarkdown = useCallback(async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(content);
        setToastMessage('Markdown copied to clipboard!');
      }
    } catch (err) {
      console.warn('Failed to copy markdown', err);
    }
  }, [content]);

  // Download Markdown utility
  const handleDownloadMarkdown = useCallback(() => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'document.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToastMessage('Document downloaded as document.md');
  }, [content]);

  const stats = calculateReadingStats(content);

  return (
    <div className="min-h-screen bg-canvas text-textPrimary flex flex-col font-sans transition-colors duration-200">
      {/* Top Header Toolbar */}
      <TopBar
        showEditor={showEditor}
        onToggleEditor={() => {
          setShowEditor((prev) => !prev);
          setMobileTab((prev) => (prev === 'editor' ? 'preview' : 'editor'));
        }}
        autoHideOnPaste={autoHideOnPaste}
        onToggleAutoHide={() => setAutoHideOnPaste((prev) => !prev)}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        fontSize={fontSize}
        onChangeFontSize={setFontSize}
        stats={stats}
        onCopyMarkdown={handleCopyMarkdown}
        onDownloadMarkdown={handleDownloadMarkdown}
        activeMobileTab={mobileTab}
        onChangeMobileTab={setMobileTab}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 md:p-6 flex flex-col relative overflow-hidden">
        {/* Subtle Toast Pill */}
        {toastMessage && (
          <div
            role="status"
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-surface/95 border border-accent/40 text-accent text-xs font-medium shadow-lg backdrop-blur flex items-center gap-2 animate-fade-in"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Content View Layout */}
        <div className="flex-1 flex gap-6 min-h-[calc(100vh-140px)]">
          {/* Editor Pane (Hidden on mobile when tab is 'preview') */}
          <div
            className={`flex-1 transition-all duration-300 ${
              showEditor ? 'md:flex' : 'hidden'
            } ${mobileTab === 'editor' ? 'flex' : 'hidden md:flex'}`}
          >
            <MarkdownEditor
              value={content}
              onChange={setContent}
              onPasteMarkdown={triggerAutoHide}
              onFileLoaded={() => triggerAutoHide(content)}
            />
          </div>

          {/* Preview Pane (Always available; full-width or centered when editor is hidden) */}
          <div
            className={`flex-1 transition-all duration-300 ${
              !showEditor ? 'max-w-3xl mx-auto' : ''
            } ${mobileTab === 'preview' ? 'flex flex-col' : 'hidden md:flex md:flex-col'}`}
          >
            <div className="bg-surface border border-borderSubtle rounded-lg p-5 md:p-8 flex-1 overflow-y-auto shadow-sm">
              <MarkdownPreview content={content} fontSize={fontSize} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
