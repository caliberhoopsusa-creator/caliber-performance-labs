import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe, PRICE_USD_CENTS } from "@/lib/stripe";

export async function POST(
  _req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const lead = await prisma.lead.findUnique({ where: { slug: params.slug } });
  if (!lead || !lead.mockupSpec) {
    return NextResponse.json({ error: "preview not found" }, { status: 404 });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: PRICE_USD_CENTS,
          product_data: {
            name: `Custom website for ${lead.name}`,
            description: "One-time build, hosted for 12 months, your domain.",
          },
        },
        quantity: 1,
      },
    ],
    customer_email: lead.email ?? undefined,
    metadata: { leadId: lead.id, slug: lead.slug },
    success_url: `${baseUrl}/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/preview/${lead.slug}`,
  });

  await prisma.lead.update({
    where: { id: lead.id },
    data: { stripeSessionId: session.id },
  });

  if (!session.url) {
    return NextResponse.json({ error: "stripe did not return url" }, { status: 500 });
  }

  return NextResponse.redirect(session.url, { status: 303 });
}
