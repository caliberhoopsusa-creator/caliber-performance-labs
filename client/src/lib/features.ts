/**
 * Client side product feature flags.
 *
 * Reads the VITE_ prefixed environment and hands it to the pure helpers in
 * shared/features, so this guard and the server middleware agree.
 *
 * The VITE_ half must be set alongside the server half, matching the existing
 * DISABLE_SUBSCRIPTION_GATE / VITE_DISABLE_SUBSCRIPTION_GATE pattern. If they
 * disagree the client is only ever the stricter of the two in practice, because
 * the server answers 404 regardless of what the client believes. Hiding a
 * surface is a courtesy; the server is the enforcement.
 */
import { readFlags, type FeatureFlags } from "@shared/features";

/**
 * Vite inlines import.meta.env at build time, so this is a constant in the
 * bundle rather than a runtime lookup.
 */
export const featureFlags: FeatureFlags = readFlags(
  import.meta.env as unknown as Record<string, unknown>,
  "VITE_",
);

export function useFeatureFlags(): FeatureFlags {
  return featureFlags;
}
