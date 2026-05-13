export default function Thanks() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <div className="text-sm uppercase tracking-widest text-emerald-400 mb-6">
          Payment received
        </div>
        <h1 className="text-4xl font-bold mb-4">Thanks — we&apos;re on it.</h1>
        <p className="text-lg text-neutral-300 mb-8">
          You&apos;ll get an email within one business day with a short intake
          form (logo, photos, real hours). After that, your site goes live
          within 5–7 days.
        </p>
        <p className="text-sm text-neutral-500">
          Questions? Just reply to the email we just sent you.
        </p>
      </div>
    </main>
  );
}
