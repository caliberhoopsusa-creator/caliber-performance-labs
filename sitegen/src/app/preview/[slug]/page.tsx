import { notFound } from "next/navigation";
import { prisma, LEAD_STATUS } from "@/lib/db";
import { MockupSpecSchema } from "@/lib/mockup";
import { MockupRenderer } from "@/components/MockupRenderer";
import { PRICE_USD_CENTS } from "@/lib/stripe";

type Props = { params: { slug: string } };

export default async function PreviewPage({ params }: Props) {
  const lead = await prisma.lead.findUnique({ where: { slug: params.slug } });
  if (!lead || !lead.mockupSpec) notFound();

  const spec = MockupSpecSchema.parse(JSON.parse(lead.mockupSpec));
  const paid = lead.status === LEAD_STATUS.PAID || lead.status === LEAD_STATUS.DELIVERED;
  const price = (PRICE_USD_CENTS / 100).toFixed(0);

  return (
    <div>
      {!paid && (
        <div className="sticky top-0 z-50 bg-emerald-600 text-white">
          <div className="max-w-5xl mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <strong>Preview</strong> built for {lead.name} — not yet live.
              Like it? Get it shipped on your domain.
            </div>
            <form action={`/api/checkout/${lead.slug}`} method="POST">
              <button
                type="submit"
                className="bg-white text-emerald-700 font-semibold px-4 py-2 rounded text-sm hover:bg-emerald-50"
              >
                Make it live for ${price} →
              </button>
            </form>
          </div>
        </div>
      )}
      <MockupRenderer
        spec={spec}
        business={{ address: lead.address, phone: lead.phone }}
      />
    </div>
  );
}
