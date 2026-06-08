import express, { type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { buildPrompt, validateRequest, SYSTEM_PROMPT } from "./prompts.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 5174;
const MODEL = "claude-opus-4-8";

const app = express();
app.use(express.json({ limit: "256kb" }));

// The API key lives only on the server. The browser never sees it.
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Basic abuse protection on the paid endpoint.
const analyzeLimiter = rateLimit({
  windowMs: 60_000,
  max: Number(process.env.RATE_LIMIT_PER_MINUTE) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, model: MODEL, keyConfigured: Boolean(process.env.ANTHROPIC_API_KEY) });
});

// Streaming analysis endpoint. Streams the model's text back as Server-Sent
// Events so the UI renders the report token-by-token.
app.post("/api/analyze", analyzeLimiter, async (req: Request, res: Response) => {
  const { toolId, inputs } = (req.body ?? {}) as {
    toolId?: string;
    inputs?: Record<string, string>;
  };

  if (!toolId || typeof inputs !== "object" || inputs === null) {
    return res.status(400).json({ error: "toolId and inputs are required." });
  }

  const validationError = validateRequest(toolId, inputs);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({
      error: "Server is missing ANTHROPIC_API_KEY. Add it to your environment and restart.",
    });
  }

  let prompt: string;
  try {
    prompt = buildPrompt(toolId, inputs);
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }

  // Set up the SSE response.
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Stop generating if the client disconnects.
  const controller = new AbortController();
  req.on("close", () => controller.abort());

  try {
    const stream = anthropic.messages.stream(
      {
        model: MODEL,
        max_tokens: 16000,
        thinking: { type: "adaptive" },
        output_config: { effort: "high" },
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      },
      { signal: controller.signal },
    );

    stream.on("text", (text) => send("delta", { text }));

    const final = await stream.finalMessage();
    send("done", { usage: final.usage });
    res.end();
  } catch (err) {
    if (controller.signal.aborted) {
      // Client went away — nothing to report.
      return res.end();
    }
    const message =
      err instanceof Anthropic.APIError
        ? `Claude API error (${err.status}): ${err.message}`
        : (err as Error).message || "Unexpected error generating analysis.";
    send("error", { error: message });
    res.end();
  }
});

// In production, serve the built single-page app.
if (process.env.NODE_ENV === "production") {
  const dist = path.resolve(__dirname, "..", "dist");
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Market Analytics server listening on http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    // eslint-disable-next-line no-console
    console.warn("⚠  ANTHROPIC_API_KEY is not set — /api/analyze will return 503 until it is.");
  }
});
