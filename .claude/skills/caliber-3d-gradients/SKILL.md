---
name: caliber-3d-gradients
description: How to use 3D (React Three Fiber) and animated shader gradients (ShaderGradient, paper-design) in the Caliber app. Read before adding any 3D scene or shader background.
---

# 3D & Gradients in Caliber

Three shader/3D tools are installed. Use them for the futuristic, sports, liquid-metal direction.

## ⚠️ CRITICAL: React 18 ↔ R3F version (verified 2026-06-23)
The app is **React 18.3**. **React Three Fiber v9 is INCOMPATIBLE with React 18** — it throws `Cannot read properties of undefined (reading 'S')` at mount (R3F v9 uses React 19's reconciler).
**Pinned working set:** `@react-three/fiber@^8.18` + `@react-three/drei@^9.122` + `three@0.183`. Do NOT bump fiber to v9 / drei to v10 unless the whole app moves to React 19.
A trivial `<Canvas>` + spinning mesh spike confirmed v8 renders fine (WebGL works even headless).

## The tools
1. **`@paper-design/shaders-react`** — `LiquidMetal` (and others). NOT R3F-based (own WebGL). Already used for the chrome "C" and the global background metal sheen. Reliable, renders headless. Props: `image`, `colorBack`, `colorTint`, `repetition`, `softness`, `shiftRed/Blue` (chromatic — keep ~0 for clean chrome, raise for oil-slick), `distortion`, `contour`, `speed`, `scale`, `fit`, `style`.
2. **`@shadergradient/react`** — `ShaderGradientCanvas` + `ShaderGradient` (R3F-based → needs the v8 set above). 3D moving gradient: `type` `waterPlane`/`sphere`/`plane`, `color1/2/3`, `animate`, `uTime`, etc. Good for a true flowing colorful background.
3. **`@react-three/fiber` + `@react-three/drei` + `three`** — full 3D. Use for: chrome basketball, court geometry, 3D Caliber Score badge, particle/data fields, product scenes.

## Rules (perf + a11y)
- **Lazy-load** 3D/shader sections (`React.lazy` / dynamic import) — three.js is heavy; code-split.
- **One heavy GPU scene at a time**; pause when offscreen (IntersectionObserver) and on tab hidden.
- **Reduced-motion** → render a static frame / image, no animation.
- **Mobile fallback** → static image or CSS for low-power devices.
- metal-fx (`metal-fx` pkg) renders **blank in headless** and was unreliable for buttons → we use a CSS `.btn-chrome` for the CTA instead.

## Where it lives now
- `client/src/components/SignalBackground.tsx` — global fixed colorful liquid-metal background (paper-design LiquidMetal + CSS `.signal-blooms` + cursor glow). Must be at `z-0` with page content `relative z-10` (negative-z fixed gets buried — verified bug).
- Hero wordmark/accents: paper-design `LiquidMetal`.

Related: [[caliber-landing-overhaul-feedback]] · [[caliber-design-redesign]]
