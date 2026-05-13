import { NextRequest, NextResponse } from "next/server";
import { prisma, LEAD_STATUS } from "@/lib/db";
import { generateMockupSpec } from "@/lib/mockup";
import { MOCKUP_MODEL } from "@/lib/anthropic";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const leadId = String(form.get("leadId") ?? "");
  if (!leadId) {
    return NextResponse.json({ error: "leadId required" }, { status: 400 });
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return NextResponse.json({ error: "lead not found" }, { status: 404 });

  const spec = await generateMockupSpec({
    name: lead.name,
    category: lead.category,
    address: lead.address,
    phone: lead.phone,
    rating: lead.rating,
    reviewCount: lead.reviewCount,
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      mockupSpec: JSON.stringify(spec),
      mockupModel: MOCKUP_MODEL,
      generatedAt: new Date(),
      status: lead.status === LEAD_STATUS.NEW ? LEAD_STATUS.MOCKED : lead.status,
    },
  });

  return NextResponse.redirect(new URL(`/admin/leads/${leadId}`, req.url), {
    status: 303,
  });
}
