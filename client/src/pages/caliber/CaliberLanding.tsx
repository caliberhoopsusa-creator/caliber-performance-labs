/**
 * The CALIBER front door (pivot Section 4A).
 *
 * One version. No A/B variants, by decision.
 *
 * Replaces the SIGNAL era "THE CALL" scrollytelling at `/`. That page told a
 * cinematic story about being noticed; this one shows a player the thing they
 * came for and asks for a clip. The hero is the actual card component, not a
 * picture of one, so what a visitor sees is what they get.
 *
 * Every word lives in ./landingCopy so copy review is a one file diff.
 * No testimonials, no trust badges, no counters, no invented numbers.
 */
import { Link } from "wouter";
import { useEffect } from "react";
import { CaliberCard } from "@/design/caliber/Card";
import { color, font, radius, DISPLAY_AXES } from "@/design/caliber/tokens";
import { landingCopy, heroPlaceholder, shareExamples } from "./landingCopy";

/** display and micro helpers, so the axis settings are not retyped per rule. */
const display: React.CSSProperties = {
  fontFamily: font.display,
  fontWeight: DISPLAY_AXES.fontWeight,
  fontStretch: DISPLAY_AXES.fontStretch,
  letterSpacing: "-0.02em",
  lineHeight: 1.05,
};

const micro: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: color.fog,
};

/** An Instagram story frame around a card. Chrome only, no fake UI chrome. */
function StoryFrame({ children, caption }: { children: React.ReactNode; caption: string }) {
  return (
    <figure style={{ margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          borderRadius: 24,
          padding: 10,
          background: "linear-gradient(160deg, rgba(124,77,255,0.25), rgba(255,45,45,0.18))",
          border: `1px solid ${color.chalk}`,
        }}
      >
        <div style={{ borderRadius: 16, overflow: "hidden" }}>{children}</div>
      </div>
      <figcaption style={{ ...micro, textTransform: "none", letterSpacing: 0, fontSize: 13 }}>
        {caption}
      </figcaption>
    </figure>
  );
}

/** An iMessage bubble around a card. */
function MessageFrame({ children, caption }: { children: React.ReactNode; caption: string }) {
  return (
    <figure style={{ margin: 0, display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
      <div
        style={{
          borderRadius: 18,
          padding: 8,
          background: "rgba(245,241,232,0.07)",
          border: `1px solid ${color.chalk}`,
        }}
      >
        <div style={{ borderRadius: 12, overflow: "hidden" }}>{children}</div>
      </div>
      <div
        style={{
          alignSelf: "flex-start",
          background: "rgba(245,241,232,0.10)",
          borderRadius: radius.pill,
          padding: "8px 14px",
          fontSize: 13,
          color: color.bone,
          maxWidth: "100%",
        }}
      >
        {caption}
      </div>
    </figure>
  );
}

export default function CaliberLanding() {
  /* React 19 hoists document metadata from JSX, but this app is on React 18,
     so the title and description are set here rather than through a helmet
     dependency that would have to cross the upgrade boundary later. */
  useEffect(() => {
    document.title = landingCopy.pageTitle;
    let tag = document.querySelector('meta[name="description"]');
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute("name", "description");
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", landingCopy.metaDescription);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: color.court,
        color: color.bone,
        fontFamily: font.body,
      }}
    >
      <style>{`
        .cal-wrap { max-width: 1120px; margin: 0 auto; padding: 0 20px; }
        .cal-hero { display: grid; gap: 32px; padding: 32px 0 64px; }
        /* Mobile: the card sits ABOVE the copy, because the card is the thing
           worth scrolling for. Desktop moves it to the right of the copy. */
        .cal-hero-card { width: 100%; max-width: 340px; justify-self: center; order: -1; }
        .cal-h1 { font-size: 48px; }
        .cal-shares { display: grid; gap: 32px; grid-template-columns: 1fr; }
        .cal-steps { display: grid; gap: 24px; grid-template-columns: 1fr; }
        @media (min-width: 880px) {
          .cal-hero {
            grid-template-columns: 1.1fr 0.9fr;
            align-items: center;
            padding: 64px 0 96px;
          }
          .cal-hero-copy { order: 1; }
          .cal-hero-card { order: 2; justify-self: end; }
          .cal-h1 { font-size: 72px; }
          .cal-shares { grid-template-columns: repeat(2, 1fr); gap: 40px; }
          .cal-steps { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      <header className="cal-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 20, paddingBottom: 8 }}>
        <span style={{ ...display, fontSize: 18, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Caliber
        </span>
        <Link href="/login">
          <a style={{ ...micro, color: color.bone, textDecoration: "none" }}>Sign in</a>
        </Link>
      </header>

      <main>
        {/* ---------------------------------------------------- above the fold */}
        <section className="cal-wrap cal-hero">
          <div className="cal-hero-copy" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h1 className="cal-h1" style={{ ...display, margin: 0, textWrap: "balance" }}>
              {landingCopy.h1}
            </h1>
            <p style={{ margin: 0, fontSize: 17, lineHeight: 1.5, color: color.fog, maxWidth: "34ch" }}>
              {landingCopy.subhead}
            </p>
            <div>
              <Link href="/register">
                <a
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    background: color.red,
                    color: color.bone,
                    borderRadius: radius.pill,
                    padding: "14px 28px",
                    fontSize: 16,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  {landingCopy.primaryCta}
                </a>
              </Link>
            </div>
          </div>

          {/* The real card component at phone width, not a screenshot of one. */}
          <div className="cal-hero-card">
            <CaliberCard {...heroPlaceholder} size="app" />
          </div>
        </section>

        {/* ------------------------------------------------- shared card examples */}
        <section className="cal-wrap" style={{ padding: "48px 0" }}>
          <p style={{ ...micro, margin: "0 0 8px" }}>{landingCopy.shareSection.eyebrow}</p>
          <h2 style={{ ...display, fontSize: 32, margin: "0 0 32px", textWrap: "balance" }}>
            {landingCopy.shareSection.heading}
          </h2>

          <div className="cal-shares">
            {shareExamples.map((ex) => {
              const card = <CaliberCard {...ex.card} size="app" />;
              return ex.frame === "story" ? (
                <StoryFrame key={ex.card.name} caption={ex.caption}>{card}</StoryFrame>
              ) : (
                <MessageFrame key={ex.card.name} caption={ex.caption}>{card}</MessageFrame>
              );
            })}
          </div>
        </section>

        {/* ------------------------------------------------------- how it works */}
        <section className="cal-wrap" style={{ padding: "48px 0" }}>
          <p style={{ ...micro, margin: "0 0 24px" }}>{landingCopy.howItWorks.eyebrow}</p>
          <ol className="cal-steps" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {landingCopy.howItWorks.steps.map((step, i) => (
              <li key={step.title} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Numbered because these genuinely are a sequence. */}
                <span style={{ ...micro, fontFamily: font.number, color: color.red }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 style={{ ...display, fontSize: 22, margin: 0 }}>{step.title}</h3>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: color.fog }}>
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------------------------------------------------- founding class */}
        <section className="cal-wrap" style={{ padding: "48px 0 64px" }}>
          <div
            style={{
              border: `1px solid ${color.chalkStrong}`,
              borderRadius: radius.card,
              padding: 28,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <p style={{ ...micro, margin: 0 }}>{landingCopy.founding.eyebrow}</p>
            <h2 style={{ ...display, fontSize: 32, margin: 0, textWrap: "balance" }}>
              {landingCopy.founding.heading}
            </h2>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: color.fog, maxWidth: "52ch" }}>
              {landingCopy.founding.body}
            </p>
          </div>
        </section>
      </main>

      <footer
        className="cal-wrap"
        style={{
          borderTop: `1px solid ${color.chalk}`,
          padding: "24px 0 48px",
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          justifyContent: "space-between",
          fontSize: 13,
          color: color.fog,
        }}
      >
        <span>{landingCopy.footer.note}</span>
        <span style={{ display: "flex", gap: 16 }}>
          <Link href="/privacy"><a style={{ color: color.fog }}>{landingCopy.footer.privacy}</a></Link>
          <Link href="/terms"><a style={{ color: color.fog }}>{landingCopy.footer.terms}</a></Link>
        </span>
      </footer>
    </div>
  );
}
