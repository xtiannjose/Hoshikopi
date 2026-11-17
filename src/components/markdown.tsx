import ReactMarkdown from "react-markdown";

/** Staff-written Markdown; no raw HTML (docs/03 section 14). */
export function Markdown({ children }: { children: string }) {
  // Lists and headings get bullets and sizes, and a "#" is an h2 so the page
  // keeps one h1 (audit staff:15).
  return (
    <div className="max-w-measure [&_h2]:font-display [&_h3]:font-display grid gap-4 [&_a]:underline [&_h2]:text-2xl [&_h2]:italic [&_h3]:text-xl [&_h3]:italic [&_h4]:font-semibold [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6">
      <ReactMarkdown skipHtml components={{ h1: "h2" }}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
