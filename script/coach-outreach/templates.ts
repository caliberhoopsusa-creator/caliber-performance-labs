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

I'm reaching out to basketball coaches in {{state}} about Caliber, a free
player-development platform we built for programs like {{school}}.

In short: your players log their stats after each game (takes under two
minutes), and Caliber turns them into position-weighted A-F grades with
specific improvement feedback. As a coach you get:

- A team dashboard with every player's grades and trends
- Game verification, lineup analytics, and practice tracking
- AI scouting reports you can share with college recruiters

The core platform is free for coaches and players. If you'd like a look,
you can explore it here: https://caliber.app

Happy to answer any questions — just reply to this email.

Best,
{{senderName}}
Caliber Performance Labs`,
  },
  {
    touch: 2,
    subject: "Re: Free game-grading tool for {{school}} basketball",
    body: `Hi Coach {{lastName}},

Following up on my note last week about Caliber. One thing coaches tell us
saves them the most time: the game verification system. Players log their
own stats, you approve them in one tap, and the season averages, grades,
and leaderboards stay accurate without you keeping a spreadsheet.

A program director running three AAU teams told us it saves him 5+ hours
a week.

If {{level}} basketball at {{school}} could use that, it's free to try:
https://caliber.app

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
