export default function Landing() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <div className="text-sm uppercase tracking-widest text-emerald-400 mb-6">
          Done-for-you websites
        </div>
        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
          A clean website for your business. $650, live in a week.
        </h1>
        <p className="text-xl text-neutral-300 mb-10">
          We pre-build a custom site for your business and email you a preview.
          If you like it, pay $650 and we ship it live with your real photos,
          hours, and contact info.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Feature
            title="Mobile + Google-ready"
            body="Fast, responsive, set up for local search so customers find you."
          />
          <Feature
            title="No subscription"
            body="One-time $650. We hand you the domain and the keys."
          />
          <Feature
            title="Revisions included"
            body="Two rounds of edits to make it yours after payment."
          />
        </div>

        <p className="text-neutral-400 text-sm">
          Got a preview link?{" "}
          <span className="text-neutral-100">Open it from the email we sent you.</span>
        </p>
      </div>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-neutral-800 rounded p-6">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-neutral-400">{body}</p>
    </div>
  );
}
