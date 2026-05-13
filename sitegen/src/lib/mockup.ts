import { z } from "zod";
import { anthropic, MOCKUP_MODEL } from "./anthropic";

export const MockupSpecSchema = z.object({
  business_name: z.string(),
  tagline: z.string(),
  hero_headline: z.string(),
  hero_subhead: z.string(),
  cta_label: z.string(),
  about_heading: z.string(),
  about_body: z.string(),
  services: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
      }),
    )
    .min(3)
    .max(6),
  trust_points: z.array(z.string()).min(3).max(5),
  contact_blurb: z.string(),
  theme: z.object({
    primary: z.string(),
    accent: z.string(),
    background: z.string(),
    text: z.string(),
    style: z.enum(["modern", "warm", "classic", "bold"]),
  }),
});

export type MockupSpec = z.infer<typeof MockupSpecSchema>;

const SYSTEM_PROMPT = `You are a senior brand designer + copywriter writing one-page marketing websites for small local businesses.

You are given facts about a real business (name, category, address, phone, rating, review count). Produce a JSON spec for a clean, modern landing page tailored to that business — concrete, locally-grounded, never generic.

RULES:
- Headlines: short, specific, no marketing-speak. Avoid "premier", "leading", "world-class".
- Services: pick 3–5 likely offerings for this category. Be specific ("Brake pad replacement" not "Repairs").
- About: 2–3 sentences. Reference the city/neighborhood from the address. Do not invent owner names, founding years, or awards.
- Trust points: 3–5 plausible items a business in this category would want to advertise ("Family-owned", "Licensed & insured", "Open Saturdays"). Use honest fallbacks if uncertain ("Locally owned", "Serving [city]").
- Theme colors: hex strings. Pick colors that fit the category — restaurants warm, law/finance classic blue/gray, auto/trades bold/utilitarian, wellness soft/modern.
- "style" must be one of: "modern", "warm", "classic", "bold".

OUTPUT FORMAT:
Return ONLY a JSON object (no prose, no markdown code fences) matching this exact shape:

{
  "business_name": string,
  "tagline": string,
  "hero_headline": string,
  "hero_subhead": string,
  "cta_label": string,
  "about_heading": string,
  "about_body": string,
  "services": [{ "title": string, "description": string }, ...],
  "trust_points": [string, ...],
  "contact_blurb": string,
  "theme": {
    "primary": string,
    "accent": string,
    "background": string,
    "text": string,
    "style": "modern" | "warm" | "classic" | "bold"
  }
}`;

export async function generateMockupSpec(facts: {
  name: string;
  category: string | null;
  address: string | null;
  phone: string | null;
  rating: number | null;
  reviewCount: number | null;
}): Promise<MockupSpec> {
  const userPrompt = [
    `BUSINESS NAME: ${facts.name}`,
    facts.category ? `CATEGORY: ${facts.category}` : null,
    facts.address ? `ADDRESS: ${facts.address}` : null,
    facts.phone ? `PHONE: ${facts.phone}` : null,
    facts.rating
      ? `GOOGLE RATING: ${facts.rating} (${facts.reviewCount ?? 0} reviews)`
      : null,
    "",
    "Generate the mockup spec for this business. Return JSON only.",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await anthropic.messages.create({
    model: MOCKUP_MODEL,
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text block in mockup response");
  }

  const raw = stripCodeFence(textBlock.text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Mockup model returned non-JSON: ${raw.slice(0, 200)}`);
  }

  return MockupSpecSchema.parse(parsed);
}

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();
  }
  return trimmed;
}
