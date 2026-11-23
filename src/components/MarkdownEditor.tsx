import {
  useState,
  useRef,
  FC,
  ChangeEvent,
  DragEvent,
  ClipboardEvent,
} from 'react';
import { Upload, FileText, Trash2 } from 'lucide-react';
import { DEFAULT_SAMPLE_MARKDOWN } from '../utils/sampleMarkdown';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onPasteMarkdown?: (text: string) => void;
  onFileLoaded?: (filename: string, content: string) => void;
}

export const MarkdownEditor: FC<MarkdownEditorProps> = ({
  value,
  onChange,
  onPasteMarkdown,
  onFileLoaded,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const isMarkdown =
      file.name.endsWith('.md') ||
      file.name.endsWith('.markdown') ||
      file.name.endsWith('.txt') ||
      file.type.includes('text');

    if (!isMarkdown) {
      alert('Please upload a .md, .markdown, or .txt file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        onChange(text);
        if (onFileLoaded) {
          onFileLoaded(file.name, text);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
    // Reset input value so re-selecting same file fires change
    e.target.value = '';
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (onPasteMarkdown && pastedText) {
      onPasteMarkdown(pastedText);
    }
  };

  return (
    <div
      data-testid="markdown-editor-container"
      style={{ height: '100%' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex flex-col flex-1 h-full w-full min-h-0 self-stretch bg-surface border border-borderSubtle rounded-lg overflow-hidden transition-all ${
        isDragging ? 'ring-2 ring-accent ring-inset bg-accent/5' : ''
      }`}
    >
      {/* Editor sub-toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-elevated/80 border-b border-borderSubtle text-xs text-textMuted select-none shrink-0">
        <span className="font-mono text-xs uppercase tracking-wider font-medium text-textMuted">
          Markdown Editor
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChange(DEFAULT_SAMPLE_MARKDOWN)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface hover:bg-borderSubtle/60 text-textPrimary text-xs transition-colors"
            title="Load sample Markdown document"
          >
            <FileText className="w-3.5 h-3.5 text-accent" />
            <span>Sample</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface hover:bg-borderSubtle/60 text-textPrimary text-xs transition-colors"
            title="Upload .md or .txt file"
          >
            <Upload className="w-3.5 h-3.5 text-textMuted" />
            <span>Upload</span>
          </button>
          <button
            type="button"
            onClick={() => onChange('')}
            disabled={!value}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface hover:bg-red-500/10 hover:text-red-400 text-textMuted text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Clear all editor content"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".md,.markdown,.txt,text/markdown,text/plain"
        className="hidden"
        data-testid="file-upload-input"
        aria-label="Upload Markdown File"
      />

      {/* Drag & Drop Visual Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-canvas/90 backdrop-blur-sm pointer-events-none border-2 border-dashed border-accent m-2 rounded-lg">
          <Upload className="w-10 h-10 text-accent mb-2 animate-bounce" />
          <p className="text-textPrimary font-semibold text-base">Drop your Markdown file here</p>
          <p className="text-textMuted text-xs mt-1">Supports .md, .markdown, and .txt</p>
        </div>
      )}

      {/* Textarea Editor */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        placeholder="Type or paste Markdown here, or drop a .md file..."
        data-testid="markdown-textarea"
        spellCheck="false"
        style={{ height: '100%', minHeight: '100%' }}
        className="flex-1 h-full min-h-0 w-full p-4 bg-transparent text-textPrimary font-mono text-sm leading-relaxed resize-none focus:outline-none placeholder:text-textMuted/50 overflow-y-auto"
      />
    </div>
  );
};
