import { prisma, LEAD_STATUS } from "@/lib/db";

const STATUS_ORDER: Record<string, number> = {
  PAID: 0,
  REPLIED: 1,
  CONTACTED: 2,
  MOCKED: 3,
  NEW: 4,
  REJECTED: 5,
  DELIVERED: -1,
};

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [counts, recent] = await Promise.all([
    prisma.lead.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.lead.findMany({
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
  ]);

  const summary = Object.fromEntries(
    counts.map((c) => [c.status, c._count.status]),
  );

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-sm uppercase tracking-widest text-neutral-500 mb-3">
          Pipeline
        </h2>
        <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
          {Object.values(LEAD_STATUS).map((s) => (
            <div
              key={s}
              className="border border-neutral-800 rounded p-3 text-center"
            >
              <div className="text-xs text-neutral-500">{s}</div>
              <div className="text-2xl font-bold">{summary[s] ?? 0}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-widest text-neutral-500 mb-3">
          Actions
        </h2>
        <FindLeadsForm />
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-widest text-neutral-500 mb-3">
          Recent leads
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-neutral-800 text-neutral-400">
                <th className="py-2 pr-3">Business</th>
                <th className="py-2 pr-3">Area</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Updated</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {recent
                .sort(
                  (a, b) =>
                    (STATUS_ORDER[a.status] ?? 99) -
                    (STATUS_ORDER[b.status] ?? 99),
                )
                .map((l) => (
                  <tr key={l.id} className="border-b border-neutral-900">
                    <td className="py-2 pr-3">
                      <div className="font-medium">{l.name}</div>
                      <div className="text-xs text-neutral-500">
                        {l.category ?? "—"}
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-neutral-400">{l.area}</td>
                    <td className="py-2 pr-3">
                      <StatusPill status={l.status} />
                    </td>
                    <td className="py-2 pr-3 text-neutral-500 text-xs">
                      {l.updatedAt.toISOString().slice(0, 16).replace("T", " ")}
                    </td>
                    <td className="py-2 pr-3">
                      <a
                        href={`/admin/leads/${l.id}`}
                        className="text-emerald-400 hover:underline"
                      >
                        open →
                      </a>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {recent.length === 0 && (
            <p className="text-neutral-500 py-4">
              No leads yet. Run a search above.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    NEW: "bg-neutral-800 text-neutral-300",
    MOCKED: "bg-sky-900 text-sky-200",
    CONTACTED: "bg-amber-900 text-amber-200",
    REPLIED: "bg-purple-900 text-purple-200",
    PAID: "bg-emerald-700 text-emerald-100",
    DELIVERED: "bg-emerald-900 text-emerald-200",
    REJECTED: "bg-red-900 text-red-200",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs ${colors[status] ?? "bg-neutral-800"}`}
    >
      {status}
    </span>
  );
}

function FindLeadsForm() {
  return (
    <form
      action="/api/admin/find-leads"
      method="POST"
      className="border border-neutral-800 rounded p-4 grid gap-3 md:grid-cols-[2fr_2fr_1fr_auto]"
    >
      <label className="block">
        <span className="text-xs text-neutral-500">Category (e.g. plumber)</span>
        <input
          name="query"
          required
          className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 mt-1"
          placeholder="plumber"
        />
      </label>
      <label className="block">
        <span className="text-xs text-neutral-500">Area (city, ZIP, or region)</span>
        <input
          name="area"
          required
          className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 mt-1"
          placeholder="Cleveland, OH"
        />
      </label>
      <label className="block">
        <span className="text-xs text-neutral-500">Max pages (20 per page)</span>
        <input
          name="maxPages"
          type="number"
          defaultValue={2}
          min={1}
          max={3}
          className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 mt-1"
        />
      </label>
      <button
        type="submit"
        className="self-end bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded font-medium"
      >
        Find leads
      </button>
    </form>
  );
}
