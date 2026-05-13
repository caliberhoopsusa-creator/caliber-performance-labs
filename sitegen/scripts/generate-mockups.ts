import { prisma, LEAD_STATUS } from "../src/lib/db";
import { generateMockupSpec } from "../src/lib/mockup";
import { MOCKUP_MODEL } from "../src/lib/anthropic";

async function main() {
  const limit = Number(process.argv[2] ?? 10);
  const leads = await prisma.lead.findMany({
    where: { status: LEAD_STATUS.NEW, mockupSpec: null },
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  if (leads.length === 0) {
    console.log("No NEW leads without mockups. Run `npm run find-leads` first.");
    await prisma.$disconnect();
    return;
  }

  console.log(`Generating mockups for ${leads.length} leads with ${MOCKUP_MODEL}...`);
  let ok = 0;
  let failed = 0;

  for (const lead of leads) {
    try {
      process.stdout.write(`  ${lead.name}... `);
      const spec = await generateMockupSpec({
        name: lead.name,
        category: lead.category,
        address: lead.address,
        phone: lead.phone,
        rating: lead.rating,
        reviewCount: lead.reviewCount,
      });
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          mockupSpec: JSON.stringify(spec),
          mockupModel: MOCKUP_MODEL,
          generatedAt: new Date(),
          status: LEAD_STATUS.MOCKED,
        },
      });
      console.log("✓");
      ok++;
    } catch (err) {
      console.log(`✗ ${err instanceof Error ? err.message : err}`);
      failed++;
    }
  }

  console.log(`\nDone. ${ok} generated, ${failed} failed.`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
