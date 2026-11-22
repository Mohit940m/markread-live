import { forwardRef, ComponentPropsWithoutRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { CodeBlock } from './CodeBlock';

interface MarkdownPreviewProps {
  content: string;
  fontSize?: 'sm' | 'base' | 'lg';
  activeChunkIndex?: number | null;
  onBlockClick?: (blockText: string, index: number) => void;
}

export const MarkdownPreview = forwardRef<HTMLElement, MarkdownPreviewProps>(
  (
    {
      content,
      fontSize = 'base',
      activeChunkIndex = null,
    },
    ref
  ) => {
    const fontClass = {
      sm: 'prose-sm',
      base: 'prose-base',
      lg: 'prose-lg',
    }[fontSize];

    return (
      <article
        ref={ref}
        data-testid="markdown-article"
        className={`prose dark:prose-invert max-w-none w-full break-words ${fontClass}`}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
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
            // Custom code block renderer with syntax highlighting and one-click copy button
            code: ({ className, children, ...props }: ComponentPropsWithoutRef<'code'>) => {
              const match = /language-(\w+)/.exec(className || '');
              const codeString = String(children).replace(/\n$/, '');
              const isMultiLine = codeString.includes('\n');

              if (match || isMultiLine) {
                return (
                  <CodeBlock language={match ? match[1] : undefined} codeString={codeString}>
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </CodeBlock>
                );
              }

              return (
                <code
                  className="bg-elevated px-1.5 py-0.5 rounded text-accent font-mono text-sm border border-borderSubtle"
                  {...props}
                >
                  {children}
                </code>
              );
            },
            // Customize pre tag so it doesn't double-wrap our CodeBlock
            pre: ({ children }: ComponentPropsWithoutRef<'pre'>) => <>{children}</>,
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
  }
);

MarkdownPreview.displayName = 'MarkdownPreview';
