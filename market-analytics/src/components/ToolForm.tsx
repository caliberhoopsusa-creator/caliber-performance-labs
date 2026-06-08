import type { Tool } from "../../shared/catalog.js";

interface Props {
  tool: Tool;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onSubmit: () => void;
  onReset: () => void;
  isRunning: boolean;
}

export function ToolForm({ tool, values, onChange, onSubmit, onReset, isRunning }: Props) {
  return (
    <form
      className="tool-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!isRunning) onSubmit();
      }}
    >
      {tool.fields.map((field) => {
        const id = `${tool.id}-${field.key}`;
        const value = values[field.key] ?? "";
        return (
          <div className="field" key={field.key}>
            <label htmlFor={id}>
              {field.label}
              {field.required && <span className="req">*</span>}
            </label>

            {field.type === "textarea" ? (
              <textarea
                id={id}
                value={value}
                placeholder={field.placeholder}
                rows={5}
                onChange={(e) => onChange(field.key, e.target.value)}
              />
            ) : field.type === "select" ? (
              <select id={id} value={value} onChange={(e) => onChange(field.key, e.target.value)}>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={id}
                type={field.type === "number" ? "number" : "text"}
                value={value}
                placeholder={field.placeholder}
                onChange={(e) => onChange(field.key, e.target.value)}
              />
            )}

            {field.hint && <p className="hint">{field.hint}</p>}
          </div>
        );
      })}

      <div className="actions">
        <button type="submit" className="run" disabled={isRunning}>
          {isRunning ? "Analyzing…" : "Run analysis"}
        </button>
        <button type="button" className="ghost" onClick={onReset} disabled={isRunning}>
          Reset
        </button>
      </div>
    </form>
  );
}
