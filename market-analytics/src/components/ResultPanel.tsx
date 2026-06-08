import { useMemo } from "react";
import { marked } from "marked";

interface Props {
  markdown: string;
  isRunning: boolean;
  error: string | null;
}

marked.setOptions({ gfm: true, breaks: false });

export function ResultPanel({ markdown, isRunning, error }: Props) {
  const html = useMemo(() => (markdown ? marked.parse(markdown) : ""), [markdown]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown);
    } catch {
      /* clipboard may be unavailable */
    }
  }

  if (error) {
    return (
      <div className="result error-box">
        <strong>Something went wrong</strong>
        <p>{error}</p>
      </div>
    );
  }

  if (!markdown && !isRunning) {
    return (
      <div className="result empty">
        <div className="empty-mark">∿</div>
        <p>Fill in the inputs and run an analysis. The report streams in live here.</p>
      </div>
    );
  }

  return (
    <div className="result">
      {markdown && (
        <button className="copy" onClick={copy} title="Copy as Markdown">
          Copy
        </button>
      )}
      <div className="markdown" dangerouslySetInnerHTML={{ __html: html as string }} />
      {isRunning && <span className="cursor">▋</span>}
    </div>
  );
}
