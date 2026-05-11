import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import type { Options as SanitizeOptions } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';

/**
 * Safe markdown-to-HTML renderer.
 * Can be used in both server components (RSC) and client components.
 *
 * - GFM support (tables, strikethrough, task lists)
 * - Sanitized output (no XSS, no iframe/script)
 * - Styled to match Offroady blog/story design system
 */

type MarkdownRendererProps = {
  content: string;
  className?: string;
};

const SANITIZE_SCHEMA: SanitizeOptions = {
  tagNames: [
    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'img',
    'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins',
    'blockquote', 'hr', 'br',
    'code', 'pre',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'div', 'span',
    'figure', 'figcaption',
  ],
  attributes: {
    a: ['href', 'target', 'rel', 'title'],
    img: ['src', 'alt', 'title', 'loading', 'class'],
    '*': ['class', 'id'],
  },
  strip: [
    'script', 'iframe', 'object', 'embed', 'form', 'input',
    'textarea', 'select', 'button', 'style', 'link', 'meta',
  ],
  allowComments: false,
  allowDoctypes: false,
};

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, SANITIZE_SCHEMA]]}
        components={{
          h2: ({ children, ...props }) => (
            <h2 className="mt-8 text-2xl font-bold text-[#243126]" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="mt-6 text-xl font-bold text-[#243126]" {...props}>
              {children}
            </h3>
          ),
          p: ({ children, ...props }) => (
            <p className="text-base leading-8 text-gray-700" {...props}>
              {children}
            </p>
          ),
          a: ({ href, children, ...props }) => {
            const isInternal = href?.startsWith('/');
            if (isInternal) {
              return (
                <Link
                  href={href!}
                  className="font-medium text-[#2f5d3a] underline decoration-[#9dc2a2] underline-offset-4 hover:decoration-[#2f5d3a]"
                  {...props}
                >
                  {children}
                </Link>
              );
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#2f5d3a] underline decoration-[#9dc2a2] underline-offset-4 hover:decoration-[#2f5d3a]"
                {...props}
              >
                {children}
              </a>
            );
          },
          img: ({ src, alt, ...props }) => (
            <div className="my-6 overflow-hidden rounded-2xl">
              <img
                src={src}
                alt={alt || 'Story image'}
                className="w-full object-cover"
                loading="lazy"
                {...props}
              />
              {alt && (
                <p className="mt-2 text-center text-sm text-gray-500">{alt}</p>
              )}
            </div>
          ),
          ul: ({ children, ...props }) => (
            <ul className="my-4 list-disc space-y-1 pl-6 text-base leading-8 text-gray-700" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="my-4 list-decimal space-y-1 pl-6 text-base leading-8 text-gray-700" {...props}>
              {children}
            </ol>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="my-4 border-l-4 border-[#2f5d3a] bg-[#eef5ee] py-3 pl-4 pr-4 text-base leading-8 text-gray-700 italic"
              {...props}
            >
              {children}
            </blockquote>
          ),
          hr: (props) => <hr className="my-8 border-gray-200" {...props} />,
          code: ({ children, ...props }) => (
            <code
              className="rounded-md bg-gray-100 px-1.5 py-0.5 text-sm font-medium text-gray-800"
              {...props}
            >
              {children}
            </code>
          ),
          pre: ({ children, ...props }) => (
            <pre
              className="my-4 overflow-x-auto rounded-xl bg-gray-100 p-4 text-sm leading-6"
              {...props}
            >
              {children}
            </pre>
          ),
          strong: ({ children, ...props }) => (
            <strong className="font-bold text-gray-900" {...props}>
              {children}
            </strong>
          ),
          table: ({ children, ...props }) => (
            <div className="my-6 overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left text-sm" {...props}>
                {children}
              </table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th className="bg-gray-50 px-4 py-3 font-semibold text-gray-700" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="border-t border-gray-100 px-4 py-3 text-gray-600" {...props}>
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
