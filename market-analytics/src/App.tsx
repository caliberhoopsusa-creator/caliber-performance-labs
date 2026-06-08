import { useMemo, useRef, useState } from "react";
import { TOOLS, type Tool } from "../shared/catalog.js";
import { streamAnalysis } from "./api.js";
import { ToolForm } from "./components/ToolForm.js";
import { ResultPanel } from "./components/ResultPanel.js";

const CATEGORIES = ["All", "Strategy", "Risk", "Portfolio", "Research"] as const;

function defaultsFor(tool: Tool): Record<string, string> {
  return Object.fromEntries(tool.fields.map((f) => [f.key, f.default ?? ""]));
}

export function App() {
  const [activeId, setActiveId] = useState<string>(TOOLS[0].id);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [values, setValues] = useState<Record<string, string>>(() => defaultsFor(TOOLS[0]));
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const activeTool = useMemo(() => TOOLS.find((t) => t.id === activeId)!, [activeId]);
  const visibleTools = useMemo(
    () => (category === "All" ? TOOLS : TOOLS.filter((t) => t.category === category)),
    [category],
  );

  function selectTool(tool: Tool) {
    abortRef.current?.abort();
    setActiveId(tool.id);
    setValues(defaultsFor(tool));
    setOutput("");
    setError(null);
    setIsRunning(false);
  }

  function run() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setOutput("");
    setError(null);
    setIsRunning(true);

    streamAnalysis(activeTool.id, values, controller.signal, {
      onDelta: (text) => setOutput((prev) => prev + text),
      onDone: () => setIsRunning(false),
      onError: (message) => {
        setError(message);
        setIsRunning(false);
      },
    });
  }

  function stop() {
    abortRef.current?.abort();
    setIsRunning(false);
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">∿</span>
          <div>
            <h1>Quanta</h1>
            <p>AI Market Analytics Desk</p>
          </div>
        </div>
        <nav className="cats">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={c === category ? "cat active" : "cat"}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </nav>
      </header>

      <div className="layout">
        <aside className="sidebar">
          {visibleTools.map((tool) => (
            <button
              key={tool.id}
              className={tool.id === activeId ? "tool-card active" : "tool-card"}
              onClick={() => selectTool(tool)}
            >
              <span className="idx">{tool.index}</span>
              <span className="tc-body">
                <span className="tc-title">{tool.title}</span>
                <span className="tc-tag">{tool.tagline}</span>
              </span>
            </button>
          ))}
        </aside>

        <main className="workspace">
          <section className="panel inputs">
            <div className="panel-head">
              <h2>
                <span className="idx-lg">{activeTool.index}</span>
                {activeTool.title}
              </h2>
              <span className="pill">{activeTool.category}</span>
            </div>
            <p className="panel-sub">{activeTool.tagline}</p>
            <ToolForm
              tool={activeTool}
              values={values}
              onChange={(key, value) => setValues((prev) => ({ ...prev, [key]: value }))}
              onSubmit={run}
              onReset={() => setValues(defaultsFor(activeTool))}
              isRunning={isRunning}
            />
          </section>

          <section className="panel report">
            <div className="panel-head">
              <h2>Report</h2>
              {isRunning && (
                <button className="stop" onClick={stop}>
                  Stop
                </button>
              )}
            </div>
            <ResultPanel markdown={output} isRunning={isRunning} error={error} />
          </section>
        </main>
      </div>

      <footer className="footnote">
        Powered by Claude Opus 4.8 · Educational analysis only — not financial advice.
      </footer>
    </div>
  );
}
