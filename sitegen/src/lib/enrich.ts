// Hunter.io email finder — https://hunter.io/api-documentation
//
// Strategy: small local businesses usually don't have websites (that's why
// they're our leads). When they do, Hunter's domain-search can find an
// email pattern. When they don't, we fall back to nothing — phone outreach
// is the only option.
//
// We only spend a Hunter credit on leads that have a `website` (even a
// directory listing). For pure no-web leads, skip enrichment entirely.

export type EnrichedEmail = {
  email: string;
  confidence: number;
  source: "hunter";
};

const BASE = "https://api.hunter.io/v2";

export async function findEmailForLead(opts: {
  businessName: string;
  website: string | null;
}): Promise<EnrichedEmail | null> {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) return null;
  if (!opts.website) return null;

  const domain = extractDomain(opts.website);
  if (!domain) return null;

  const url = new URL(`${BASE}/domain-search`);
  url.searchParams.set("domain", domain);
  url.searchParams.set("limit", "5");
  url.searchParams.set("api_key", apiKey);

  const res = await fetch(url);
  if (!res.ok) {
    console.error(`[hunter] ${res.status} ${await res.text().catch(() => "")}`);
    return null;
  }

  const json = (await res.json()) as {
    data?: { emails?: Array<{ value: string; confidence: number }> };
  };
  const candidates = json.data?.emails ?? [];
  if (candidates.length === 0) return null;

  // Highest-confidence email wins. We trust anything ≥ 50; below that, skip.
  const best = candidates.sort((a, b) => b.confidence - a.confidence)[0];
  if (best.confidence < 50) return null;

  return { email: best.value, confidence: best.confidence, source: "hunter" };
}

function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
