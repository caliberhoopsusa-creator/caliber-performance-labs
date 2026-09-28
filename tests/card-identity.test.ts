/**
 * Initials for the empty photo window (shared/cardIdentity.ts).
 *
 * Both card renderers draw this, and it appears on the artifact players
 * actually share, so the edge cases matter: a one word name, a name with a
 * middle name, punctuation, and non-Latin scripts all have to produce
 * something a person would recognise as their own card.
 */
import { describe, it, expect } from "vitest";
import { initialsFor } from "@shared/cardIdentity";

describe("initialsFor", () => {
  it("takes the first and last name", () => {
    expect(initialsFor("Jordan Reyes")).toBe("JR");
  });

  it("skips the middle name rather than showing three letters", () => {
    // The window has room for two. First and last is what a person expects.
    expect(initialsFor("Theo James Nakamura")).toBe("TN");
  });

  it("handles a single name", () => {
    expect(initialsFor("Priya")).toBe("P");
  });

  it("uppercases a lowercase name", () => {
    expect(initialsFor("marcus bell")).toBe("MB");
  });

  it("copes with extra whitespace", () => {
    expect(initialsFor("  Alex   Moreau  ")).toBe("AM");
  });

  it("skips leading punctuation rather than drawing it", () => {
    expect(initialsFor("'Nique Wilkins")).toBe("NW");
  });

  it("works on non-Latin scripts", () => {
    // The audience is not all Latin script, and a mangled initial on your own
    // card is worse than none.
    expect(initialsFor("Дмитрий Иванов")).toBe("ДИ");
  });

  it("returns empty for nothing usable, so the caller draws a plain window", () => {
    expect(initialsFor("")).toBe("");
    expect(initialsFor(null)).toBe("");
    expect(initialsFor(undefined)).toBe("");
    expect(initialsFor("123 456")).toBe("");
  });

  it("never returns more than two characters", () => {
    for (const name of ["A B C D E", "Jordan Reyes", "X"]) {
      expect(initialsFor(name).length).toBeLessThanOrEqual(2);
    }
  });
});
