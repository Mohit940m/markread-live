import { useState, FC, ReactNode } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  language?: string;
  codeString: string;
  children?: ReactNode;
}

export const CodeBlock: FC<CodeBlockProps> = ({ language, codeString, children }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(codeString);
      } else {
        // Fallback for older browsers / testing environments
        const textArea = document.createElement('textarea');
        textArea.value = codeString;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy code to clipboard', err);
    }
  };

  const displayLang = language ? language.replace(/^language-/, '') : 'text';

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-borderSubtle bg-elevated shadow-sm not-prose">
      <div className="flex items-center justify-between px-3 py-1.5 bg-surface border-b border-borderSubtle text-xs text-textMuted font-mono">
        <span className="uppercase tracking-wider font-semibold text-[11px] text-textMuted/90">
          {displayLang}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? 'Code copied' : 'Copy code to clipboard'}
          className="flex items-center gap-1 px-2 py-1 rounded bg-elevated hover:bg-borderSubtle/60 text-textPrimary text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-textMuted" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-sm font-mono leading-relaxed bg-[#0F1117] text-[#E2E8F0]">
        {children || <pre><code>{codeString}</code></pre>}
      </div>
    </div>
  );
};
