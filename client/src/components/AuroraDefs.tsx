import { useEffect, useRef } from "react";

/**
 * Singleton SVG <defs> for aurora gradients. Mount once at the App root.
 * Any SVG/lucide icon can reference these via stroke="url(#aurora-gradient)"
 * or fill="url(#aurora-gradient)".
 */
export function AuroraDefs() {
  const stopARef = useRef<SVGStopElement>(null);
  const stopBRef = useRef<SVGStopElement>(null);
  const stopCRef = useRef<SVGStopElement>(null);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = ((now - start) / 8000) % 1;
      const ease = 0.5 - 0.5 * Math.cos(t * Math.PI * 2);
      const shift = ease * 100;
      if (stopARef.current) stopARef.current.setAttribute("offset", `${0 + shift * 0.0}%`);
      if (stopBRef.current) stopBRef.current.setAttribute("offset", `${50 + shift * 0.0}%`);
      if (stopCRef.current) stopCRef.current.setAttribute("offset", `${100}%`);
      raf = requestAnimationFrame(tick);
    };
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      raf = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        <linearGradient id="aurora-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop ref={stopARef} offset="0%" stopColor="hsl(211, 100%, 50%)">
            <animate
              attributeName="stop-color"
              values="hsl(211,100%,50%); hsl(222,92%,55%); hsl(232,84%,60%); hsl(211,100%,50%)"
              dur="9s"
              repeatCount="indefinite"
            />
          </stop>
          <stop ref={stopBRef} offset="50%" stopColor="hsl(222, 92%, 55%)">
            <animate
              attributeName="stop-color"
              values="hsl(222,92%,55%); hsl(232,84%,60%); hsl(211,100%,50%); hsl(222,92%,55%)"
              dur="9s"
              repeatCount="indefinite"
            />
          </stop>
          <stop ref={stopCRef} offset="100%" stopColor="hsl(232, 84%, 60%)">
            <animate
              attributeName="stop-color"
              values="hsl(232,84%,60%); hsl(211,100%,50%); hsl(222,92%,55%); hsl(232,84%,60%)"
              dur="9s"
              repeatCount="indefinite"
            />
          </stop>
        </linearGradient>

        <linearGradient id="aurora-gradient-soft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(211, 100%, 92%)" />
          <stop offset="50%" stopColor="hsl(222, 95%, 92%)" />
          <stop offset="100%" stopColor="hsl(232, 90%, 92%)" />
        </linearGradient>

        <radialGradient id="aurora-radial" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(211, 100%, 50%)" stopOpacity="1" />
          <stop offset="60%" stopColor="hsl(222, 92%, 55%)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="hsl(232, 84%, 60%)" stopOpacity="0.6" />
        </radialGradient>
      </defs>
    </svg>
  );
}
