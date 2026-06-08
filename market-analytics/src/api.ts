// Streams /api/analyze. EventSource can't POST, so we read the fetch body and
// parse the SSE frames ourselves.

export interface AnalyzeCallbacks {
  onDelta: (text: string) => void;
  onDone: (usage: unknown) => void;
  onError: (message: string) => void;
}

export async function streamAnalysis(
  toolId: string,
  inputs: Record<string, string>,
  signal: AbortSignal,
  cb: AnalyzeCallbacks,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolId, inputs }),
      signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") return;
    cb.onError("Could not reach the server. Is it running?");
    return;
  }

  if (!res.ok || !res.body) {
    let message = `Request failed (${res.status}).`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* non-JSON error body */
    }
    cb.onError(message);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE frames are separated by a blank line.
      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";

      for (const frame of frames) {
        let event = "message";
        let data = "";
        for (const line of frame.split("\n")) {
          if (line.startsWith("event:")) event = line.slice(6).trim();
          else if (line.startsWith("data:")) data += line.slice(5).trim();
        }
        if (!data) continue;
        const payload = JSON.parse(data);
        if (event === "delta") cb.onDelta(payload.text);
        else if (event === "done") cb.onDone(payload.usage);
        else if (event === "error") cb.onError(payload.error);
      }
    }
  } catch (err) {
    if ((err as Error).name !== "AbortError") {
      cb.onError("The stream was interrupted.");
    }
  }
}
