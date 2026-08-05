"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// `code` is styled for the inline case; `pre` (fenced code blocks wrap their
// `code` in a `pre`) overrides those same classes via a descendant selector
// instead of trying to detect inline-vs-block from props — react-markdown
// v9+ dropped the `inline` flag from the `code` renderer.
const components = {
  p: ({ children }) => <p className="text-body-sm leading-relaxed">{children}</p>,
  h1: ({ children }) => (
    <h1 className="mt-3 mb-1 text-body font-semibold first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-3 mb-1 text-body-sm font-semibold uppercase first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-2 mb-1 text-body-sm font-semibold first:mt-0">{children}</h3>
  ),
  ul: ({ children }) => <ul className="my-1 list-disc space-y-1 pl-5 text-body-sm">{children}</ul>,
  ol: ({ children }) => (
    <ol className="my-1 list-decimal space-y-1 pl-5 text-body-sm">{children}</ol>
  ),
  li: ({ children }) => <li className="text-body-sm leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-carbon-black">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="underline decoration-mint-chip decoration-2 underline-offset-2 hover:text-slate"
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-ash/40 px-1 py-0.5 font-mono text-caption">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-lg bg-carbon-black px-3 py-2 font-mono text-caption text-paper-white [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-paper-white">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-ash pl-3 text-slate">{children}</blockquote>
  ),
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-body-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b border-ash text-left">{children}</thead>,
  th: ({ children }) => (
    <th className="px-2 py-1 font-mono text-caption uppercase text-smoke">{children}</th>
  ),
  td: ({ children }) => <td className="border-t border-ash px-2 py-1 align-top">{children}</td>,
  hr: () => <hr className="my-2 border-ash" />,
};

export default function Markdown({ content }) {
  return (
    <div className="space-y-1">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
