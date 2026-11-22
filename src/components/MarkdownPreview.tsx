import { FC, ComponentPropsWithoutRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownPreviewProps {
  content: string;
  fontSize?: 'sm' | 'base' | 'lg';
  activeChunkIndex?: number | null;
  onBlockClick?: (blockText: string, index: number) => void;
}

export const MarkdownPreview: FC<MarkdownPreviewProps> = ({
  content,
  fontSize = 'base',
  activeChunkIndex = null,
}) => {
  const fontClass = {
    sm: 'prose-sm',
    base: 'prose-base',
    lg: 'prose-lg',
  }[fontSize];

  return (
    <article
      data-testid="markdown-article"
      className={`prose dark:prose-invert max-w-none w-full break-words ${fontClass}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Ensure all links open securely in new tab with noopener noreferrer
          a: ({ href, children, ...props }: ComponentPropsWithoutRef<'a'>) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline font-medium break-all"
              {...props}
            >
              {children}
            </a>
          ),
          // Wrap tables in horizontal overflow scroll container so narrow screens do not break
          table: ({ children, ...props }: ComponentPropsWithoutRef<'table'>) => (
            <div className="overflow-x-auto my-4 rounded border border-borderSubtle">
              <table
                className="min-w-full divide-y divide-borderSubtle text-left text-sm"
                {...props}
              >
                {children}
              </table>
            </div>
          ),
          th: ({ children, ...props }: ComponentPropsWithoutRef<'th'>) => (
            <th
              className="px-4 py-2 font-semibold bg-elevated text-textPrimary border-b border-borderSubtle"
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }: ComponentPropsWithoutRef<'td'>) => (
            <td className="px-4 py-2 text-textPrimary border-b border-borderSubtle/50" {...props}>
              {children}
            </td>
          ),
          blockquote: ({ children, ...props }: ComponentPropsWithoutRef<'blockquote'>) => (
            <blockquote
              className="border-l-4 border-accent/50 pl-4 py-1 italic my-4 text-textMuted bg-elevated/40 rounded-r"
              {...props}
            >
              {children}
            </blockquote>
          ),
          p: ({ children, ...props }: ComponentPropsWithoutRef<'p'>) => {
            // Assign data-chunk-index if available for reading highlight
            const isHighlight = activeChunkIndex !== null;
            return (
              <p
                data-tts-block="true"
                className={`my-3 leading-relaxed ${isHighlight ? 'transition-colors duration-200' : ''}`}
                {...props}
              >
                {children}
              </p>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
};
