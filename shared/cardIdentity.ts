/**
 * Card identity helpers shared by the two renderers.
 *
 * The client card (`client/src/design/caliber/Card.tsx`) and the server card
 * (`server/cardRenderer.ts`) draw the same object and must agree. The grade
 * ladder lived in five places once and drifted, which is why anything both
 * renderers need lands here instead.
 */

/**
 * The initials shown when a player has no photo.
 *
 * A card is a portrait, so an empty photo window reads as broken rather than
 * as pending. Initials are the convention people already know from avatars:
 * they fill the frame, they are specific to this player, and they promise
 * nothing that is not true. The alternative was stock photography, which the
 * design system refuses, and inventing a face for a real teenager would be
 * worse than refusing it.
 *
 * Returns at most two letters. An empty or unusable name gives an empty
 * string, and the caller draws the plain window rather than a stray glyph.
 */
export function initialsFor(name: string | null | undefined): string {
  if (!name) return "";

  const words = name
    .trim()
    .split(/\s+/)
    .filter((w) => /\p{L}/u.test(w));

  if (words.length === 0) return "";

  const first = firstLetter(words[0]!);
  if (words.length === 1) return first;

  return (first + firstLetter(words[words.length - 1]!)).slice(0, 2);
}

/** The first actual letter of a word, uppercased. Skips stray punctuation. */
function firstLetter(word: string): string {
  const match = word.match(/\p{L}/u);
  return match ? match[0]!.toUpperCase() : "";
}
