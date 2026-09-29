import { useLayoutEffect, useRef } from "react";
import { Link } from "wouter";
import { WaitlistForm } from "@/components/WaitlistForm";
import { runPulseLoop, runScrollScrub, stagger } from "@/lib/motion";
import { SectionEyebrow } from "@/components/signal";
import { SceneHead, MonoChip, METAL_TEXT_STYLE } from "./shared";

/**
 * Beat 03 — THE CALL. The narrative peak, and the only place crimson is
 * allowed to lift (§1.4: crimson is earned). Interest rings pulse outward from
 * the ember, the honest coach offer lands, and the ask finally arrives — after
 * the story has paid for it.
 *
 * This beat owns the `#join` anchor the footer's "Join the founding class"
 * link points at.
 *
 * Unlike beats 00-02 this one is NOT pinned. It carries the offer card, the
 * form, and the payoff line — more than fits in one viewport, and a pinned
 * stage would clip it (fighting a sticky frame while filling in a form is
 * hostile besides). The camera comes to rest here; the page scrolls normally.
 */

export function BeatCall({ reduced }: { reduced: boolean }) {
  const driverRef = useRef<HTMLElement>(null);
  const pingOuterRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (reduced) return;
    const root = driverRef.current;
    if (!root) return;

    const risers = Array.from(root.querySelectorAll<HTMLElement>("[data-rise]"));

    return runScrollScrub({
      driver: root,
      enter: "bottom top",
      leave: "center center",
      targets: risers,
      build: (tl) => {
        if (risers.length === 0) return;
        tl.add(risers, { opacity: [0, 1], y: [26, 0], duration: 440, delay: stagger(85) }, 0);
      },
    });
  }, [reduced]);

  /* the ember breathes — the page's one ambient loop, and the last thing
     still moving once the story comes to rest */
  useLayoutEffect(() => {
    return runPulseLoop({
      target: pingOuterRef.current,
      props: { opacity: [0.25, 0.6], scale: [0.94, 1.08] },
      duration: 2600,
    });
  }, []);

  return (
    <section
      ref={driverRef}
      className="relative px-5 py-section sm:px-8"
      data-testid="beat-call"
    >
      <div className="mx-auto w-full" style={{ maxWidth: "56rem" }}>
        <SectionEyebrow className="mb-6 sm:mb-10">03 · The call</SectionEyebrow>

        {/* the ember + the interest rings pulsing out of it */}
        <div data-rise className="relative mb-10 flex justify-center" aria-hidden>
          <div className="relative h-24 w-24">
            <div
              ref={pingOuterRef}
              className="absolute inset-0 rounded-full border"
              style={{ borderColor: "hsl(var(--crimson) / 0.35)", opacity: 0.45 }}
            />
            <div
              className="absolute inset-[22%] rounded-full border"
              style={{ borderColor: "hsl(var(--crimson) / 0.5)" }}
            />
            <div
              className="absolute inset-[42%] rounded-full"
              style={{
                backgroundColor: "hsl(var(--crimson))",
                boxShadow: "0 0 28px hsl(var(--crimson-glow))",
              }}
            />
          </div>
        </div>

        <div data-rise className="text-center">
          <SceneHead data-testid="call-headline">Then a program calls.</SceneHead>
          <p className="mx-auto mt-5 max-w-xl font-body text-base leading-relaxed text-muted-foreground">
            Coaches do not find you because you posted a highlight. They find
            you because somebody handed them a record they could trust. That
            record is what Caliber builds, one game at a time.
          </p>
        </div>

        {/* the honest coach offer — carried over from the previous landing */}
        {/* scroll-mt clears the fixed nav pill (top-5 + pill height) when the
            footer link jumps here. */}
        <div data-rise className="mx-auto mt-12 max-w-md scroll-mt-28" id="join">
          <div
            className="gloss rounded-card border p-6 sm:p-7"
            style={{
              backgroundColor: "hsl(var(--obsidian-1))",
              borderColor: "hsl(var(--line))",
            }}
          >
            <p
              className="font-display text-label uppercase text-muted-foreground"
              style={{ fontWeight: 500, fontStretch: "70%" }}
            >
              Founding team access · Free
            </p>
            <p className="mt-3 font-body text-sm leading-relaxed text-muted-foreground">
              Drop your email and we&rsquo;ll reach out to set your program up —
              or just reply to our email with a stat sheet.
            </p>
            <WaitlistForm
              source="landing-coaches"
              variant="quiet"
              defaultCoach
              className="mt-5"
            />
          </div>
        </div>

        {/* the story ends where the player starts */}
        <div data-rise className="mt-20 text-center">
          <h2
            className="lean mx-auto leading-none text-hero"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              ...METAL_TEXT_STYLE,
            }}
            data-testid="call-payoff"
          >
            Know your{" "}
            <span
              style={{
                color: "hsl(var(--crimson))",
                textShadow: "0 0 40px hsl(var(--crimson-glow))",
              }}
            >
              caliber
            </span>
            .
          </h2>
          <p className="mx-auto mt-6 max-w-xl font-body text-base leading-relaxed text-muted-foreground">
            Be one of the first athletes on the platform. Log a game, get
            graded, and start climbing — free.
          </p>
          <div className="mt-9 flex flex-col items-center gap-4">
            <MonoChip>No credit card · Founding class open</MonoChip>
            <Link
              href="/pricing"
              className="font-display text-label uppercase text-muted-foreground transition-colors hover:text-foreground"
              style={{ fontWeight: 500, fontStretch: "70%" }}
              data-testid="button-cta-pricing"
            >
              View pricing →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
