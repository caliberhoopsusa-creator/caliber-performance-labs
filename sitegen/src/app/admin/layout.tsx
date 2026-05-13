export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Auth is handled by middleware.ts — by the time we render, the request is authorized.
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <a href="/admin" className="font-bold text-lg">
          sitegen admin
        </a>
        <a
          href="/"
          className="text-xs text-neutral-400 hover:text-neutral-100"
        >
          public site →
        </a>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
