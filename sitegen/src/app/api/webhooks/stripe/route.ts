import { NextRequest, NextResponse } from "next/server";
import { prisma, LEAD_STATUS } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { sendEmail } from "@/lib/email";
import { deployMockup } from "@/lib/deploy";
import { MockupSpecSchema } from "@/lib/mockup";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET not set" },
      { status: 500 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  const body = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "invalid signature";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const leadId = session.metadata?.leadId;
    if (!leadId) {
      return NextResponse.json({ ok: true, note: "no leadId in metadata" });
    }

    const lead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: LEAD_STATUS.PAID,
        paidAt: new Date(),
        amountCents: session.amount_total ?? null,
        email:
          session.customer_details?.email ??
          session.customer_email ??
          undefined,
      },
    });

    // Auto-deploy to Vercel — best-effort. If it fails, the lead is still
    // PAID and we email the owner so they know to deploy manually.
    let deployUrl: string | null = null;
    let deployError: string | null = null;
    if (process.env.VERCEL_TOKEN && lead.mockupSpec) {
      try {
        const spec = MockupSpecSchema.parse(JSON.parse(lead.mockupSpec));
        const result = await deployMockup({
          slug: lead.slug,
          spec,
          business: {
            name: lead.name,
            phone: lead.phone,
            address: lead.address,
          },
        });
        deployUrl = result.url;
        await prisma.lead.update({
          where: { id: lead.id },
          data: { deployUrl: result.url, deployedAt: new Date() },
        });
      } catch (err) {
        deployError = err instanceof Error ? err.message : String(err);
        console.error("[stripe webhook] auto-deploy failed", deployError);
      }
    }

    const ownerEmail = process.env.OWNER_EMAIL;
    if (ownerEmail && process.env.RESEND_API_KEY) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";
      await sendEmail({
        to: ownerEmail,
        subject: `💰 Paid: ${lead.name} — $${((session.amount_total ?? 0) / 100).toFixed(0)}`,
        html: paidNotifyHtml(lead, baseUrl, session, deployUrl, deployError),
      }).catch((err) => console.error("[stripe webhook] owner notify failed", err));

      const customerEmail =
        session.customer_details?.email ?? session.customer_email ?? lead.email;
      if (customerEmail) {
        await sendEmail({
          to: customerEmail,
          replyTo: ownerEmail,
          subject: `Your new ${lead.name} website — what's next`,
          html: customerIntakeHtml(lead, deployUrl),
        }).catch((err) =>
          console.error("[stripe webhook] customer email failed", err),
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}

function paidNotifyHtml(
  lead: { id: string; name: string; phone: string | null; slug: string },
  baseUrl: string,
  session: { customer_details?: { email?: string | null; name?: string | null } | null },
  deployUrl: string | null,
  deployError: string | null,
) {
  const customerEmail = session.customer_details?.email ?? "(unknown)";
  const customerName = session.customer_details?.name ?? "(unknown)";
  return `
    <h2>New paid lead: ${lead.name}</h2>
    <p><strong>Customer:</strong> ${customerName} &lt;${customerEmail}&gt;</p>
    <p><strong>Business phone:</strong> ${lead.phone ?? "—"}</p>
    ${
      deployUrl
        ? `<p><strong>Auto-deployed:</strong> <a href="${deployUrl}">${deployUrl}</a></p>`
        : deployError
          ? `<p style="color:#b00"><strong>Auto-deploy failed:</strong> ${deployError}</p>`
          : `<p><em>Auto-deploy skipped (VERCEL_TOKEN not set).</em></p>`
    }
    <p><a href="${baseUrl}/preview/${lead.slug}">View mockup</a></p>
    <p><a href="${baseUrl}/admin/leads/${lead.id}">Admin: lead detail</a></p>
  `;
}

function customerIntakeHtml(
  lead: { name: string },
  deployUrl: string | null,
) {
  return `
    <p>Thanks for your order. Your site for <strong>${lead.name}</strong> is in the build queue.</p>
    ${
      deployUrl
        ? `<p>Here's a temporary live URL with the mockup version:<br><a href="${deployUrl}">${deployUrl}</a><br>(This is the AI-generated preview — your final version with real photos/copy comes next.)</p>`
        : ""
    }
    <p>To finish the real version, reply to this email with:</p>
    <ol>
      <li>Your <strong>logo</strong> (or "I don't have one")</li>
      <li>2–4 <strong>photos</strong> of your business or work</li>
      <li>Your <strong>real hours</strong></li>
      <li>The <strong>domain</strong> you want to use (or "pick one for me")</li>
    </ol>
    <p>Once we have those, you'll get a link to the final site within 5–7 days.</p>
  `;
}
