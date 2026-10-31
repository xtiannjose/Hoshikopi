import ReactMarkdown from "react-markdown";

/** Staff-written Markdown; no raw HTML (docs/03 section 14). */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="grid max-w-[65ch] gap-4 [&_a]:underline">
      <ReactMarkdown skipHtml>{children}</ReactMarkdown>
    </div>
  );
}
