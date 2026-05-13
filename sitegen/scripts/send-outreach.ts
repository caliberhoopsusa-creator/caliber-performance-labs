import { prisma, LEAD_STATUS } from "../src/lib/db";
import { sendEmail } from "../src/lib/email";
import { sendSms, normalizePhone } from "../src/lib/sms";

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const channelArg = (args.find((a) => a.startsWith("--channel=")) ?? "").slice(10);
  const channel = (channelArg as "email" | "sms" | "auto") || "auto";
  const limit = Number(args.find((a) => /^\d+$/.test(a)) ?? 10);

  // "auto": pick a channel per lead. Email if email is set, else SMS if phone
  // is set. Skip leads with neither.
  // "email" / "sms": force that channel; skip leads without the right field.
  const leads = await prisma.lead.findMany({
    where: { status: LEAD_STATUS.MOCKED },
    take: limit,
    orderBy: { generatedAt: "asc" },
  });

  if (leads.length === 0) {
    console.log("No MOCKED leads. Run `npm run generate-mockups` first.");
    await prisma.$disconnect();
    return;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const ownerName = process.env.OWNER_NAME ?? "the team";
  const ownerEmail = process.env.OWNER_EMAIL;

  console.log(
    `${dryRun ? "[DRY RUN] " : ""}Sending to ${leads.length} leads via ${channel}...`,
  );
  let okEmail = 0;
  let okSms = 0;
  let failed = 0;
  let skipped = 0;

  for (const lead of leads) {
    const previewUrl = `${baseUrl}/preview/${lead.slug}`;
    const chosen =
      channel === "auto"
        ? lead.email
          ? "email"
          : lead.phone
            ? "sms"
            : null
        : channel === "email"
          ? lead.email
            ? "email"
            : null
          : lead.phone
            ? "sms"
            : null;

    if (!chosen) {
      console.log(`  ⊘ ${lead.name}: no ${channel} channel available`);
      skipped++;
      continue;
    }

    if (chosen === "email") {
      const subject = `A website mockup we built for ${lead.name}`;
      const html = `<p>Hi —</p>
<p>I noticed <strong>${lead.name}</strong> doesn't have a website (or has one that's not really working for you), so I built one as a mockup. No obligation, just wanted to show you what's possible.</p>
<p><strong>Preview here:</strong><br><a href="${previewUrl}">${previewUrl}</a></p>
<p>If you like it, the page has a button to make it live on your own domain for a one-time $650 (we handle hosting for the first year too). If not, no worries — just ignore this email.</p>
<p>— ${ownerName}</p>`;

      if (dryRun) {
        console.log(`  [dry email] ${lead.email} → ${previewUrl}`);
        continue;
      }
      try {
        await sendEmail({ to: lead.email!, subject, html, replyTo: ownerEmail });
        await markSent(lead.id, "email", lead.email!, subject);
        console.log(`  ✓ email  ${lead.name} → ${lead.email}`);
        okEmail++;
      } catch (err) {
        await markFailed(lead.id, "email", lead.email!, err, subject);
        console.log(`  ✗ email  ${lead.name}: ${describe(err)}`);
        failed++;
      }
    } else {
      const phone = normalizePhone(lead.phone!);
      if (!phone) {
        console.log(`  ⊘ ${lead.name}: phone ${lead.phone} not normalizable`);
        skipped++;
        continue;
      }
      const body = `Hi — I built a free website mockup for ${lead.name}. Preview: ${previewUrl}. If you want it live on your domain, the page has a $650 one-time button. Reply STOP to opt out. — ${ownerName}`;

      if (dryRun) {
        console.log(`  [dry sms] ${phone} → ${previewUrl}`);
        continue;
      }
      try {
        await sendSms({ to: phone, body });
        await markSent(lead.id, "sms", phone);
        console.log(`  ✓ sms    ${lead.name} → ${phone}`);
        okSms++;
      } catch (err) {
        await markFailed(lead.id, "sms", phone, err);
        console.log(`  ✗ sms    ${lead.name}: ${describe(err)}`);
        failed++;
      }
    }
  }

  console.log(
    `\nDone. ${okEmail} email, ${okSms} sms, ${failed} failed, ${skipped} skipped.${dryRun ? " (dry run)" : ""}`,
  );
  await prisma.$disconnect();
}

async function markSent(
  leadId: string,
  channel: "email" | "sms",
  to: string,
  subject?: string,
) {
  await prisma.lead.update({
    where: { id: leadId },
    data: { status: LEAD_STATUS.CONTACTED },
  });
  await prisma.outreachLog.create({
    data: { leadId, channel, toAddress: to, subject, status: "sent" },
  });
}

async function markFailed(
  leadId: string,
  channel: "email" | "sms",
  to: string,
  err: unknown,
  subject?: string,
) {
  await prisma.outreachLog.create({
    data: {
      leadId,
      channel,
      toAddress: to,
      subject,
      status: "failed",
      error: describe(err),
    },
  });
}

function describe(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
