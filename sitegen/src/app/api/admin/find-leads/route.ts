import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { searchPlaces, isUsableWebsite, slugify } from "@/lib/places";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const query = String(form.get("query") ?? "").trim();
  const area = String(form.get("area") ?? "").trim();
  const maxPages = Math.min(3, Math.max(1, Number(form.get("maxPages") ?? 2)));

  if (!query || !area) {
    return NextResponse.json({ error: "query and area are required" }, { status: 400 });
  }

  const places = await searchPlaces({ query, area, maxPages });

  let added = 0;
  let skippedHasSite = 0;
  let skippedExists = 0;

  for (const p of places) {
    if (isUsableWebsite(p.website)) {
      skippedHasSite++;
      continue;
    }
    const existing = await prisma.lead.findUnique({ where: { placeId: p.placeId } });
    if (existing) {
      skippedExists++;
      continue;
    }
    await prisma.lead.create({
      data: {
        slug: slugify(p.name, p.placeId),
        placeId: p.placeId,
        name: p.name,
        category: p.category,
        address: p.address,
        phone: p.phone,
        website: p.website,
        rating: p.rating,
        reviewCount: p.reviewCount,
        area,
      },
    });
    added++;
  }

  const url = new URL("/admin", req.url);
  url.searchParams.set("found", String(added));
  url.searchParams.set("skip_site", String(skippedHasSite));
  url.searchParams.set("skip_dup", String(skippedExists));
  return NextResponse.redirect(url, { status: 303 });
}
