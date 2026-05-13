// Vercel deploy on payment — https://vercel.com/docs/rest-api/endpoints/deployments
//
// After Stripe webhook fires, we deploy a static snapshot of the customer's
// approved mockup to a fresh Vercel project. This gives them a working URL
// (e.g. https://acme-plumbing-abc123.vercel.app) within minutes.
//
// They later replace photos/logo/hours by replying to the intake email — at
// that point you push a real version. The auto-deploy is a "we're already
// working on it" confidence signal, not the final site.

import type { MockupSpec } from "./mockup";
import { renderMockupHtml } from "./render-html";

const BASE = "https://api.vercel.com";

export type DeployResult = {
  url: string;
  deploymentId: string;
};

export async function deployMockup(opts: {
  slug: string;
  spec: MockupSpec;
  business: { name: string; phone: string | null; address: string | null };
}): Promise<DeployResult> {
  const token = process.env.VERCEL_TOKEN;
  if (!token) throw new Error("VERCEL_TOKEN not set");
  const teamId = process.env.VERCEL_TEAM_ID; // optional

  const html = renderMockupHtml(opts.spec, opts.business);
  const projectName = sanitizeName(opts.slug);

  // One-shot deployment via the Vercel "files" API: we upload the static
  // files inline as part of the deployment payload. No git repo, no build
  // step — just a single HTML file served as /index.html.
  const url = new URL(`${BASE}/v13/deployments`);
  if (teamId) url.searchParams.set("teamId", teamId);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: projectName,
      project: projectName,
      target: "production",
      files: [
        {
          file: "index.html",
          data: html,
        },
      ],
      projectSettings: { framework: null },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Vercel deploy ${res.status}: ${text}`);
  }

  const json = (await res.json()) as { id: string; url: string };
  return {
    deploymentId: json.id,
    url: json.url.startsWith("http") ? json.url : `https://${json.url}`,
  };
}

function sanitizeName(input: string): string {
  // Vercel project names: lowercase, alphanumeric + hyphens, max 100 chars,
  // can't start or end with hyphen.
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}
