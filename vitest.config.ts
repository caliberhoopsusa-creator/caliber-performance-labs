import { defineConfig } from "vitest/config";
import path from "path";
import { readFileSync } from "fs";

// Parse .env file to inject environment variables for tests
function loadDotEnv(filePath: string): Record<string, string> {
  try {
    const content = readFileSync(filePath, "utf-8");
    const result: Record<string, string> = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      result[key] = value;
    }
    return result;
  } catch {
    return {};
  }
}

const envVars = loadDotEnv(path.resolve(__dirname, ".env"));

/* The coach, recruiter and guardian products ship dark (pivot Section 2), but
 * most suites here exist to test ROLE enforcement on those surfaces, which
 * needs them reachable. Turn all three on for the test run so those suites keep
 * asserting what they were written to assert.
 *
 * tests/feature-flags.test.ts owns the dark behaviour and sets these to "false"
 * itself in a beforeEach, restoring the originals afterwards. Keep that file as
 * the single place that exercises a switched off product. */
const testEnv: Record<string, string> = {
  ...envVars,
  ENABLE_COACH_PRODUCT: "true",
  ENABLE_RECRUITER_PRODUCT: "true",
  ENABLE_GUARDIAN_PRODUCT: "true",
};

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 90000,
    hookTimeout: 60000,
    // Single fork, sequential file execution so tests don't share DB state in parallel
    pool: "forks",
    singleFork: true,
    fileParallelism: false,
    env: testEnv,
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "./shared"),
      "@": path.resolve(__dirname, "./client/src"),
    },
  },
});
