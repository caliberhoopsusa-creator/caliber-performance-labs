import type { MockupSpec } from "@/lib/mockup";

type Props = {
  spec: MockupSpec;
  business: {
    address: string | null;
    phone: string | null;
  };
};

export function MockupRenderer({ spec, business }: Props) {
  const { theme } = spec;
  const cssVars = {
    "--m-primary": theme.primary,
    "--m-accent": theme.accent,
    "--m-bg": theme.background,
    "--m-text": theme.text,
  } as React.CSSProperties;

  return (
    <div
      style={cssVars}
      className="font-sans"
    >
      <style>{`
        .m-root { background: var(--m-bg); color: var(--m-text); }
        .m-primary { color: var(--m-primary); }
        .m-primary-bg { background: var(--m-primary); }
        .m-accent { color: var(--m-accent); }
        .m-accent-bg { background: var(--m-accent); }
        .m-card { background: color-mix(in srgb, var(--m-bg) 92%, var(--m-text) 8%); }
      `}</style>

      <div className="m-root min-h-screen">
        <header className="px-6 md:px-12 py-6 flex items-center justify-between">
          <div className="text-xl font-bold m-primary">{spec.business_name}</div>
          {business.phone ? (
            <a
              href={`tel:${business.phone}`}
              className="text-sm font-medium hover:underline"
            >
              {business.phone}
            </a>
          ) : null}
        </header>

        <section className="px-6 md:px-12 py-16 md:py-24 max-w-5xl">
          <div className="text-sm uppercase tracking-widest m-accent mb-4">
            {spec.tagline}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            {spec.hero_headline}
          </h1>
          <p className="text-lg md:text-xl opacity-80 max-w-2xl mb-8">
            {spec.hero_subhead}
          </p>
          <div className="flex flex-wrap gap-4">
            {business.phone ? (
              <a
                href={`tel:${business.phone}`}
                className="m-primary-bg text-white px-6 py-3 rounded font-medium hover:opacity-90"
              >
                {spec.cta_label}
              </a>
            ) : (
              <span className="m-primary-bg text-white px-6 py-3 rounded font-medium">
                {spec.cta_label}
              </span>
            )}
            <a
              href="#services"
              className="border border-current px-6 py-3 rounded font-medium hover:opacity-70"
            >
              See services
            </a>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-10 text-sm opacity-80">
            {spec.trust_points.map((tp, i) => (
              <span key={i}>✓ {tp}</span>
            ))}
          </div>
        </section>

        <section id="services" className="px-6 md:px-12 py-16 max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-10">What we do</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {spec.services.map((s, i) => (
              <div key={i} className="m-card p-6 rounded">
                <h3 className="font-bold text-lg mb-2 m-primary">{s.title}</h3>
                <p className="text-sm opacity-80 leading-relaxed">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 md:px-12 py-16 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            {spec.about_heading}
          </h2>
          <p className="text-lg leading-relaxed opacity-90">{spec.about_body}</p>
        </section>

        <section className="px-6 md:px-12 py-16 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Get in touch</h2>
          <p className="text-lg opacity-90 mb-6">{spec.contact_blurb}</p>
          <div className="space-y-2">
            {business.phone ? (
              <div>
                <span className="opacity-60 text-sm">Phone</span>
                <div className="font-medium">
                  <a href={`tel:${business.phone}`}>{business.phone}</a>
                </div>
              </div>
            ) : null}
            {business.address ? (
              <div>
                <span className="opacity-60 text-sm">Visit</span>
                <div className="font-medium">{business.address}</div>
              </div>
            ) : null}
          </div>
        </section>

        <footer className="px-6 md:px-12 py-8 border-t border-current/10 text-sm opacity-60">
          © {new Date().getFullYear()} {spec.business_name}. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
