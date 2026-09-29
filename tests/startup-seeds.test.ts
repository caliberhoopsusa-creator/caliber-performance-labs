import { describe, it, expect, vi } from "vitest";
import { shouldRunStartupSeeds, runStartupSeeds } from "../server/seeds/startup";

describe("shouldRunStartupSeeds", () => {
  it("runs by default, so a fresh database still gets its reference data", () => {
    expect(shouldRunStartupSeeds({})).toBe(true);
  });

  it("skips only on the exact string true", () => {
    expect(shouldRunStartupSeeds({ SKIP_STARTUP_SEEDS: "true" })).toBe(false);
    expect(shouldRunStartupSeeds({ SKIP_STARTUP_SEEDS: "1" })).toBe(true);
    expect(shouldRunStartupSeeds({ SKIP_STARTUP_SEEDS: "false" })).toBe(true);
  });
});

describe("runStartupSeeds", () => {
  it("runs every step in order", async () => {
    const calls: string[] = [];
    const step = (name: string) => async () => { calls.push(name); };

    await runStartupSeeds([step("a"), step("b"), step("c")]);

    expect(calls).toEqual(["a", "b", "c"]);
  });

  it("logs a failure instead of rejecting, so a seed can never crash a booted server", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const failing = async () => { throw new Error("neon hiccup"); };

    await expect(runStartupSeeds([failing])).resolves.toBeUndefined();
    expect(error).toHaveBeenCalledWith("Failed to seed colleges:", expect.any(Error));

    error.mockRestore();
  });
});
