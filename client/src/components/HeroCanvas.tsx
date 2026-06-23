import { useEffect, useRef } from "react";

/**
 * Generative, on-brand hero background — a slowly rotating ASCII particle sphere
 * wrapped in a breathing crimson atmosphere, with a subtle film-grain overlay.
 * Obsidian + crimson. Inspired by generative-canvas hero references, rebuilt for
 * Caliber's stack and brand.
 *
 * Performance + a11y:
 * - rAF loop, DPR capped at 1.25, work bounded to the sphere's box.
 * - Pauses when off-screen (IntersectionObserver) or tab hidden.
 * - prefers-reduced-motion → renders a single static frame, no loop.
 */
export function HeroCanvas({ className }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLCanvasElement>(null);
  const grainRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = mainRef.current;
    const grain = grainRef.current;
    if (!wrap || !canvas || !grain) return;
    const ctx = canvas.getContext("2d");
    const gctx = grain.getContext("2d");
    if (!ctx || !gctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const DENSITY = " .:-=+*#%@";
    const DPR = Math.min(window.devicePixelRatio || 1, 1.25);

    let w = 0, h = 0;
    let raf = 0;
    let running = true;
    let visible = true;
    let last = performance.now();
    let t = 0;
    let rot = 0;

    // Pre-rendered grain tile (cheap to stamp each frame)
    const tile = document.createElement("canvas");
    const TS = 150;
    tile.width = TS; tile.height = TS;
    const tctx = tile.getContext("2d")!;
    const img = tctx.createImageData(TS, TS);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 128 + (Math.random() - 0.5) * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = Math.random() * 38;
    }
    tctx.putImageData(img, 0, 0);

    function resize() {
      w = wrap.clientWidth;
      h = wrap.clientHeight;
      for (const c of [canvas, grain]) {
        c.width = Math.floor(w * DPR);
        c.height = Math.floor(h * DPR);
        c.style.width = w + "px";
        c.style.height = h + "px";
      }
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      gctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function draw() {
      // base
      ctx.fillStyle = "#070708";
      ctx.fillRect(0, 0, w, h);

      // orb sits center-right so it reads behind the hero card, left stays clean for copy
      const cx = w * (w < 900 ? 0.5 : 0.62);
      const cy = h * 0.46;
      const R = Math.min(w, h) * (w < 900 ? 0.26 : 0.3);
      const breathe = 0.5 + 0.5 * Math.sin(t * 0.6);

      // breathing crimson atmosphere
      const atmo = ctx.createRadialGradient(cx, cy - 30, 0, cx, cy, Math.max(w, h) * 0.7);
      atmo.addColorStop(0, `hsla(356, 85%, 55%, ${0.16 + breathe * 0.08})`);
      atmo.addColorStop(0.35, "hsla(356, 70%, 40%, 0.10)");
      atmo.addColorStop(0.7, "hsla(356, 60%, 20%, 0.05)");
      atmo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = atmo;
      ctx.fillRect(0, 0, w, h);

      // glowing core
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.9);
      core.addColorStop(0, "hsla(356, 100%, 92%, 0.45)");
      core.addColorStop(0.25, "hsla(356, 90%, 60%, 0.30)");
      core.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.1, 0, Math.PI * 2);
      ctx.fill();

      // ASCII sphere
      ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const s = 10;
      const iStart = Math.floor((cx - R) / s), iEnd = Math.ceil((cx + R) / s);
      const jStart = Math.floor((cy - R) / s), jEnd = Math.ceil((cy + R) / s);
      for (let i = iStart; i <= iEnd; i++) {
        for (let j = jStart; j <= jEnd; j++) {
          const x = i * s, y = j * s;
          const dx = x - cx, dy = y - cy;
          const d2 = dx * dx + dy * dy;
          if (d2 > R * R) continue;
          if (Math.random() > 0.55) continue;
          const z = Math.sqrt(R * R - d2);
          const rotZ = dx * Math.sin(rot) + z * Math.cos(rot);
          if (rotZ <= -R * 0.3) continue;
          const brightness = (rotZ + R) / (R * 2);
          const ch = DENSITY[Math.floor(brightness * (DENSITY.length - 1))];
          const a = Math.max(0.18, brightness);
          // tint toward crimson near the core, white toward the rim
          const dist = Math.sqrt(d2);
          if (dist < R * 0.45) ctx.fillStyle = `hsla(356, 90%, 65%, ${a})`;       // crimson core
          else ctx.fillStyle = `hsla(220, 14%, 82%, ${a * 0.82})`;                 // silver rim
          ctx.fillText(ch, x, y);
        }
      }

      // grain overlay
      gctx.clearRect(0, 0, w, h);
      gctx.globalAlpha = 0.5;
      for (let k = 0; k < Math.ceil(w / TS) + 1; k++) {
        for (let m = 0; m < Math.ceil(h / TS) + 1; m++) {
          gctx.drawImage(tile, k * TS - Math.random() * 8, m * TS - Math.random() * 8);
        }
      }
      gctx.globalAlpha = 1;
    }

    function loop(now: number) {
      if (!running || !visible) { raf = requestAnimationFrame(loop); return; }
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;
      rot += dt * 0.28;
      draw();
      raf = requestAnimationFrame(loop);
    }

    resize();
    window.addEventListener("resize", resize);

    const io = new IntersectionObserver((entries) => { visible = entries[0]?.isIntersecting ?? true; }, { threshold: 0 });
    io.observe(wrap);
    const onVis = () => { running = !document.hidden; };
    document.addEventListener("visibilitychange", onVis);

    if (reduced) {
      draw();
    } else {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
      io.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className={className} aria-hidden>
      <canvas ref={mainRef} className="absolute inset-0 h-full w-full" />
      <canvas ref={grainRef} className="absolute inset-0 h-full w-full" style={{ mixBlendMode: "overlay", opacity: 0.5 }} />
    </div>
  );
}
