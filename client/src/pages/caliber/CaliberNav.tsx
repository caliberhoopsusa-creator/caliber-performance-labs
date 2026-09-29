/**
 * The only chrome on the player's CALIBER pages.
 *
 * Replaces the SIGNAL header, stats ticker, email banner, bottom bar and
 * floating action button on the demo path. That stack took ~190px above the
 * card on a 390x844 phone, and carried a theme toggle and the SIGNAL crimson
 * logo, both refused by CALIBER_DESIGN.md section 7.
 *
 * One slim row: the wordmark home, the two places a player goes (their card
 * and the board), and a way out. Nothing that repeats what the card says.
 */
import { Link, useLocation } from "wouter";
import { color, font, DISPLAY_AXES } from "@/design/caliber/tokens";

const NAV_HEIGHT = 52;

/* Card, board, and the one action that changes anything. A grade only moves
   when a game is logged (shared/progression.ts), so leaving Log out of the
   nav would make the product a dead end once the SIGNAL bottom bar is gone. */
const LINKS = [
  { href: "/", label: "Card" },
  { href: "/leaderboard", label: "Board" },
  { href: "/analyze", label: "Log" },
] as const;

const linkBase: React.CSSProperties = {
  fontFamily: font.body,
  fontSize: 14,
  textDecoration: "none",
  padding: "12px 10px",
  minHeight: 44,
  display: "inline-flex",
  alignItems: "center",
};

export function CaliberNav() {
  const [location] = useLocation();

  return (
    <nav
      aria-label="CALIBER"
      data-testid="caliber-nav"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        height: NAV_HEIGHT,
        boxSizing: "content-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "env(safe-area-inset-top, 0px) 12px 0",
        background: color.court,
        borderBottom: `1px solid ${color.chalk}`,
      }}
    >
      <Link
        href="/"
        aria-label="CALIBER home"
        style={{
          ...linkBase,
          fontFamily: font.display,
          fontWeight: DISPLAY_AXES.fontWeight,
          fontStretch: DISPLAY_AXES.fontStretch,
          fontSize: 16,
          letterSpacing: "0.06em",
          color: color.bone,
        }}
      >
        CALIBER
      </Link>
      <div style={{ display: "flex", alignItems: "center" }}>
        {LINKS.map(({ href, label }) => {
          const active = location === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              data-testid={`caliber-nav-${label.toLowerCase()}`}
              style={{
                ...linkBase,
                color: active ? color.bone : color.fog,
                textDecoration: active ? "underline" : "none",
                textUnderlineOffset: 6,
              }}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * The footer on CALIBER pages.
 *
 * Carries sign out, which keeps the top row fitting a 390px phone, and the
 * policy links. Those had no home in the signed in app at all: the SIGNAL
 * sidebar's Account section holds only Pricing, so a 14 year old could not
 * reach the privacy policy from anywhere once signed in. On a product built
 * for minors that is not a detail.
 */
export function CaliberFooter() {
  return (
    <footer
      data-testid="caliber-footer"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 4,
        padding: "20px 12px calc(20px + env(safe-area-inset-bottom, 0px))",
        borderTop: `1px solid ${color.chalk}`,
        background: color.court,
      }}
    >
      <Link href="/privacy" style={{ ...linkBase, color: color.fog, fontSize: 13 }}>
        Privacy
      </Link>
      <Link href="/terms" style={{ ...linkBase, color: color.fog, fontSize: 13 }}>
        Terms
      </Link>
      <a
        href="/api/logout"
        data-testid="caliber-nav-signout"
        style={{ ...linkBase, color: color.fog, fontSize: 13 }}
      >
        Sign out
      </a>
    </footer>
  );
}
