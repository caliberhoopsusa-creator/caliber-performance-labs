// Coach outreach email sequence — 3 touches, spaced ~4 days apart.
// Tokens: {{firstName}} {{lastName}} {{school}} {{city}} {{state}} {{level}}
// Compliance: subjects must stay truthful; the physical-address +
// unsubscribe footer is appended by send.ts and must never be removed.

export interface EmailTemplate {
  touch: number;
  subject: string;
  body: string;
}

export const templates: EmailTemplate[] = [
  {
    touch: 1,
    subject: "Free game-grading tool for {{school}} basketball",
    body: `Hi Coach {{lastName}},

I'm the founder of Caliber, a player-development platform I'm launching
with {{state}} basketball programs first.

In short: your players log their stats after each game (takes under two
minutes), and Caliber's AI turns them into position-weighted A-F grades
with specific improvement feedback. As a coach you get:

- A team dashboard with every player's grades and trends
- Game verification, lineup analytics, and practice tracking
- AI scouting reports you can share with college recruiters

I'll be straight with you: we're early, and that's the opportunity. I'm
looking for a handful of {{state}} programs to be founding teams — free
access, set up personally by me, and a direct line to shape what gets
built next.

Want proof before you commit ten minutes? Reply with the stat sheet from
your last game and I'll send back a graded report card for every player
within a day — free, no signup. If your kids don't find it useful,
delete my email. Or take a look first: https://caliber.app

Best,
{{senderName}}
Caliber Performance Labs`,
  },
  {
    touch: 2,
    subject: "What Caliber looks like for {{school}} basketball",
    body: `Hi Coach {{lastName}},

Following up on my note about Caliber. Here's what a week of it actually
looks like for a {{level}} program:

- A player logs 14 pts / 6 reb / 3 ast after Tuesday's game
- Caliber grades it for their position and minutes — with two or three
  specific things to work on before Friday
- You approve the stat line in one tap, and season averages, grades, and
  leaderboards stay accurate with no spreadsheet
- When a college coach looks, your player has a verified, season-long
  graded record — not just a highlight reel

The big platforms make you choose between film tools and stat books.
Caliber's bet is that AI can grade the game itself, and your players
deserve that without the big-school price tag.

Free for founding {{state}} programs. Reply and I'll set {{school}} up
personally: https://caliber.app

Best,
{{senderName}}
Caliber Performance Labs`,
  },
  {
    touch: 3,
    subject: "Last note — Caliber for {{school}}",
    body: `Hi Coach {{lastName}},

Last note from me, I promise. If player development tracking isn't a
priority right now, no worries at all.

If it ever is: Caliber gives {{school}} players free performance grades
after every game, and gives you the coaching dashboard to go with it.
Setup takes about five minutes: https://caliber.app

Either way, good luck this season in {{city}}.

Best,
{{senderName}}
Caliber Performance Labs`,
  },
];

export function renderTemplate(text: string, tokens: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = tokens[key];
    if (value === undefined || value === "") {
      throw new Error(`Missing template token: ${key}`);
    }
    return value;
  });
}
