import { useEffect, useRef } from "react";
import { LiquidMetal } from "@paper-design/shaders-react";
import metalC from "@/assets/images/caliber-c-chrome.png";

/**
 * Global, continuous liquid-metal background — fixed and full-viewport so it
 * flows corner-to-corner across every section (never cut off). Colorful (crimson
 * + chrome-silver + cool violet/steel) for a dimensional, future-forward feel.
 * Cursor-reactive via a CSS var; reduced-motion safe.
 */
export function SignalBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    const onMove = (e: PointerEvent) => {
      if (!el) return;
      el.style.setProperty("--mx", `${e.clientX}px`);
      el.style.setProperty("--my", `${e.clientY}px`);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-0 bg-[#0A0A0B]">
      {/* colorful flowing gradient field */}
      <div className="signal-blooms absolute inset-0" />
      {/* liquid-metal texture (chrome) over the color — transparent back so it adds sheen, not darkness */}
      <div className="absolute inset-0 opacity-[0.32] mix-blend-screen">
        <LiquidMetal
          image={metalC}
          colorBack="#00000000"
          colorTint="#C7CCD4"
          repetition={5}
          softness={0.95}
          shiftRed={0}
          shiftBlue={0}
          distortion={0.38}
          contour={0.42}
          speed={0.35}
          scale={1.7}
          fit="cover"
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      {/* cursor-reactive crimson light */}
      <div className="signal-cursor absolute inset-0" />
      {/* settle the field into obsidian toward the very bottom */}
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent to-[#0A0A0B]" />
    </div>
  );
}
