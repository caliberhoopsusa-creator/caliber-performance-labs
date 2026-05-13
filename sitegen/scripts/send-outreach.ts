import { prisma, LEAD_STATUS } from "../src/lib/db";
import { sendEmail } from "../src/lib/email";

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limit = Number(args.find((a) => /^\d+$/.test(a)) ?? 10);

  const leads = await prisma.lead.findMany({
    where: { status: LEAD_STATUS.MOCKED, email: { not: null } },
    take: limit,
    orderBy: { generatedAt: "asc" },
  });

  if (leads.length === 0) {
    console.log(
      "No MOCKED leads with an email address on file. " +
        "Add emails (manually or via enrichment) before running outreach.",
    );
    await prisma.$disconnect();
    return;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const ownerName = process.env.OWNER_NAME ?? "the team";
  const ownerEmail = process.env.OWNER_EMAIL;

  console.log(`${dryRun ? "[DRY RUN] " : ""}Sending to ${leads.length} leads...`);
  let ok = 0;
  let failed = 0;

  for (const lead of leads) {
    const previewUrl = `${baseUrl}/preview/${lead.slug}`;
    const subject = `A website mockup we built for ${lead.name}`;
    const html = `<p>Hi —</p>
<p>I noticed <strong>${lead.name}</strong> doesn't have a website (or has one that's not really working for you), so I built one as a mockup. No obligation, just wanted to show you what's possible.</p>
<p><strong>Preview here:</strong><br><a href="${previewUrl}">${previewUrl}</a></p>
<p>If you like it, the page has a button to make it live on your own domain for a one-time $650 (we handle hosting for the first year too). If not, no worries — just ignore this email.</p>
<p>— ${ownerName}</p>`;

    if (dryRun) {
      console.log(`  [dry] ${lead.email} → ${previewUrl}`);
      continue;
    }

    try {
      await sendEmail({ to: lead.email!, subject, html, replyTo: ownerEmail });
      await prisma.lead.update({
        where: { id: lead.id },
        data: { status: LEAD_STATUS.CONTACTED },
      });
      await prisma.outreachLog.create({
        data: {
          leadId: lead.id,
          channel: "email",
          toAddress: lead.email!,
          subject,
          status: "sent",
        },
      });
      console.log(`  ✓ ${lead.name} → ${lead.email}`);
      ok++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  ✗ ${lead.name}: ${msg}`);
      await prisma.outreachLog.create({
        data: {
          leadId: lead.id,
          channel: "email",
          toAddress: lead.email!,
          subject,
          status: "failed",
          error: msg,
        },
      });
      failed++;
    }
  }

  console.log(`\nDone. ${ok} sent, ${failed} failed.${dryRun ? " (dry run)" : ""}`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
