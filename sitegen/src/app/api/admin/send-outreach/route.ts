import { NextRequest, NextResponse } from "next/server";
import { prisma, LEAD_STATUS } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const leadId = String(form.get("leadId") ?? "");
  const to = String(form.get("to") ?? "").trim();
  if (!leadId || !to) {
    return NextResponse.json(
      { error: "leadId and to are required" },
      { status: 400 },
    );
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return NextResponse.json({ error: "lead not found" }, { status: 404 });
  if (!lead.mockupSpec) {
    return NextResponse.json(
      { error: "no mockup yet — generate one first" },
      { status: 400 },
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const previewUrl = `${baseUrl}/preview/${lead.slug}`;
  const ownerName = process.env.OWNER_NAME ?? "the team";
  const ownerEmail = process.env.OWNER_EMAIL;

  const subject = `A website mockup we built for ${lead.name}`;
  const html = outreachHtml({
    businessName: lead.name,
    previewUrl,
    ownerName,
  });

  try {
    await sendEmail({ to, subject, html, replyTo: ownerEmail });
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        email: to,
        status:
          lead.status === LEAD_STATUS.MOCKED || lead.status === LEAD_STATUS.NEW
            ? LEAD_STATUS.CONTACTED
            : lead.status,
      },
    });
    await prisma.outreachLog.create({
      data: {
        leadId,
        channel: "email",
        toAddress: to,
        subject,
        status: "sent",
      },
    });
  } catch (err) {
    await prisma.outreachLog.create({
      data: {
        leadId,
        channel: "email",
        toAddress: to,
        subject,
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
      },
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "send failed" },
      { status: 500 },
    );
  }

  return NextResponse.redirect(new URL(`/admin/leads/${leadId}`, req.url), {
    status: 303,
  });
}

function outreachHtml(opts: {
  businessName: string;
  previewUrl: string;
  ownerName: string;
}) {
  return `
    <p>Hi —</p>
    <p>I noticed <strong>${opts.businessName}</strong> doesn't have a website
    (or has one that's not really working for you), so I went ahead and built
    one as a mockup. No obligation, just wanted to show you what's possible.</p>

    <p><strong>Preview here:</strong><br>
    <a href="${opts.previewUrl}">${opts.previewUrl}</a></p>

    <p>If you like it, the page has a button to make it live on your own domain
    for a one-time $650 (we handle hosting for the first year too). If not, no
    worries — just ignore this email.</p>

    <p>Reply with any questions.</p>
    <p>— ${opts.ownerName}</p>
  `;
}
