// Standalone HTML renderer for the mockup spec — used by the Vercel deploy
// path where we need a single static index.html (no React runtime).
// Visual output should match MockupRenderer.tsx as closely as possible.

import type { MockupSpec } from "./mockup";

export function renderMockupHtml(
  spec: MockupSpec,
  business: { name: string; phone: string | null; address: string | null },
): string {
  const phoneLink = business.phone
    ? `<a href="tel:${escapeAttr(business.phone)}" class="phone">${escapeHtml(business.phone)}</a>`
    : "";

  const ctaHtml = business.phone
    ? `<a href="tel:${escapeAttr(business.phone)}" class="cta">${escapeHtml(spec.cta_label)}</a>`
    : `<span class="cta">${escapeHtml(spec.cta_label)}</span>`;

  const servicesHtml = spec.services
    .map(
      (s) => `
        <div class="card">
          <h3>${escapeHtml(s.title)}</h3>
          <p>${escapeHtml(s.description)}</p>
        </div>`,
    )
    .join("");

  const trustHtml = spec.trust_points
    .map((tp) => `<span class="trust-pt">✓ ${escapeHtml(tp)}</span>`)
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(spec.business_name)}</title>
<meta name="description" content="${escapeAttr(spec.hero_subhead)}">
<style>
  :root {
    --primary: ${escapeAttr(spec.theme.primary)};
    --accent: ${escapeAttr(spec.theme.accent)};
    --bg: ${escapeAttr(spec.theme.background)};
    --text: ${escapeAttr(spec.theme.text)};
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: var(--bg); color: var(--text);
    line-height: 1.55;
  }
  a { color: inherit; }
  header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 1.5rem 2rem;
    max-width: 1100px; margin: 0 auto;
  }
  .brand { font-size: 1.25rem; font-weight: 700; color: var(--primary); }
  .phone { font-size: 0.875rem; font-weight: 500; text-decoration: none; }
  .phone:hover { text-decoration: underline; }
  section { max-width: 1100px; margin: 0 auto; padding: 3rem 2rem; }
  .hero .tagline {
    font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.15em;
    color: var(--accent); margin-bottom: 1rem;
  }
  .hero h1 { font-size: clamp(2.25rem, 5vw, 3.75rem); margin: 0 0 1.5rem; line-height: 1.1; }
  .hero p.sub { font-size: 1.125rem; max-width: 38rem; margin: 0 0 2rem; opacity: 0.85; }
  .ctas { display: flex; flex-wrap: wrap; gap: 1rem; }
  .cta {
    display: inline-block; padding: 0.85rem 1.5rem; border-radius: 0.375rem;
    background: var(--primary); color: white; font-weight: 600;
    text-decoration: none;
  }
  .cta:hover { opacity: 0.9; }
  .cta-secondary {
    display: inline-block; padding: 0.85rem 1.5rem; border-radius: 0.375rem;
    border: 1px solid currentColor; text-decoration: none; font-weight: 500;
  }
  .trust-row {
    display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem;
    margin-top: 2.5rem; font-size: 0.875rem; opacity: 0.85;
  }
  h2 { font-size: clamp(1.5rem, 3vw, 2rem); margin: 0 0 2rem; }
  .grid {
    display: grid; gap: 1.5rem;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  }
  .card {
    padding: 1.5rem; border-radius: 0.5rem;
    background: color-mix(in srgb, var(--bg) 92%, var(--text) 8%);
  }
  .card h3 { color: var(--primary); margin: 0 0 0.5rem; font-size: 1.125rem; }
  .card p { margin: 0; font-size: 0.9375rem; opacity: 0.85; }
  .about p { font-size: 1.125rem; opacity: 0.9; max-width: 44rem; }
  .contact .row { margin-bottom: 0.5rem; }
  .contact .label { display: block; font-size: 0.8125rem; opacity: 0.6; }
  .contact .value { font-weight: 500; }
  footer {
    max-width: 1100px; margin: 0 auto;
    padding: 2rem; font-size: 0.875rem; opacity: 0.6;
    border-top: 1px solid color-mix(in srgb, currentColor 10%, transparent);
  }
</style>
</head>
<body>
<header>
  <div class="brand">${escapeHtml(spec.business_name)}</div>
  ${phoneLink}
</header>

<section class="hero">
  <div class="tagline">${escapeHtml(spec.tagline)}</div>
  <h1>${escapeHtml(spec.hero_headline)}</h1>
  <p class="sub">${escapeHtml(spec.hero_subhead)}</p>
  <div class="ctas">
    ${ctaHtml}
    <a href="#services" class="cta-secondary">See services</a>
  </div>
  <div class="trust-row">${trustHtml}</div>
</section>

<section id="services">
  <h2>What we do</h2>
  <div class="grid">${servicesHtml}</div>
</section>

<section class="about">
  <h2>${escapeHtml(spec.about_heading)}</h2>
  <p>${escapeHtml(spec.about_body)}</p>
</section>

<section class="contact">
  <h2>Get in touch</h2>
  <p>${escapeHtml(spec.contact_blurb)}</p>
  ${business.phone ? `<div class="row"><span class="label">Phone</span><span class="value"><a href="tel:${escapeAttr(business.phone)}">${escapeHtml(business.phone)}</a></span></div>` : ""}
  ${business.address ? `<div class="row"><span class="label">Visit</span><span class="value">${escapeHtml(business.address)}</span></div>` : ""}
</section>

<footer>© ${new Date().getFullYear()} ${escapeHtml(spec.business_name)}. All rights reserved.</footer>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
