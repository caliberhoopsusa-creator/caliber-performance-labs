// Google Places API (New) — Text Search.
// Docs: https://developers.google.com/maps/documentation/places/web-service/text-search
//
// We use Text Search rather than Nearby Search because it accepts free-form
// area strings ("Cleveland Ohio", "94110") and returns business websites
// directly in the response (saves a Place Details call).

export type PlaceLead = {
  placeId: string;
  name: string;
  category: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviewCount: number | null;
};

type PlacesResponse = {
  places?: Array<{
    id?: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    internationalPhoneNumber?: string;
    nationalPhoneNumber?: string;
    websiteUri?: string;
    rating?: number;
    userRatingCount?: number;
    primaryTypeDisplayName?: { text?: string };
    types?: string[];
  }>;
  nextPageToken?: string;
};

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.internationalPhoneNumber",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.primaryTypeDisplayName",
  "places.types",
  "nextPageToken",
].join(",");

export async function searchPlaces(opts: {
  query: string;
  area: string;
  maxPages?: number;
}): Promise<PlaceLead[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY not set");

  const results: PlaceLead[] = [];
  let pageToken: string | undefined;
  const maxPages = opts.maxPages ?? 3;

  for (let i = 0; i < maxPages; i++) {
    const body: Record<string, unknown> = {
      textQuery: `${opts.query} in ${opts.area}`,
      pageSize: 20,
    };
    if (pageToken) body.pageToken = pageToken;

    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Google Places ${res.status}: ${text}`);
    }

    const data = (await res.json()) as PlacesResponse;
    for (const p of data.places ?? []) {
      if (!p.id || !p.displayName?.text) continue;
      results.push({
        placeId: p.id,
        name: p.displayName.text,
        category: p.primaryTypeDisplayName?.text ?? p.types?.[0] ?? null,
        address: p.formattedAddress ?? null,
        phone: p.nationalPhoneNumber ?? p.internationalPhoneNumber ?? null,
        website: p.websiteUri ?? null,
        rating: p.rating ?? null,
        reviewCount: p.userRatingCount ?? null,
      });
    }

    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
    // Google requires a brief delay before nextPageToken activates.
    await new Promise((r) => setTimeout(r, 2000));
  }

  return results;
}

export function isUsableWebsite(url: string | null | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  // Treat directory listings and social-only presences as "no real website".
  const placeholderHosts = [
    "facebook.com",
    "instagram.com",
    "yelp.com",
    "google.com",
    "linkedin.com",
    "tripadvisor.com",
    "doordash.com",
    "ubereats.com",
    "grubhub.com",
    "linktr.ee",
  ];
  return !placeholderHosts.some((h) => lower.includes(h));
}

export function slugify(name: string, placeId: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix = placeId.slice(-6).toLowerCase().replace(/[^a-z0-9]/g, "");
  return base ? `${base}-${suffix}` : suffix;
}
