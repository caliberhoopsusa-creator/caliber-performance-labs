import { prisma } from "../src/lib/db";
import { searchPlaces, isUsableWebsite, slugify } from "../src/lib/places";

async function main() {
  const args = process.argv.slice(2);
  const query = args[0];
  const area = args[1];
  const maxPages = Number(args[2] ?? 2);

  if (!query || !area) {
    console.error("usage: tsx scripts/find-leads.ts <query> <area> [maxPages]");
    console.error('example: tsx scripts/find-leads.ts "plumber" "Cleveland, OH" 3');
    process.exit(1);
  }

  console.log(`Searching for "${query}" in "${area}" (up to ${maxPages * 20} results)...`);
  const places = await searchPlaces({ query, area, maxPages });
  console.log(`Got ${places.length} places from Google.`);

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
    console.log(`  + ${p.name}`);
  }

  console.log(`\nDone. Added ${added} new leads.`);
  console.log(`Skipped: ${skippedHasSite} already had websites, ${skippedExists} duplicates.`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
