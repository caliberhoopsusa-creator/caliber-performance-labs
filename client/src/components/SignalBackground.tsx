import { lazy, Suspense, useEffect, useRef, useState } from "react";

const ShaderField = lazy(() => import("./ShaderField"));

/**
 * Global, continuous background — fixed and full-viewport, flows corner-to-corner.
 * A flowing black/red/silver ShaderGradient (R3F) on top of a CSS color wash that
 * also serves as the reduced-motion / pre-load fallback. Must sit at z-0 with page
 * content at relative z-10 (negative-z fixed gets buried — verified).
 */
export function SignalBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    if (mq.matches) return;
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
      {/* CSS color wash — base + reduced-motion / pre-load fallback */}
      <div className="signal-blooms absolute inset-0" />
      {/* flowing black/red/silver ShaderGradient (skipped for reduced-motion) */}
      {!reduced && (
        <Suspense fallback={null}>
          <ShaderField />
        </Suspense>
      )}
      {/* cursor-reactive crimson light */}
      <div className="signal-cursor absolute inset-0" />
      {/* settle into obsidian toward the very bottom */}
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent to-[#0A0A0B]" />
    </div>
  );
}
