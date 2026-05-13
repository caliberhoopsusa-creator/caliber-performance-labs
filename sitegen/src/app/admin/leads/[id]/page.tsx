import { notFound } from "next/navigation";
import { prisma, LEAD_STATUS } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LeadDetail({
  params,
}: {
  params: { id: string };
}) {
  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: { outreach: { orderBy: { sentAt: "desc" } } },
  });
  if (!lead) notFound();

  return (
    <div className="space-y-6">
      <div>
        <a
          href="/admin"
          className="text-neutral-400 hover:text-neutral-100 text-sm"
        >
          ← all leads
        </a>
      </div>

      <header>
        <h1 className="text-3xl font-bold">{lead.name}</h1>
        <div className="text-neutral-400 mt-1">
          {lead.category ?? "—"} · {lead.area}
        </div>
      </header>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="border border-neutral-800 rounded p-4 space-y-2 text-sm">
          <Row label="Status" value={lead.status} />
          <Row label="Address" value={lead.address ?? "—"} />
          <Row label="Phone" value={lead.phone ?? "—"} />
          <Row label="Existing website" value={lead.website ?? "(none)"} />
          <Row label="Email" value={lead.email ?? "—"} />
          <Row
            label="Google rating"
            value={
              lead.rating
                ? `${lead.rating} ★ (${lead.reviewCount ?? 0})`
                : "—"
            }
          />
          {lead.paidAt && (
            <Row
              label="Paid"
              value={`${(lead.amountCents ?? 0) / 100} USD on ${lead.paidAt.toISOString().slice(0, 10)}`}
            />
          )}
        </div>

        <div className="space-y-3">
          {lead.mockupSpec ? (
            <a
              href={`/preview/${lead.slug}`}
              target="_blank"
              className="block border border-neutral-800 rounded p-4 hover:bg-neutral-900"
            >
              <div className="text-xs text-neutral-500 mb-1">PREVIEW</div>
              <div className="font-medium">/preview/{lead.slug}</div>
              <div className="text-xs text-neutral-500 mt-1">
                generated {lead.generatedAt?.toISOString().slice(0, 16).replace("T", " ")}
              </div>
            </a>
          ) : (
            <form
              action={`/api/admin/generate-mockup`}
              method="POST"
              className="border border-neutral-800 rounded p-4"
            >
              <input type="hidden" name="leadId" value={lead.id} />
              <div className="text-xs text-neutral-500 mb-2">PREVIEW</div>
              <p className="text-sm mb-3 text-neutral-400">
                No mockup yet. Generate one with Claude.
              </p>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded text-sm"
              >
                Generate mockup
              </button>
            </form>
          )}

          {lead.mockupSpec && (
            <form
              action={`/api/admin/resend-mockup`}
              method="POST"
              className="border border-neutral-800 rounded p-4"
            >
              <input type="hidden" name="leadId" value={lead.id} />
              <div className="text-xs text-neutral-500 mb-2">REGENERATE</div>
              <button
                type="submit"
                className="border border-neutral-700 hover:bg-neutral-900 px-3 py-1.5 rounded text-sm"
              >
                Regenerate mockup
              </button>
            </form>
          )}

          {lead.mockupSpec &&
            lead.status !== LEAD_STATUS.PAID &&
            lead.status !== LEAD_STATUS.DELIVERED && (
              <form
                action={`/api/admin/send-outreach`}
                method="POST"
                className="border border-neutral-800 rounded p-4 grid gap-3"
              >
                <input type="hidden" name="leadId" value={lead.id} />
                <div className="text-xs text-neutral-500">OUTREACH</div>
                <input
                  name="to"
                  defaultValue={lead.email ?? ""}
                  placeholder="customer@example.com"
                  className="bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm"
                  required
                />
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded text-sm"
                >
                  Send preview email
                </button>
              </form>
            )}
        </div>
      </section>

      {lead.outreach.length > 0 && (
        <section>
          <h2 className="text-sm uppercase tracking-widest text-neutral-500 mb-3">
            Outreach history
          </h2>
          <ul className="space-y-2 text-sm">
            {lead.outreach.map((o) => (
              <li
                key={o.id}
                className="border border-neutral-800 rounded p-3 flex justify-between"
              >
                <div>
                  <div className="font-medium">
                    {o.channel} → {o.toAddress}
                  </div>
                  {o.subject && (
                    <div className="text-neutral-500 text-xs">{o.subject}</div>
                  )}
                  {o.error && (
                    <div className="text-red-400 text-xs mt-1">{o.error}</div>
                  )}
                </div>
                <div className="text-right text-xs text-neutral-500">
                  <div>{o.status}</div>
                  <div>{o.sentAt.toISOString().slice(0, 16).replace("T", " ")}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-neutral-900 pb-2 last:border-0 last:pb-0">
      <span className="text-neutral-500">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
