/**
 * Every word on the CALIBER front door, in one file.
 *
 * Section 4C asks for copy to ship separately from layout. Keeping all strings
 * here makes the copy review a one file diff instead of a hunt through JSX.
 *
 * Rules this file is held to (docs/CALIBER_DESIGN.md section 7):
 *   - No em dashes anywhere.
 *   - Sentence case for buttons and headlines. No Title Case.
 *   - None of the banned phrases. `npm run check` fails the build on them.
 *   - No fabricated numbers. No counters, no "trusted by", no testimonials.
 */

export const landingCopy = {
  /** The single H1. No variants, by decision. */
  h1: "What's your Caliber?",

  subhead: "Upload a clip. Get your Caliber Grade in 24 hours. See where you stack up.",

  primaryCta: "Get my grade",

  /** Paid ad and SEO line. Deliberately NOT the H1. */
  metaDescription:
    "The credit score for basketball players. Upload a clip, get your Caliber Grade, see where you stack up.",

  pageTitle: "Caliber",

  /** Below the fold: what other players' cards look like when shared. */
  shareSection: {
    eyebrow: "Shared cards",
    heading: "This is what lands in the group chat",
  },

  /** Three steps, one sentence each. */
  howItWorks: {
    eyebrow: "How it works",
    steps: [
      {
        title: "Upload clip",
        body: "One game, one highlight, or a full film. Phone footage is fine.",
      },
      {
        title: "Get graded",
        body: "Your Caliber Grade lands within 24 hours, built from what you actually did.",
      },
      {
        title: "Share your card",
        body: "Post it, send it, or keep it. The card is yours either way.",
      },
    ],
  },

  founding: {
    eyebrow: "Founding class",
    heading: "First 500 players get lifetime founding grades.",
    body: "No counter here, because we are not going to fake one. You will know if you made it.",
  },

  footer: {
    note: "Caliber is built in Missoula, Montana.",
    privacy: "Privacy",
    terms: "Terms",
  },
} as const;

/**
 * Placeholder athlete for the hero card.
 *
 * Not a real player and not real numbers. Fixed by the brief so the hero stays
 * identical across every surface that shows it.
 */
export const heroPlaceholder = {
  name: "Jordan Reyes",
  position: "SG",
  classYear: "'27",
  school: "Missoula Sentinel",
  grade: "A-",
  tier: "prism" as const,
  stats: [
    { label: "PPG", value: "22.4" },
    { label: "FG%", value: "48%" },
  ] as [{ label: string; value: string }, { label: string; value: string }],
  profileUrl: "caliber.app/jordanreyes",
};

/**
 * The four example cards below the fold, with the caption each would carry if
 * a player shared it. Captions are written the way a teenager writes, because
 * pretending otherwise is the fastest way to lose them.
 */
export const shareExamples = [
  {
    frame: "story" as const,
    caption: "first one. locked in",
    card: {
      name: "Alex Moreau", position: "PG", classYear: "'28",
      school: "Hellgate", grade: "B+", tier: "hot" as const,
      stats: [{ label: "PPG", value: "14.2" }, { label: "APG", value: "6.1" }] as [
        { label: string; value: string }, { label: string; value: string },
      ],
      profileUrl: "caliber.app/alexmoreau",
    },
  },
  {
    frame: "imessage" as const,
    caption: "bro got chrome",
    card: {
      name: "Theo Nakamura", position: "SF", classYear: "'26",
      school: "Big Sky", grade: "A+", tier: "chrome" as const,
      stats: [{ label: "PPG", value: "27.8" }, { label: "RPG", value: "9.4" }] as [
        { label: string; value: string }, { label: string; value: string },
      ],
      profileUrl: "caliber.app/theonakamura",
    },
  },
  {
    frame: "imessage" as const,
    caption: "day one. we go up from here",
    card: {
      name: "Priya Raman", position: "SG", classYear: "'29",
      school: "Sentinel", grade: "C+", tier: "rookie" as const,
      stats: [{ label: "PPG", value: "8.6" }, { label: "STL", value: "2.3" }] as [
        { label: string; value: string }, { label: string; value: string },
      ],
      profileUrl: "caliber.app/priyaraman",
    },
  },
  {
    frame: "story" as const,
    caption: "moved up two tiers this season",
    card: {
      name: "Marcus Bell", position: "C", classYear: "'27",
      school: "Loyola", grade: "A-", tier: "prism" as const,
      stats: [{ label: "PPG", value: "19.1" }, { label: "BLK", value: "3.2" }] as [
        { label: string; value: string }, { label: string; value: string },
      ],
      profileUrl: "caliber.app/marcusbell",
    },
  },
];

/** Sign up, Section 4B. Under 20 seconds on a phone. */
export const signupCopy = {
  heading: "Get your Caliber Grade",
  subhead: "Five things. Takes about twenty seconds.",

  fields: {
    position: "Position",
    classYear: "Class year",
    school: "School",
    phone: "Phone number",
    phoneHelp: "We text your grade when it lands. Nothing else.",
    dateOfBirth: "Date of birth",
    dateOfBirthHelp: "We use this to check you are 13 or older.",
    email: "Email",
    password: "Password",
  },

  submit: "Create my account",

  coachLink: "I'm a coach",

  errors: {
    under13: "You need to be 13 or older to make an account. Ask a parent or guardian to get in touch.",
    missingDob: "Please add your date of birth.",
    generic: "Something went wrong. Please try again.",
  },
} as const;

/** The state a player lands in immediately after sign up. */
export const gradePendingCopy = {
  heading: "Your Caliber lands in 24 hours",
  body: "We are grading your film now. You will get a text the moment it is ready.",
  primaryCta: "Get notified",
  ctaDone: "You're on the list",
  secondary: "Upload another clip",
  silhouetteLabel: "Grade pending",
} as const;
