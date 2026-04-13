/**
 * Caliber Performance Labs — Cinematic Edition
 * ──────────────────────────────────────────────────────────────────────────────
 * Aesthetic: Obsidian × Platinum × Maximum Wow
 * Font: Outfit (display) + Inter (body)
 * Signature moves:
 *   • GlobalCursor — 900px platinum glow + 6px dot, spring lag, no re-renders
 *   • SplitReveal — character-by-character blur+y+opacity reveal
 *   • MagneticButton — elastic cursor follow (35% strength)
 *   • TiltCard — per-card rotateX/Y perspective tilt
 *   • LiveFeed — bottom-right cycling live events
 *   • AppShowcase — 150vh sticky scroll, mock browser, clip-path wipe, SVG pathLength
 *   • Stats — fullscreen giant numbers, scan-line, blur-focus counters
 *   • Features — bento grid (4-col), SpotlightCard + trace-border + stagger
 *   • HowItWorks — animated scaleX connector, spring pop-in circles
 *   • FinalCTA — breathing radial glow
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'wouter';
import {
  motion, useInView, AnimatePresence,
  useMotionValue, useSpring, useTransform,
  useScroll,
} from 'framer-motion';
import {
  ArrowRight, BarChart3, Video, Award, Trophy, Users, Target,
  Zap, Star, TrendingUp, Check, Menu, X, ChevronRight,
  Activity, Flame, Shield, Medal, GraduationCap, Eye,
} from 'lucide-react';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:         '#080808',
  bg1:        '#0f0f0f',
  bg2:        '#141414',
  amber:      '#C6D0D8',
  amberDim:   '#4f6878',
  amberGlow:  'rgba(198,208,216,0.12)',
  amberTrace: 'rgba(198,208,216,0.25)',
  white:      '#ffffff',
  white60:    'rgba(255,255,255,0.60)',
  white40:    'rgba(255,255,255,0.40)',
  white12:    'rgba(255,255,255,0.12)',
  white06:    'rgba(255,255,255,0.06)',
  white03:    'rgba(255,255,255,0.03)',
  border:     'rgba(255,255,255,0.08)',
  borderFine: 'rgba(255,255,255,0.06)',
};

// ─── Global styles + keyframes ────────────────────────────────────────────────
const GLOBAL_STYLES = `
/* Fonts loaded via index.html (Outfit + Inter) */

* { font-family: 'Inter', sans-serif; }
.font-display { font-family: 'Outfit', sans-serif; }


@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes trace-border {
  0%   { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
@keyframes marquee-left {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes marquee-right {
  0%   { transform: translateX(-50%); }
  100% { transform: translateX(0); }
}
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-8px); }
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.4; transform: scale(0.8); }
}
@keyframes glow-pulse {
  0%, 100% { opacity: 0.6; }
  50%       { opacity: 1; }
}
@keyframes mesh-drift {
  0%   { background-position: 0% 0%,   100% 100%, 50% 50%; }
  33%  { background-position: 30% 40%,  60% 70%,  80% 20%; }
  66%  { background-position: 70% 20%,  20% 80%,  10% 60%; }
  100% { background-position: 0% 0%,   100% 100%, 50% 50%; }
}
@keyframes scan-once {
  0%   { transform: translateX(-100%); opacity: 0; }
  5%   { opacity: 1; }
  90%  { opacity: 0.8; }
  100% { transform: translateX(120vw);  opacity: 0; }
}
@keyframes counter-focus {
  0%   { filter: blur(8px); opacity: 0.2; }
  100% { filter: blur(0px); opacity: 1;   }
}
@keyframes chrome-shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
@keyframes breathe-glow {
  0%, 100% { opacity: 0.5; transform: scale(1);    }
  50%       { opacity: 1;   transform: scale(1.08); }
}
@keyframes data-row-in {
  from { opacity: 0; transform: translateX(-10px); }
  to   { opacity: 1; transform: translateX(0);     }
}
@keyframes char-halo {
  0%, 100% { text-shadow: 0 0 20px rgba(198,208,216,0.4); }
  50%       { text-shadow: 0 0 40px rgba(198,208,216,0.8), 0 0 80px rgba(198,208,216,0.3); }
}
@keyframes video-scan {
  0%   { transform: translateX(-2px); opacity: 0; }
  8%   { opacity: 1; }
  88%  { opacity: 1; }
  100% { transform: translateX(300px); opacity: 0; }
}
@keyframes aurora-drift {
  0%   { transform: translate(0px, 0px) scale(1); }
  33%  { transform: translate(30px, -20px) scale(1.08); }
  66%  { transform: translate(-20px, 15px) scale(0.95); }
  100% { transform: translate(0px, 0px) scale(1); }
}
@keyframes neon-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(198,208,216,0.35), 0 0 40px rgba(198,208,216,0.15); }
  50%       { box-shadow: 0 0 30px rgba(198,208,216,0.55), 0 0 60px rgba(198,208,216,0.25); }
}
.video-scan {
  animation: video-scan 2.2s ease-in-out infinite;
}

/* ── Utility classes ──────────────────────────────────────────────────────── */
.shimmer-btn {
  background: linear-gradient(135deg, #C6D0D8 0%, #8ba4b4 50%, #4f6878 100%);
  color: #080808;
  font-weight: 800;
  letter-spacing: 0.03em;
  transition: all 0.2s ease;
  box-shadow: 0 0 20px rgba(198,208,216,0.35), 0 0 40px rgba(198,208,216,0.15);
  position: relative;
  overflow: hidden;
}
.shimmer-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(255,255,255,0.1) 100%);
  pointer-events: none;
}
.shimmer-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(198,208,216,0.55), 0 0 60px rgba(198,208,216,0.25), 0 8px 24px rgba(0,0,0,0.4);
  background: linear-gradient(135deg, #d4dee6 0%, #9db5c4 50%, #5c7a8d 100%);
}
.shimmer-btn:active {
  transform: translateY(0);
  box-shadow: 0 0 15px rgba(198,208,216,0.3);
}

.trace-border { position: relative; isolation: isolate; }
.trace-border::before {
  content: '';
  position: absolute; inset: -1px; border-radius: inherit; padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%, rgba(198,208,216,0.25) 40%,
    #C6D0D8 50%, rgba(198,208,216,0.25) 60%, transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0; transition: opacity 0.3s;
  animation: trace-border 2s linear infinite;
  pointer-events: none;
}
.trace-border:hover::before { opacity: 1; }

.dot-grid {
  background-image: radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1px);
  background-size: 28px 28px;
}

.mesh-bg {
  background:
    radial-gradient(ellipse 50% 40% at 20% 30%, rgba(198,208,216,0.055) 0%, transparent 60%),
    radial-gradient(ellipse 40% 50% at 80% 70%, rgba(100,140,180,0.04)  0%, transparent 60%),
    radial-gradient(ellipse 60% 30% at 50% 60%, rgba(198,208,216,0.03)  0%, transparent 70%);
  background-size: 100% 100%;
  animation: mesh-drift 14s ease-in-out infinite;
}

.chrome-shimmer-bar {
  background: linear-gradient(90deg, transparent 0%, rgba(198,208,216,0.5) 50%, transparent 100%);
  background-size: 200% 100%;
  animation: chrome-shimmer 3s linear infinite;
}

.scan-line-active { animation: scan-once 1.6s ease-out forwards; }
.counter-focus-anim { animation: counter-focus 1.4s ease-out forwards; }
`;

// ─── Easing + base variants ───────────────────────────────────────────────────
const ease = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease },
  }),
};
const stagger = { visible: { transition: { staggerChildren: 0.07 } } };

// ─── GlobalCursor ─────────────────────────────────────────────────────────────
function GlobalCursor() {
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);
  const dotX   = useMotionValue(-1000);
  const dotY   = useMotionValue(-1000);

  const glowX = useSpring(mouseX, { stiffness: 80, damping: 20 });
  const glowY = useSpring(mouseY, { stiffness: 80, damping: 20 });

  const glowLeft = useTransform(glowX, x => x - 450);
  const glowTop  = useTransform(glowY, y => y - 450);
  const dotLeft  = useTransform(dotX,  x => x - 3);
  const dotTop   = useTransform(dotY,  y => y - 3);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      dotX.set(e.clientX);
      dotY.set(e.clientY);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [mouseX, mouseY, dotX, dotY]);

  return (
    <>
      {/* Platinum radial glow */}
      <motion.div
        style={{
          position: 'fixed', left: glowLeft, top: glowTop,
          width: 900, height: 900, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(198,208,216,0.05) 0%, transparent 65%)',
          pointerEvents: 'none', zIndex: 1,
        }}
      />
    </>
  );
}

// ─── SplitReveal ──────────────────────────────────────────────────────────────
function SplitReveal({
  text, className = '', isGold = false, delay = 0,
}: {
  text: string; className?: string; isGold?: boolean; delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <span ref={ref} className={className} style={{ display: 'inline-block' }}>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          style={{ display: 'inline-block' }}
          initial={{ opacity: 0, y: 22, filter: 'blur(10px)' }}
          animate={inView ? {
            opacity: 1, y: 0, filter: 'blur(0px)',
            ...(isGold ? { textShadow: '0 0 28px rgba(198,208,216,0.55)' } : {}),
          } : {}}
          transition={{ duration: 0.55, delay: delay + i * 0.028, ease }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
}

// ─── MagneticButton ───────────────────────────────────────────────────────────
function MagneticButton({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 25 });
  const sy = useSpring(y, { stiffness: 200, damping: 25 });

  const onMove = useCallback((e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    x.set((e.clientX - (r.left + r.width  / 2)) * 0.35);
    y.set((e.clientY - (r.top  + r.height / 2)) * 0.35);
  }, [x, y]);

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={() => { x.set(0); y.set(0); }}>
      <motion.div style={{ x: sx, y: sy }}>{children}</motion.div>
    </div>
  );
}

// ─── TiltCard ─────────────────────────────────────────────────────────────────
function TiltCard({ children, style, className = '' }: {
  children: React.ReactNode; style?: React.CSSProperties; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const sX = useSpring(rotX, { stiffness: 150, damping: 20 });
  const sY = useSpring(rotY, { stiffness: 150, damping: 20 });

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    rotX.set(((e.clientY - (r.top  + r.height / 2)) / r.height) * -14);
    rotY.set(((e.clientX - (r.left + r.width  / 2)) / r.width)  *  14);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => { rotX.set(0); rotY.set(0); }}
      style={{ rotateX: sX, rotateY: sY, transformPerspective: 900, ...style }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Reveal ───────────────────────────────────────────────────────────────────
function Reveal({ children, className = '', delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref} className={className}
      variants={fadeUp} custom={delay}
      initial="hidden" animate={inView ? 'visible' : 'hidden'}
    >
      {children}
    </motion.div>
  );
}

// ─── SpotlightCard ────────────────────────────────────────────────────────────
function SpotlightCard({ children, className = '', size = 600, style }: {
  children: React.ReactNode; className?: string; size?: number; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const onMove = useCallback((e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  }, []);

  return (
    <div
      ref={ref} onMouseMove={onMove}
      onMouseEnter={() => setOpacity(1)} onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden ${className}`} style={style}
    >
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        opacity, transition: 'opacity 400ms ease',
        background: `radial-gradient(${size}px circle at ${pos.x}px ${pos.y}px, ${C.amberGlow}, transparent 50%)`,
      }} />
      {children}
    </div>
  );
}

// ─── Counter (blur-focus) ─────────────────────────────────────────────────────
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref as React.RefObject<Element>, { once: true });
  const [count, setCount] = useState(0);
  const [ran, setRan] = useState(false);

  useEffect(() => {
    if (!inView || ran) return;
    setRan(true);
    if (ref.current) ref.current.className = 'counter-focus-anim';
    let start = 0;
    const dur = 1800;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, to, ran]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── Eyebrow ──────────────────────────────────────────────────────────────────
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-px w-6" style={{ background: C.amber }} />
      <span className="font-display text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: C.amber }}>
        {children}
      </span>
    </div>
  );
}

// ─── GradHead ─────────────────────────────────────────────────────────────────
function GradHead({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`font-display font-bold bg-clip-text text-transparent ${className}`}
      style={{ backgroundImage: `linear-gradient(180deg, ${C.white} 0%, ${C.white60} 100%)` }}
    >
      {children}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NAV
// ═══════════════════════════════════════════════════════════════════════════════
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const navLinks = [
    { label: 'Features',    href: '#features' },
    { label: 'How It Works', href: '#how' },
    { label: 'Pricing',     href: '/pricing' },
    { label: 'Scout Hub',   href: '/scout' },
  ];

  return (
    <motion.nav
      initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease }}
      className="fixed top-0 inset-x-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? 'rgba(8,8,8,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
        borderBottom: scrolled ? `1px solid ${C.border}` : '1px solid transparent',
      }}
    >
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
        <Link href="/">
          <a className="flex items-center gap-2 group cursor-pointer">
            <span className="font-display text-sm font-bold tracking-[0.18em] uppercase transition-all duration-300 group-hover:tracking-[0.22em]" style={{ color: C.amber }}>
              CALIBER
            </span>
            <span className="text-[11px] hidden sm:block tracking-widest uppercase" style={{ color: C.white40 }}>
              Performance Labs
            </span>
          </a>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ label, href }) => (
            <a key={label} href={href}
              className="px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200"
              style={{ color: C.white40 }}
              onMouseEnter={e => (e.currentTarget.style.color = C.white)}
              onMouseLeave={e => (e.currentTarget.style.color = C.white40)}
            >
              {label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <a className="text-[13px] font-medium transition-colors duration-200"
              style={{ color: C.white40 }}
              onMouseEnter={e => (e.currentTarget.style.color = C.white)}
              onMouseLeave={e => (e.currentTarget.style.color = C.white40)}
            >
              Sign in
            </a>
          </Link>
          <Link href="/login">
            <a className="shimmer-btn px-4 py-1.5 rounded-lg text-[13px] font-semibold"
              style={{ fontFamily: "'Outfit', sans-serif" }}>
              Get started
            </a>
          </Link>
        </div>

        <button className="md:hidden p-1.5 rounded-md" style={{ color: C.white60 }}
          onClick={() => setMobileOpen(v => !v)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ background: 'rgba(8,8,8,0.98)', borderBottom: `1px solid ${C.border}` }}
            className="md:hidden px-5 pb-5 flex flex-col gap-2"
          >
            {[...navLinks, { label: 'Sign In', href: '/login' }].map(({ label, href }) => (
              <a key={label} href={href} className="py-2.5 text-sm font-medium border-b"
                style={{ color: C.white60, borderColor: C.borderFine }}>
                {label}
              </a>
            ))}
            <Link href="/login">
              <a className="shimmer-btn mt-2 inline-flex justify-center py-2.5 rounded-lg text-sm font-semibold text-white font-display">
                Get started free
              </a>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIVE FEED
// ═══════════════════════════════════════════════════════════════════════════════
const LIVE_EVENTS = [
  { player: 'Aria T.',      action: 'got scouted by USC',         ago: '4s ago' },
  { player: 'Marcus J.',    action: 'earned Sharpshooter badge',  ago: '12s ago' },
  { player: 'Destiny W.',   action: 'matched with 3 D1 programs', ago: '28s ago' },
  { player: 'Coach Rivera', action: 'verified 3 games',           ago: '45s ago' },
  { player: 'Jaylen M.',    action: 'profile viewed by Michigan', ago: '1m ago' },
];

function LiveFeed() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % LIVE_EVENTS.length), 2800);
    return () => clearInterval(id);
  }, []);
  const ev = LIVE_EVENTS[idx];

  return (
    <div className="hidden sm:block" style={{ position: 'absolute', bottom: 72, right: 24, zIndex: 20, maxWidth: 272 }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10, x: 8 }} animate={{ opacity: 1, y: 0, x: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
          style={{
            background: 'rgba(12,12,12,0.94)', border: `1px solid ${C.border}`,
            borderRadius: 12, padding: '10px 14px', backdropFilter: 'blur(24px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0, animation: 'pulse-dot 1.8s ease-in-out infinite', display: 'inline-block' }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: C.white40 }}>LIVE</span>
          </div>
          <div style={{ fontSize: 12, color: C.white60, lineHeight: 1.45 }}>
            <span style={{ color: C.white, fontWeight: 600 }}>{ev.player}</span>{' '}{ev.action}
          </div>
          <div style={{ fontSize: 10, color: C.white40, marginTop: 3 }}>{ev.ago}</div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE SHOWCASE — tabbed product demo for hero right column
// ═══════════════════════════════════════════════════════════════════════════════

// ── Card shell shared by all showcase views ────────────────────────────────
const CARD_STYLE: React.CSSProperties = {
  width: 348,
  minHeight: 420,
  background: 'rgba(13,13,13,0.97)',
  border: `1px solid rgba(198,208,216,0.14)`,
  borderRadius: 20,
  padding: '20px 20px 18px',
  backdropFilter: 'blur(40px)',
  boxShadow: '0 48px 96px rgba(0,0,0,0.7), 0 0 0 1px rgba(198,208,216,0.05), inset 0 1px 0 rgba(255,255,255,0.05)',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 14,
};

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 9, letterSpacing: '0.22em', color: C.amber, fontWeight: 700, textTransform: 'uppercase' as const }}>
      {children}
    </div>
  );
}

// ── 1. AI Rating card ─────────────────────────────────────────────────────
function AIRatingCard() {
  const subScores = [
    { label: 'Production',  value: 82, color: C.amber },
    { label: 'Efficiency',  value: 88, color: '#22c55e' },
    { label: 'Impact',      value: 79, color: C.amber },
    { label: 'Two-Way',     value: 71, color: '#a855f7' },
    { label: 'Athletic',    value: 91, color: '#ef4444' },
    { label: 'Intangibles', value: 84, color: '#38bdf8' },
  ];
  return (
    <div style={CARD_STYLE}>
      <CardLabel>CALIBER · AI REPORT</CardLabel>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.white, lineHeight: 1.2 }}>Marcus Johnson</div>
          <div style={{ fontSize: 11, color: C.white40, marginTop: 2 }}>PG · Basketball · Jr.</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 52, fontWeight: 900, color: '#22c55e', lineHeight: 1, fontFamily: "'Outfit',sans-serif", fontVariantNumeric: 'tabular-nums lining-nums', letterSpacing: '-0.03em', textShadow: '0 0 32px rgba(34,197,94,0.4)' }}>94</div>
          <div style={{ fontSize: 9, letterSpacing: '0.16em', color: '#22c55e', textTransform: 'uppercase' as const, marginTop: 2 }}>Elite</div>
        </div>
      </div>
      <div style={{ height: 1, background: C.border }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {subScores.map(({ label, value, color }, i) => (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10.5, color: C.white40 }}>{label}</span>
              <span style={{ fontSize: 10.5, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' as const }}>{value}</span>
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 0.85, delay: 0.1 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                style={{ height: '100%', background: color, borderRadius: 99, opacity: 0.85 }}
              />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', borderTop: `1px solid ${C.border}`, paddingTop: 12, marginTop: 'auto' }}>
        {[{ label: 'Season PTS', value: '247' }, { label: 'APG', value: '8.4' }, { label: 'eFG%', value: '58.2' }].map(({ label, value }, i) => (
          <div key={label} style={{ flex: 1, textAlign: 'center', borderRight: i < 2 ? `1px solid ${C.border}` : 'none' }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.white, fontFamily: "'Outfit',sans-serif", fontVariantNumeric: 'tabular-nums lining-nums' as const }}>{value}</div>
            <div style={{ fontSize: 9, color: C.white40, textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 8, background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)' }}>
        <Shield className="w-3 h-3" style={{ color: '#22c55e', flexShrink: 0 }} />
        <span style={{ fontSize: 10.5, color: '#22c55e', letterSpacing: '0.04em' }}>Coach-verified · 12 games this season</span>
      </div>
    </div>
  );
}

// ── 2. Recruiting card ────────────────────────────────────────────────────
function CollegeBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 9.5, color: C.white40, width: 68, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 2.5, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          style={{ height: '100%', background: color, borderRadius: 99 }}
        />
      </div>
      <span style={{ fontSize: 9.5, fontWeight: 600, color, fontVariantNumeric: 'tabular-nums' as const, width: 20, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function RecruitingCard() {
  const colleges = [
    { name: 'Stanford University', conf: 'Pac-12', div: 'D1', match: 92, color: C.amber, bars: [{ l: 'Skill Fit', v: 94 }, { l: 'Academic', v: 96 }, { l: 'Style Fit', v: 89 }, { l: 'Location', v: 82 }] },
    { name: 'Duke University', conf: 'ACC', div: 'D1', match: 87, color: C.amber, bars: [{ l: 'Skill Fit', v: 91 }, { l: 'Academic', v: 93 }, { l: 'Style Fit', v: 84 }, { l: 'Location', v: 76 }] },
  ];
  return (
    <div style={CARD_STYLE}>
      <CardLabel>CALIBER · RECRUITING</CardLabel>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>College Matches</div>
        <div style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: 'rgba(198,208,216,0.12)', color: C.amber, fontWeight: 600 }}>14 schools</div>
      </div>
      {colleges.map(college => (
        <div key={college.name} style={{ padding: '12px 14px', borderRadius: 12, background: C.white03, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: C.white }}>{college.name}</div>
              <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: `${college.color}22`, color: college.color, fontWeight: 700 }}>{college.div}</span>
                <span style={{ fontSize: 9, color: C.white40 }}>{college.conf}</span>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: college.color, fontFamily: "'Outfit',sans-serif", fontVariantNumeric: 'tabular-nums lining-nums' as const, lineHeight: 1 }}>{college.match}%</div>
              <div style={{ fontSize: 8, color: C.white40, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Match</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {college.bars.map(b => <CollegeBar key={b.l} label={b.l} value={b.v} color={college.color} />)}
          </div>
        </div>
      ))}
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, fontSize: 11, color: C.amber, fontWeight: 600 }}>
        View all 14 matches <ChevronRight className="w-3.5 h-3.5" />
      </div>
    </div>
  );
}

// ── 3. Badges card ────────────────────────────────────────────────────────
const BADGE_DATA = [
  { icon: Target,     name: 'Sharpshooter',  bg: 'rgba(168,85,247,0.18)',  border: 'rgba(168,85,247,0.3)',   color: '#a855f7' },
  { icon: Zap,        name: 'Triple Double',  bg: 'rgba(234,179,8,0.18)',   border: 'rgba(234,179,8,0.3)',    color: '#eab308' },
  { icon: Shield,     name: 'Lockdown',       bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.25)', color: '#94a3b8' },
  { icon: Flame,      name: 'Hot Streak',     bg: 'rgba(239,68,68,0.18)',   border: 'rgba(239,68,68,0.3)',    color: '#ef4444' },
  { icon: Star,       name: 'A+ Efficiency',  bg: 'rgba(34,197,94,0.18)',   border: 'rgba(34,197,94,0.3)',    color: '#22c55e' },
  { icon: TrendingUp, name: 'Double Double',  bg: 'rgba(34,197,94,0.14)',   border: 'rgba(34,197,94,0.25)',   color: '#4ade80' },
  { icon: BarChart3,  name: '30+ Points',     bg: 'rgba(249,115,22,0.18)',  border: 'rgba(249,115,22,0.3)',   color: '#f97316' },
  { icon: Activity,   name: 'Hustle King',    bg: 'rgba(56,189,248,0.18)',  border: 'rgba(56,189,248,0.3)',   color: '#38bdf8' },
  { icon: Check,      name: 'Clean Sheet',    bg: 'rgba(198,208,216,0.15)', border: 'rgba(198,208,216,0.25)', color: C.amber },
];

function BadgesCard() {
  return (
    <div style={CARD_STYLE}>
      <CardLabel>CALIBER · ACHIEVEMENTS</CardLabel>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>Earned Badges</div>
        <div style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: 'rgba(198,208,216,0.12)', color: C.amber, fontWeight: 600 }}>12 this season</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {BADGE_DATA.map(({ icon: Icon, name, bg, border, color }, i) => (
          <motion.div
            key={name}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.05 + i * 0.045, ease: [0.16, 1, 0.3, 1] }}
            style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: '12px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
          >
            <Icon style={{ width: 18, height: 18, color }} />
            <span style={{ fontSize: 9, color, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{name}</span>
          </motion.div>
        ))}
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderRadius: 8, background: C.white03, border: `1px solid ${C.border}` }}>
        <Award className="w-3.5 h-3.5" style={{ color: C.amber }} />
        <span style={{ fontSize: 10.5, color: C.white40 }}>50+ badges available across all sports</span>
      </div>
    </div>
  );
}

// ── 4. Leaderboard card ───────────────────────────────────────────────────
const LB_PLAYERS = [
  { rank: 1, name: 'Marcus J.',  pos: 'PG',     grade: 'A+', streak: true,  rankBg: 'rgba(234,179,8,0.15)',   rankBorder: 'rgba(234,179,8,0.3)',   rankColor: '#eab308' },
  { rank: 2, name: 'Destiny W.', pos: 'SG',     grade: 'A',  streak: false, rankBg: 'rgba(148,163,184,0.12)', rankBorder: 'rgba(148,163,184,0.25)', rankColor: '#94a3b8' },
  { rank: 3, name: 'Jaylen M.',  pos: 'SF',     grade: 'A',  streak: true,  rankBg: 'rgba(234,137,12,0.15)',  rankBorder: 'rgba(234,137,12,0.25)',  rankColor: '#fb923c' },
  { rank: 4, name: 'Aria T.',    pos: 'PG',     grade: 'B+', streak: false, rankBg: 'transparent',            rankBorder: C.border,                rankColor: C.white40 },
  { rank: 5, name: 'Devon K.',   pos: 'Center', grade: 'B',  streak: false, rankBg: 'transparent',            rankBorder: C.border,                rankColor: C.white40 },
];

function LeaderboardCard() {
  return (
    <div style={CARD_STYLE}>
      <CardLabel>CALIBER · LEADERBOARD</CardLabel>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>State Rankings</div>
        <div style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: 'rgba(198,208,216,0.12)', color: C.amber, fontWeight: 600 }}>High School</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {LB_PLAYERS.map(({ rank, name, pos, grade, streak, rankBg, rankBorder, rankColor }, i) => (
          <motion.div
            key={rank}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.06 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 10,
              background: rankBg, border: `1px solid ${rankBorder}`,
              boxShadow: rank === 1 ? '0 0 20px rgba(234,179,8,0.12)' : 'none',
            }}
          >
            {/* Rank icon / number */}
            <div style={{ width: 22, textAlign: 'center', flexShrink: 0 }}>
              {rank === 1 ? <Trophy className="w-4 h-4 mx-auto" style={{ color: '#eab308' }} /> :
               rank === 2 ? <Medal  className="w-4 h-4 mx-auto" style={{ color: '#94a3b8' }} /> :
               rank === 3 ? <Medal  className="w-4 h-4 mx-auto" style={{ color: '#fb923c' }} /> :
               <span style={{ fontSize: 12, fontWeight: 700, color: rankColor, fontVariantNumeric: 'tabular-nums' as const }}>{rank}</span>}
            </div>
            {/* Name + pos */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: C.white }}>{name}</span>
                {streak && <Flame className="w-3 h-3" style={{ color: '#ef4444' }} />}
              </div>
              <div style={{ fontSize: 10, color: C.white40 }}>{pos}</div>
            </div>
            {/* Grade badge */}
            <div style={{
              padding: '2px 8px', borderRadius: 6, fontWeight: 700, fontSize: 11,
              background: grade === 'A+' ? 'rgba(34,197,94,0.15)' : grade === 'A' ? 'rgba(34,197,94,0.1)' : 'rgba(198,208,216,0.1)',
              color: grade === 'A+' ? '#22c55e' : grade === 'A' ? '#4ade80' : C.amber,
              border: grade.startsWith('A') ? '1px solid rgba(34,197,94,0.25)' : `1px solid ${C.border}`,
              fontVariantNumeric: 'tabular-nums' as const,
            }}>{grade}</div>
          </motion.div>
        ))}
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, fontSize: 11, color: C.amber, fontWeight: 600 }}>
        Full leaderboard <ChevronRight className="w-3.5 h-3.5" />
      </div>
    </div>
  );
}

// ── 5. Video Analysis card ────────────────────────────────────────────────
const AI_INSIGHTS = [
  'Shot selection improved 22% vs. last 3 games.',
  'On-ball defense rated elite — 94th percentile.',
  'Court vision: 8.4 APG, 3.1 AST/TO ratio.',
];

function VideoCard() {
  return (
    <div style={CARD_STYLE}>
      <CardLabel>CALIBER · GAME ANALYSIS</CardLabel>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>AI Game Report</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#22c55e' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse-dot 1.8s ease-in-out infinite' }} />
          Analyzed
        </div>
      </div>
      {/* Game header */}
      <div style={{ padding: '14px', borderRadius: 12, background: C.white03, border: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: C.white40, marginBottom: 3 }}>Mar 18 · vs. Westside HS</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.white }}>Marcus Johnson</div>
          </div>
          {/* Grade circle */}
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '2px solid rgba(34,197,94,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(34,197,94,0.2)' }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#22c55e', fontFamily: "'Outfit',sans-serif" }}>A</span>
          </div>
        </div>
        {/* Stat pills */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[{ v: '24', l: 'PTS' }, { v: '7', l: 'AST' }, { v: '5', l: 'REB' }, { v: '58%', l: 'FG' }].map(({ v, l }) => (
            <div key={l} style={{ flex: 1, textAlign: 'center', padding: '6px 4px', borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.white, fontFamily: "'Outfit',sans-serif", fontVariantNumeric: 'tabular-nums lining-nums' as const }}>{v}</div>
              <div style={{ fontSize: 8.5, color: C.white40, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      {/* AI insights */}
      <div style={{ padding: '12px 14px', borderRadius: 12, background: C.white03, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <Zap className="w-3.5 h-3.5" style={{ color: C.amber }} />
          <span style={{ fontSize: 10.5, fontWeight: 700, color: C.amber, letterSpacing: '0.06em' }}>AI INSIGHTS</span>
        </div>
        {AI_INSIGHTS.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.15 + i * 0.1, ease }}
            style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}
          >
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.amber, flexShrink: 0, marginTop: 4 }} />
            <span style={{ fontSize: 11, color: C.white60, lineHeight: 1.45 }}>{insight}</span>
          </motion.div>
        ))}
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 8, background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)' }}>
        <Video className="w-3 h-3" style={{ color: '#38bdf8', flexShrink: 0 }} />
        <span style={{ fontSize: 10.5, color: '#38bdf8' }}>Highlight clips synced · Upload any footage</span>
      </div>
    </div>
  );
}

// ── FeatureShowcase container ──────────────────────────────────────────────
const TABS = [
  { icon: Star,       label: 'AI Rating',   Card: AIRatingCard },
  { icon: TrendingUp, label: 'Recruiting',  Card: RecruitingCard },
  { icon: Award,      label: 'Badges',      Card: BadgesCard },
  { icon: Trophy,     label: 'Leaderboard', Card: LeaderboardCard },
  { icon: Video,      label: 'Video',       Card: VideoCard },
];

function FeatureShowcase() {
  const [active, setActive] = useState(1);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActive(t => (t + 1) % TABS.length), 3600);
    return () => clearInterval(id);
  }, [paused]);

  const { Card: ActiveCard } = TABS[active];

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'float 5s ease-in-out infinite' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Tab strip */}
      <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 12, padding: 4 }}>
        {TABS.map(({ icon: Icon, label }, i) => (
          <button
            key={label}
            onClick={() => setActive(i)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '7px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: active === i ? C.white12 : 'transparent',
              color: active === i ? C.white : C.white40,
              transition: 'all 0.18s ease',
            }}
          >
            <Icon style={{ width: 13, height: 13 }} />
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.04em', whiteSpace: 'nowrap' as const }}>{label}</span>
          </button>
        ))}
      </div>

      {/* Card area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          <ActiveCard />
        </motion.div>
      </AnimatePresence>

      {/* Progress dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 5 }}>
        {TABS.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            style={{
              width: active === i ? 16 : 5, height: 5, borderRadius: 99, border: 'none', cursor: 'pointer',
              background: active === i ? C.amber : C.white12,
              transition: 'all 0.3s ease',
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHOT CHART BG — animated hero background
// ═══════════════════════════════════════════════════════════════════════════════
const SHOT_DOTS = [
  // ── Left half (basket at x=52, y=240) ────────────────────────────────────
  // Paint / close range
  { x: 65,  y: 240, made: true  }, { x: 74,  y: 218, made: true  },
  { x: 74,  y: 262, made: false }, { x: 88,  y: 240, made: true  },
  { x: 86,  y: 208, made: true  }, { x: 86,  y: 272, made: true  },
  // Baseline mid-range
  { x: 118, y: 80,  made: true  }, { x: 118, y: 400, made: false },
  { x: 134, y: 94,  made: true  }, { x: 134, y: 386, made: true  },
  // Elbows
  { x: 184, y: 143, made: true  }, { x: 184, y: 337, made: false },
  { x: 168, y: 162, made: false }, { x: 168, y: 318, made: true  },
  { x: 172, y: 240, made: false },
  // Corner 3s (near sidelines)
  { x: 113, y: 20,  made: true  }, { x: 113, y: 460, made: true  },
  { x: 96,  y: 34,  made: false }, { x: 96,  y: 446, made: true  },
  { x: 138, y: 22,  made: false }, { x: 138, y: 458, made: true  },
  // Wing 3s
  { x: 222, y: 52,  made: true  }, { x: 222, y: 428, made: false },
  { x: 240, y: 67,  made: false }, { x: 240, y: 413, made: true  },
  { x: 256, y: 83,  made: true  }, { x: 252, y: 397, made: false },
  // Top of key / above arc
  { x: 280, y: 240, made: true  }, { x: 270, y: 200, made: false },
  { x: 270, y: 280, made: true  }, { x: 262, y: 165, made: true  },
  { x: 262, y: 315, made: false }, { x: 298, y: 240, made: false },
  // Deep 3s
  { x: 318, y: 240, made: true  }, { x: 306, y: 195, made: false },
  { x: 306, y: 285, made: true  },
  // ── Right half (basket at x=848, y=240) ──────────────────────────────────
  // Paint
  { x: 835, y: 240, made: true  }, { x: 826, y: 220, made: false },
  { x: 826, y: 260, made: true  }, { x: 812, y: 240, made: true  },
  // Baseline mid-range
  { x: 782, y: 80,  made: false }, { x: 782, y: 400, made: true  },
  { x: 766, y: 94,  made: true  }, { x: 766, y: 386, made: false },
  // Elbows
  { x: 716, y: 143, made: false }, { x: 716, y: 337, made: true  },
  { x: 730, y: 162, made: true  }, { x: 730, y: 318, made: false },
  // Corner 3s
  { x: 787, y: 20,  made: true  }, { x: 787, y: 460, made: false },
  { x: 804, y: 34,  made: true  }, { x: 804, y: 446, made: true  },
  { x: 762, y: 22,  made: false }, { x: 762, y: 458, made: true  },
  // Wing 3s
  { x: 678, y: 52,  made: false }, { x: 678, y: 428, made: true  },
  { x: 660, y: 67,  made: true  }, { x: 660, y: 413, made: false },
  { x: 644, y: 83,  made: false }, { x: 648, y: 397, made: true  },
  // Top of key
  { x: 620, y: 240, made: true  }, { x: 630, y: 198, made: false },
  { x: 630, y: 282, made: true  }, { x: 638, y: 167, made: true  },
  { x: 638, y: 313, made: false }, { x: 602, y: 240, made: false },
] as const;

function ShotChartBG() {
  const [round, setRound] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setRound(r => r + 1), 9500);
    return () => clearInterval(id);
  }, []);

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%', opacity: 0.11 }}
      viewBox="0 0 900 480"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      {/* ── Faint court lines for context ── */}
      {/* Court outline */}
      <rect x="2" y="2" width="896" height="476" rx="3"
        stroke="rgba(198,208,216,0.4)" strokeWidth="1.2" />
      {/* Half-court line */}
      <line x1="450" y1="2" x2="450" y2="478"
        stroke="rgba(198,208,216,0.3)" strokeWidth="1" />
      {/* Center circle */}
      <circle cx="450" cy="240" r="58"
        stroke="rgba(198,208,216,0.3)" strokeWidth="1" />
      {/* Left 3-point arc */}
      <path d="M 110 478 L 110 352 A 218 218 0 0 1 790 352 L 790 478"
        stroke="rgba(198,208,216,0.3)" strokeWidth="1" />
      {/* Left paint */}
      <rect x="2" y="142" width="178" height="196"
        stroke="rgba(198,208,216,0.25)" strokeWidth="1" />
      {/* Right paint */}
      <rect x="720" y="142" width="178" height="196"
        stroke="rgba(198,208,216,0.25)" strokeWidth="1" />
      {/* Left basket */}
      <circle cx="52" cy="240" r="9"
        stroke="rgba(198,208,216,0.5)" strokeWidth="1.2" />
      {/* Right basket */}
      <circle cx="848" cy="240" r="9"
        stroke="rgba(198,208,216,0.5)" strokeWidth="1.2" />

      {/* ── Animated shot dots ── */}
      {SHOT_DOTS.map(({ x, y, made }, i) => (
        <motion.g
          key={`${round}-${i}`}
          transform={`translate(${x},${y})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.38, delay: i * 0.072, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Ripple ring — made shots only, scale from center */}
          {made && (
            <motion.circle
              cx={0} cy={0} r={5}
              fill="none"
              stroke="rgba(198,208,216,0.75)"
              strokeWidth={0.8}
              initial={{ scale: 1, opacity: 0.7 }}
              animate={{ scale: 3.8, opacity: 0 }}
              transition={{ duration: 0.95, delay: i * 0.072 + 0.18, ease: 'easeOut' }}
            />
          )}
          {/* Dot */}
          <circle
            cx={0} cy={0}
            r={made ? 4.5 : 3.8}
            fill={made ? 'rgba(198,208,216,0.92)' : 'none'}
            stroke={!made ? 'rgba(198,208,216,0.65)' : 'none'}
            strokeWidth={1.4}
          />
        </motion.g>
      ))}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HERO — split layout: text left, product card right
// ═══════════════════════════════════════════════════════════════════════════════
function Hero() {
  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden pt-14"
      style={{ background: C.bg }}
    >
      {/* Layer 1: breathing mesh gradient — biased to top-right where card lives */}
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse 60% 50% at 75% 40%, rgba(198,208,216,0.065) 0%, transparent 60%),
          radial-gradient(ellipse 50% 40% at 20% 30%, rgba(198,208,216,0.04) 0%, transparent 60%),
          radial-gradient(ellipse 40% 60% at 50% 80%, rgba(100,140,180,0.03) 0%, transparent 70%)
        `,
        animation: 'mesh-drift 14s ease-in-out infinite',
      }} />

      {/* Aurora color bands */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.35 }}>
        <div style={{
          position: 'absolute',
          top: '-10%', left: '-5%',
          width: '55%', height: '70%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(56,189,248,0.18) 0%, transparent 60%)',
          filter: 'blur(60px)',
          animation: 'mesh-drift 18s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          top: '20%', right: '-10%',
          width: '50%', height: '60%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(168,85,247,0.14) 0%, transparent 60%)',
          filter: 'blur(70px)',
          animation: 'mesh-drift 22s ease-in-out 6s infinite',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '5%', left: '30%',
          width: '45%', height: '50%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(34,197,94,0.10) 0%, transparent 60%)',
          filter: 'blur(80px)',
          animation: 'mesh-drift 26s ease-in-out 12s infinite',
        }} />
      </div>

      {/* Layer 2: SVG noise */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.032 }}>
        <filter id="noise-hero">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise-hero)" />
      </svg>

      {/* Layer 3: dot grid, fades toward right */}
      <div
        className="absolute inset-0 dot-grid"
        style={{ maskImage: 'radial-gradient(ellipse 90% 70% at 30% 45%, black 20%, transparent 100%)' }}
      />

      {/* Layer 4: Basketball half-court outline — platinum, ultra-low opacity */}
      <svg
        className="absolute pointer-events-none"
        style={{
          bottom: 0, left: '50%', transform: 'translateX(-68%)',
          width: '70vw', maxWidth: 900, opacity: 0.032,
        }}
        viewBox="0 0 900 480"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Court outline */}
        <rect x="2" y="2" width="896" height="476" rx="4" stroke="rgba(198,208,216,1)" strokeWidth="2" />
        {/* Half-court line */}
        <line x1="450" y1="2" x2="450" y2="478" stroke="rgba(198,208,216,1)" strokeWidth="1.5" />
        {/* Center circle */}
        <circle cx="450" cy="240" r="60" stroke="rgba(198,208,216,1)" strokeWidth="1.5" />
        {/* Center dot */}
        <circle cx="450" cy="240" r="4" fill="rgba(198,208,216,1)" />
        {/* Left three-point arc (full) */}
        <path
          d="M 110 478 L 110 360 A 220 220 0 0 1 790 360 L 790 478"
          stroke="rgba(198,208,216,1)" strokeWidth="1.5"
        />
        {/* Left paint (key) */}
        <rect x="2" y="140" width="180" height="200" stroke="rgba(198,208,216,1)" strokeWidth="1.5" />
        {/* Right paint (key) */}
        <rect x="718" y="140" width="180" height="200" stroke="rgba(198,208,216,1)" strokeWidth="1.5" />
        {/* Left free-throw circle (top half) */}
        <path d="M 182 240 A 60 60 0 0 1 62 240" stroke="rgba(198,208,216,1)" strokeWidth="1.5" strokeDasharray="6 5" />
        <path d="M 182 240 A 60 60 0 0 0 62 240" stroke="rgba(198,208,216,1)" strokeWidth="1.5" />
        {/* Right free-throw circle */}
        <path d="M 718 240 A 60 60 0 0 0 838 240" stroke="rgba(198,208,216,1)" strokeWidth="1.5" strokeDasharray="6 5" />
        <path d="M 718 240 A 60 60 0 0 1 838 240" stroke="rgba(198,208,216,1)" strokeWidth="1.5" />
        {/* Left basket */}
        <circle cx="52" cy="240" r="10" stroke="rgba(198,208,216,1)" strokeWidth="1.5" />
        {/* Right basket */}
        <circle cx="848" cy="240" r="10" stroke="rgba(198,208,216,1)" strokeWidth="1.5" />
        {/* Left restricted area arc */}
        <path d="M 52 220 A 40 40 0 0 1 52 260" stroke="rgba(198,208,216,1)" strokeWidth="1.5" />
        {/* Right restricted area arc */}
        <path d="M 848 220 A 40 40 0 0 0 848 260" stroke="rgba(198,208,216,1)" strokeWidth="1.5" />
      </svg>

      {/* Layer 5: Animated shot chart */}
      <ShotChartBG />

      {/* Top streak */}
      <div className="absolute top-0 inset-x-0 h-px pointer-events-none" style={{
        background: `linear-gradient(90deg, transparent 5%, ${C.amberTrace} 50%, transparent 95%)`,
      }} />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 lg:gap-20 items-center">

          {/* ── LEFT: Copy ── */}
          <div className="flex flex-col gap-7 max-w-2xl">

            {/* Badge */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium"
                style={{ background: C.white03, border: `1px solid ${C.border}`, color: C.white60 }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{
                  background: '#22c55e',
                  animation: 'pulse-dot 1.8s ease-in-out infinite',
                  boxShadow: '0 0 6px rgba(34,197,94,0.8)',
                }} />
                500+ college coaches actively scouting
                <span className="w-px h-3" style={{ background: C.border }} />
                <span style={{ color: C.amber }}>Free to start</span>
              </div>
            </motion.div>

            {/* Headline */}
            <h1
              className="font-display font-bold leading-[0.95] tracking-tight"
              style={{ fontSize: 'clamp(52px, 7.5vw, 96px)' }}
            >
              <span style={{ display: 'block', color: C.white }}>
                <SplitReveal text="Your Game." delay={0.1} />
              </span>
              <span style={{ display: 'block', color: C.amber, marginTop: '0.06em' }}>
                <SplitReveal text="Measured." delay={0.4} isGold />
              </span>
            </h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.85, ease }}
              style={{ color: C.white40, fontWeight: 300, fontSize: 16, lineHeight: 1.7, maxWidth: 460 }}
            >
              Build your AI recruiting profile. College coaches find athletes on Caliber every day —
              your performance grades, highlight reel, and scouting report, all in one place.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0, ease }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
            >
              <MagneticButton>
                <Link href="/login">
                  <a className="shimmer-btn inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-[14px] font-bold text-white font-display">
                    Start for free
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </Link>
              </MagneticButton>
              <Link href="/scout">
                <a
                  className="trace-border inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-[14px] font-medium transition-colors duration-200"
                  style={{ background: C.white03, border: `1px solid ${C.border}`, color: C.white60 }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.white)}
                  onMouseLeave={e => (e.currentTarget.style.color = C.white60)}
                >
                  Scout Hub
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </a>
              </Link>
            </motion.div>

            {/* Trust micro-row */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.2, ease }}
              className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1"
            >
              {[
                { icon: GraduationCap, text: 'Recruiting profile' },
                { icon: Shield,        text: 'Coach-verified stats' },
                { icon: Award,         text: '50+ skill badges' },
                { icon: Users,         text: 'Free for players' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5" style={{ color: C.white40, fontSize: 12 }}>
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: C.amberDim }} />
                  {text}
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── RIGHT: Feature showcase ── */}
          <motion.div
            className="hidden lg:flex justify-end items-start"
            initial={{ opacity: 0, x: 40, scale: 0.93 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.55, ease }}
          >
            <FeatureShowcase />
          </motion.div>
        </div>

        {/* Mobile stat cards — shown only below lg where product card is hidden */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.3, ease }}
          className="flex lg:hidden flex-wrap gap-3 mt-10"
        >
          {[
            { icon: Activity,   label: 'Avg. Grade',  value: 'A−',   color: '#22c55e' },
            { icon: Flame,      label: 'Games/Week',  value: '3.2×', color: C.amber },
            { icon: Star,       label: 'Top Badges',  value: '50+',  color: '#a855f7' },
            { icon: TrendingUp, label: 'Improvement', value: '↑18%', color: '#38bdf8' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 12,
                background: C.white03, border: `1px solid ${C.border}`,
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
              <div>
                <div style={{ fontSize: 10, color: C.white40, marginBottom: 1 }}>{label}</div>
                <div className="font-display font-bold" style={{ fontSize: 14, color: C.white, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Live feed — bottom right */}
      <LiveFeed />

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-40 pointer-events-none"
        style={{ background: `linear-gradient(to bottom, transparent, ${C.bg})` }} />
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MARQUEE (dual-row enhanced)
// ═══════════════════════════════════════════════════════════════════════════════
const MARQUEE_ITEMS = [
  'Basketball', 'AI Analysis', 'Performance Grades',
  'Skill Badges', 'Leaderboards', 'Recruiting', 'Shot Charts',
  'Video Analysis', 'Coach Tools', 'Scouting', 'Training',
];

function MarqueeRow({ reverse = false }: { reverse?: boolean }) {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div style={{ overflow: 'hidden' }}>
      <div style={{
        display: 'flex', width: 'max-content',
        animation: `${reverse ? 'marquee-right' : 'marquee-left'} ${reverse ? '24s' : '30s'} linear infinite`,
      }}>
        {items.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-2 px-6 text-[12px] font-medium tracking-[0.12em] uppercase whitespace-nowrap"
            style={{ color: reverse ? C.white40 : 'rgba(255,255,255,0.30)' }}
          >
            <span className="w-1 h-1 rounded-full" style={{ background: C.amber, opacity: 0.7 }} />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function Marquee() {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
        background: C.bg1,
      }}
    >
      <div style={{ paddingTop: 14, paddingBottom: 8 }}>
        <MarqueeRow />
      </div>
      {/* 1px platinum separator */}
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.amberTrace}, transparent)` }} />
      <div style={{ paddingTop: 8, paddingBottom: 14 }}>
        <MarqueeRow reverse />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// APP SHOWCASE (new sticky-scroll section)
// ═══════════════════════════════════════════════════════════════════════════════
// Multi-line chart paths (PTS, REB, AST)
const CHART_PTS = 'M 0 90 C 60 85 100 70 160 55 S 260 30 340 18 S 400 10 460 5';
const CHART_REB = 'M 0 110 C 60 105 100 95 160 82 S 260 65 340 55 S 400 48 460 42';
const CHART_AST = 'M 0 120 C 60 118 100 112 160 100 S 260 88 340 78 S 400 72 460 68';
// Grade bars heights (0-100 scale mapped to SVG)
const GRADE_BARS = [88, 92, 85, 95, 90, 91];

function AppShowcase() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref as React.RefObject<HTMLElement>,
    offset: ['start start', 'end end'],
  });

  const opacity   = useTransform(scrollYProgress, [0, 0.08], [0, 1]);
  const scale     = useTransform(scrollYProgress, [0, 0.12], [0.88, 1]);
  const clipPath  = useTransform(
    scrollYProgress,
    [0.06, 0.5],
    ['inset(0 100% 0 0 round 0 0 12px 12px)', 'inset(0 0% 0 0 round 0 0 12px 12px)'],
  );
  const pathLength = useTransform(scrollYProgress, [0.35, 0.88], [0, 1]);

  const gameRows = [
    { date: 'Mar 18', opp: 'vs. Westside HS', pts: 24, ast: 7, reb: 5, grade: 'A' },
    { date: 'Mar 14', opp: 'vs. Eastpark',    pts: 18, ast: 4, reb: 8, grade: 'B+' },
    { date: 'Mar 9',  opp: 'vs. Northview',   pts: 31, ast: 9, reb: 3, grade: 'A+' },
  ];

  const gradeColor = (g: string) =>
    g.startsWith('A') ? '#22c55e' : g.startsWith('B') ? '#38bdf8' : C.amber;

  return (
    <section
      ref={ref}
      style={{ height: '150vh', position: 'relative', background: C.bg }}
    >
      {/* Section label — visible above sticky area */}
      <div className="px-5 pt-20 pb-4 text-center max-w-6xl mx-auto" style={{ position: 'relative', zIndex: 2 }}>
        <Reveal>
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-px w-6" style={{ background: C.amber }} />
            <span className="font-display text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: C.amber }}>
              The Platform
            </span>
          </div>
          <h2 className="font-display font-bold" style={{ fontSize: 'clamp(28px,4vw,42px)', color: C.white }}>
            Your command center
          </h2>
          <p className="mt-2 text-sm max-w-md mx-auto" style={{ color: C.white40 }}>
            Scroll to reveal your full performance dashboard.
          </p>
        </Reveal>
      </div>

      {/* Sticky browser window */}
      <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', zIndex: 1 }}>
        <motion.div style={{ opacity, scale, width: '92%', maxWidth: 980 }}>
          {/* Browser chrome */}
          <div style={{
            borderRadius: '12px 12px 0 0',
            background: C.bg2,
            border: `1px solid ${C.border}`,
            borderBottom: 'none',
            padding: '10px 16px',
            display: 'flex', alignItems: 'center', gap: 8,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57', flexShrink: 0 }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e', flexShrink: 0 }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28ca41', flexShrink: 0 }} />
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '3px 10px', fontSize: 11, color: C.white40, textAlign: 'center' }}>
              app.caliberperformance.com/players/3
            </div>
            {/* Shimmer strip */}
            <div className="chrome-shimmer-bar" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2 }} />
          </div>

          {/* Dashboard body — clip-path wipe reveal */}
          <motion.div style={{
            clipPath,
            borderRadius: '0 0 12px 12px',
            border: `1px solid ${C.border}`,
            borderTop: 'none',
            background: '#0a0a0a',
            overflow: 'hidden',
            height: 'min(64vh, 580px)',
            minHeight: 400,
          }}>
            <div style={{ display: 'flex', height: '100%' }}>

              {/* Sidebar */}
              <div style={{
                width: 148, borderRight: `1px solid ${C.border}`,
                padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0,
                background: '#0a0a0a',
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: C.white40, marginBottom: 10, paddingLeft: 4 }}>
                  MENU
                </div>
                {[
                  { icon: Activity,  label: 'Overview',   active: true },
                  { icon: BarChart3, label: 'Analytics',  active: false },
                  { icon: Video,     label: 'Highlights', active: false },
                  { icon: Award,     label: 'Accolades',  active: false },
                  { icon: Users,     label: 'Coach',      active: false },
                  { icon: Target,    label: 'Career',     active: false },
                ].map(({ icon: Icon, label, active }) => (
                  <div key={label} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6,
                    background: active ? 'rgba(224,36,36,0.10)' : 'transparent',
                    borderLeft: active ? '2px solid #E02424' : '2px solid transparent',
                    paddingLeft: active ? 6 : 8,
                  }}>
                    <Icon style={{ width: 12, height: 12, color: active ? '#fff' : C.white40, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: active ? C.white : C.white40, fontWeight: active ? 600 : 400 }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', background: '#0a0a0a' }}>

                {/* Player profile header */}
                <div style={{ padding: '16px 18px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  {/* Avatar */}
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%', background: '#1c1c1c',
                    border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800, color: C.white, flexShrink: 0, fontFamily: "'Outfit',sans-serif",
                  }}>
                    MO
                  </div>
                  {/* Name + info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: C.white, fontFamily: "'Outfit',sans-serif" }}>#1</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: C.white60, border: `1px solid ${C.border}`, borderRadius: 4, padding: '1px 6px', letterSpacing: '0.08em' }}>GUARD</span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: C.white, fontFamily: "'Outfit',sans-serif", letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 6 }}>
                      MATTHEW OPPENHEIM
                    </div>
                    {/* Stat pills */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {[
                        { icon: Activity, label: 'PPG', val: '19.5' },
                        { icon: TrendingUp, label: 'RPG', val: '11.0', green: true },
                        { icon: Zap, label: 'APG', val: '7.5' },
                      ].map(({ icon: Icon, label, val, green }) => (
                        <div key={label} style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '3px 8px', borderRadius: 6,
                          background: '#1c1c1c', border: `1px solid ${C.border}`,
                          fontSize: 11, color: C.white, fontWeight: 600,
                        }}>
                          <Icon style={{ width: 10, height: 10, color: green ? '#22c55e' : C.white40 }} />
                          <span style={{ color: C.white40, fontSize: 10 }}>{label}</span>
                          <span style={{ color: C.white, fontWeight: 700 }}>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* A+ grade badge */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, background: '#22c55e',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', fontFamily: "'Outfit',sans-serif", lineHeight: 1 }}>A+</div>
                  </div>
                </div>

                {/* Tab bar */}
                <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.border}`, padding: '0 18px', overflowX: 'auto' }}>
                  {['Overview', 'Games', 'Highlights', 'Accolades', 'Activity'].map((tab, i) => (
                    <div key={tab} style={{
                      padding: '8px 14px', fontSize: 10, fontWeight: i === 0 ? 600 : 400,
                      color: i === 0 ? C.white : C.white40,
                      borderBottom: i === 0 ? '2px solid #E02424' : '2px solid transparent',
                      whiteSpace: 'nowrap', cursor: 'default',
                    }}>
                      {tab}
                    </div>
                  ))}
                </div>

                {/* Charts row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '12px 18px' }}>

                  {/* Performance Trends */}
                  <div style={{ background: '#111', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: C.white, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <TrendingUp style={{ width: 10, height: 10 }} />
                      Performance Trends
                    </div>
                    <svg viewBox="0 0 460 130" width="100%" height={70} style={{ overflow: 'visible' }}>
                      <defs>
                        <linearGradient id="pts-fill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#fff" stopOpacity={0.08} />
                          <stop offset="100%" stopColor="#fff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      {[32, 65, 98].map(y => (
                        <line key={y} x1={0} y1={y} x2={460} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
                      ))}
                      {/* PTS - white */}
                      <motion.path d={CHART_PTS} fill="none" stroke="#ffffff" strokeWidth={1.5} strokeLinecap="round" style={{ pathLength }} />
                      <motion.circle cx={460} cy={5} r={3} fill="#ffffff" style={{ opacity: pathLength }} />
                      {/* REB - green */}
                      <motion.path d={CHART_REB} fill="none" stroke="#22c55e" strokeWidth={1.5} strokeLinecap="round" style={{ pathLength }} />
                      <motion.circle cx={460} cy={42} r={3} fill="#22c55e" style={{ opacity: pathLength }} />
                      {/* AST - grey */}
                      <motion.path d={CHART_AST} fill="none" stroke="#6b7280" strokeWidth={1.5} strokeLinecap="round" style={{ pathLength }} />
                      <motion.circle cx={460} cy={68} r={3} fill="#6b7280" style={{ opacity: pathLength }} />
                    </svg>
                    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                      {[{ c: '#fff', l: 'PTS' }, { c: '#22c55e', l: 'REB' }, { c: '#6b7280', l: 'AST' }].map(({ c, l }) => (
                        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, color: C.white40 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
                          {l}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Grade History */}
                  <div style={{ background: '#111', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: C.white, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Award style={{ width: 10, height: 10 }} />
                      Grade History
                    </div>
                    <svg viewBox="0 0 230 90" width="100%" height={70}>
                      {GRADE_BARS.map((h, i) => (
                        <motion.rect
                          key={i}
                          x={i * 38 + 4}
                          y={90 - h}
                          width={28}
                          height={h}
                          rx={4}
                          fill="#22c55e"
                          style={{ scaleY: pathLength, originY: '90px' }}
                        />
                      ))}
                    </svg>
                  </div>
                </div>

                {/* Season averages */}
                <div style={{ padding: '0 18px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: C.white, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <BarChart3 style={{ width: 10, height: 10 }} />
                    Season Averages
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                    {[
                      { val: '19.5', label: 'PTS' },
                      { val: '11.0', label: 'REB' },
                      { val: '7.5',  label: 'AST' },
                      { val: '2.0',  label: 'STL' },
                      { val: '0.5',  label: 'BLK' },
                    ].map(({ val, label }) => (
                      <div key={label} style={{
                        background: '#1a1a1a', border: `1px solid ${C.border}`,
                        borderRadius: 8, padding: '8px 6px', textAlign: 'center',
                      }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: C.white, fontFamily: "'Outfit',sans-serif", lineHeight: 1 }}>{val}</div>
                        <div style={{ fontSize: 9, color: C.white40, marginTop: 2 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA row */}
                <div style={{ padding: '0 18px 14px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px', borderRadius: 6, background: '#E02424',
                    fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.04em',
                  }}>
                    <Activity style={{ width: 10, height: 10 }} />
                    EDIT PROFILE
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px', borderRadius: 6,
                    border: `1px solid ${C.border}`, background: 'transparent',
                    fontSize: 10, fontWeight: 600, color: C.white60,
                  }}>
                    Share
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px', borderRadius: 6, background: '#E02424',
                    fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.04em',
                    marginLeft: 'auto',
                  }}>
                    + LOG GAME
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATS (rebuilt — fullscreen giant numbers + scan-line)
// ═══════════════════════════════════════════════════════════════════════════════
const STATS_DATA = [
  { value: 10000, suffix: '+', label: 'Active Athletes',    desc: 'and growing daily',        color: '#22c55e' },
  { value: 500,   suffix: '+', label: 'College Programs',   desc: 'D1–NAIA coaches scouting', color: '#38bdf8' },
  { value: 3200,  suffix: '',  label: 'Games Logged',       desc: 'in the last 30 days',      color: '#f59e0b' },
  { value: 50,    suffix: '+', label: 'Skill Badges',       desc: 'across all positions',     color: '#a78bfa' },
];

function Stats() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref as React.RefObject<Element>, { once: true, margin: '-80px' });

  return (
    <section
      ref={ref}
      style={{ background: C.bg, position: 'relative', overflow: 'hidden', paddingTop: 80, paddingBottom: 80 }}
    >
      {/* Scan-line — fires once on inView */}
      {inView && (
        <div
          className="scan-line-active"
          style={{
            position: 'absolute', top: 0, bottom: 0, left: 0, width: 2, zIndex: 10, pointerEvents: 'none',
            background: `linear-gradient(180deg, transparent 0%, ${C.amber} 30%, rgba(198,208,216,0.6) 50%, ${C.amber} 70%, transparent 100%)`,
          }}
        />
      )}

      {/* Background noise */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.025, pointerEvents: 'none' }}>
        <svg width="100%" height="100%">
          <filter id="noise-stats">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise-stats)" />
        </svg>
      </div>

      {/* Stats grid — full width, giant numbers */}
      <motion.div
        variants={stagger} initial="hidden"
        whileInView="visible" viewport={{ once: true, margin: '-40px' }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', width: '100%' }}
        className="lg:grid-cols-4"
      >
        {STATS_DATA.map(({ value, suffix, label, desc, color }, i) => (
          <motion.div key={label} variants={fadeUp} custom={i}>
            <SpotlightCard
              size={500}
              style={{
                background: i % 2 === 0 ? C.bg : C.bg1,
                borderRight: `1px solid ${C.border}`,
                borderBottom: `1px solid ${C.border}`,
                padding: '48px 36px',
                display: 'flex', flexDirection: 'column', gap: 8,
                boxShadow: `0 0 80px ${color}20`,
                position: 'relative',
                overflow: 'hidden',
              } as React.CSSProperties}
            >
              {/* Radial color glow */}
              <div style={{
                position: 'absolute', top: '-20%', left: '-10%',
                width: '70%', height: '70%',
                borderRadius: '50%',
                background: `radial-gradient(ellipse at center, ${color}1a 0%, transparent 65%)`,
                pointerEvents: 'none',
              }} />
              {/* Giant number */}
              <div
                className="font-display font-bold"
                style={{ fontSize: 'clamp(56px, 8vw, 104px)', color, lineHeight: 1, letterSpacing: '-0.02em' }}
              >
                <Counter to={value} suffix={suffix} />
              </div>
              <div className="font-display font-semibold text-lg" style={{ color: C.white }}>
                {label}
              </div>
              <div className="text-[13px]" style={{ color: C.white40 }}>{desc}</div>
            </SpotlightCard>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET DISCOVERED — full-width recruiting spotlight
// ═══════════════════════════════════════════════════════════════════════════════
const SCOUT_ACTIVITY = [
  { initials: 'SC', school: 'Stanford', conf: 'Pac-12', label: 'High Interest', color: C.amber },
  { initials: 'DU', school: 'Duke',     conf: 'ACC',    label: 'Interested',    color: C.amberDim },
  { initials: 'MI', school: 'Michigan', conf: 'Big Ten', label: 'Viewed',       color: '#38bdf8' },
];

function GetDiscovered() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section
      ref={ref}
      style={{
        background: C.bg1,
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
        position: 'relative',
        overflow: 'hidden',
        padding: '96px 20px',
      }}
    >
      {/* Background glow — platinum tint */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 70% at 75% 50%, rgba(198,208,216,0.055) 0%, transparent 60%), radial-gradient(ellipse 40% 50% at 20% 60%, rgba(198,208,216,0.03) 0%, transparent 60%)',
      }} />

      <div className="max-w-6xl mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* ── Left: copy ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <motion.div
              initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, ease }}
            >
              <Eyebrow>Recruiting</Eyebrow>
            </motion.div>

            <motion.h2
              className="font-display font-bold"
              style={{ fontSize: 'clamp(32px, 4.5vw, 54px)', color: C.white, lineHeight: 1.05 }}
              initial={{ opacity: 0, y: 18 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.06, ease }}
            >
              Get Found.<br />
              <span style={{ color: C.amber }}>Get Recruited.</span>
            </motion.h2>

            <motion.p
              style={{ fontSize: 15, color: C.white40, lineHeight: 1.75, maxWidth: 420, fontWeight: 300 }}
              initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.12, ease }}
            >
              Your Caliber profile is a living recruiting resume. AI-generated scouting reports,
              performance trends, and verified highlights — visible to 500+ college programs
              actively searching for their next recruit.
            </motion.p>

            {/* Micro-facts */}
            <motion.div
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.18, ease }}
            >
              {[
                { icon: GraduationCap, text: 'D1, D2, D3, NAIA, and JUCO programs',        color: C.amber },
                { icon: Eye,           text: 'Coaches search by position, grade & region',  color: C.amber },
                { icon: TrendingUp,    text: 'AI scouting report auto-updates every game',  color: C.amber },
              ].map(({ icon: Icon, text, color }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: 13, height: 13, color }} />
                  </div>
                  <span style={{ fontSize: 13, color: C.white60 }}>{text}</span>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.24, ease }}
              style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}
            >
              <MagneticButton>
                <Link href="/login">
                  <a className="shimmer-btn inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-bold text-white font-display">
                    Build My Profile
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </Link>
              </MagneticButton>
              <Link href="/scout">
                <a
                  className="trace-border inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-medium"
                  style={{ background: C.white03, border: `1px solid ${C.border}`, color: C.white60 }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.white)}
                  onMouseLeave={e => (e.currentTarget.style.color = C.white60)}
                >
                  Scout Hub <ChevronRight className="w-4 h-4 opacity-50" />
                </a>
              </Link>
            </motion.div>
          </div>

          {/* ── Right: Recruiting profile card ── */}
          <motion.div
            initial={{ opacity: 0, x: 32, scale: 0.95 }} animate={inView ? { opacity: 1, x: 0, scale: 1 } : {}}
            transition={{ duration: 0.75, delay: 0.1, ease }}
            style={{ display: 'flex', justifyContent: 'center' }}
          >
            <div style={{
              width: '100%', maxWidth: 400,
              background: 'rgba(10,10,10,0.97)', border: `1px solid rgba(198,208,216,0.14)`,
              borderRadius: 20, padding: '20px',
              boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(198,208,216,0.04), inset 0 1px 0 rgba(255,255,255,0.04)',
              display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              {/* Profile header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: C.white03, border: `1px solid ${C.border}` }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: C.amberGlow, border: `1px solid ${C.amberTrace}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: C.amber, fontFamily: "'Outfit',sans-serif", flexShrink: 0 }}>
                  DW
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.white }}>Destiny Williams</div>
                  <div style={{ fontSize: 10.5, color: C.white40, marginTop: 1 }}>SG · Basketball · Sr. · Oakland, CA</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: C.amber, fontFamily: "'Outfit',sans-serif", lineHeight: 1, fontVariantNumeric: 'tabular-nums lining-nums' }}>A−</div>
                  <div style={{ fontSize: 8, color: C.white40, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Grade</div>
                </div>
              </div>

              {/* Scout activity */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Eye style={{ width: 11, height: 11, color: C.amber }} />
                  <span style={{ fontSize: 9.5, letterSpacing: '0.18em', color: C.amber, fontWeight: 700, textTransform: 'uppercase' }}>Scout Activity This Week</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {SCOUT_ACTIVITY.map(({ initials, school, conf, label, color }, i) => (
                    <motion.div
                      key={school}
                      initial={{ opacity: 0, x: -10 }}
                      animate={inView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.35, delay: 0.35 + i * 0.07, ease }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 12px', borderRadius: 9,
                        background: `${color}0a`, border: `1px solid ${color}20`,
                      }}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color, flexShrink: 0, fontFamily: "'Outfit',sans-serif" }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 600, color: C.white }}>{school}</div>
                        <div style={{ fontSize: 9.5, color: C.white40 }}>{conf}</div>
                      </div>
                      <div style={{ fontSize: 9.5, fontWeight: 700, color, padding: '2px 7px', borderRadius: 5, background: `${color}15` }}>
                        {label}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div style={{ height: 1, background: C.border }} />

              {/* College matches */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 9.5, letterSpacing: '0.18em', color: C.amber, fontWeight: 700, textTransform: 'uppercase' }}>Top College Matches</span>
                  <span style={{ fontSize: 10, color: C.amberDim, fontWeight: 600 }}>14 total</span>
                </div>
                {[
                  { name: 'Stanford University', div: 'D1', match: 92, color: C.amber },
                  { name: 'Duke University',      div: 'D1', match: 87, color: C.amberDim },
                ].map(({ name, div, match, color }, i) => (
                  <motion.div
                    key={name}
                    initial={{ opacity: 0, y: 6 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.35, delay: 0.5 + i * 0.07, ease }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 12px', borderRadius: 9, marginBottom: 5,
                      background: C.white03, border: `1px solid ${C.border}`,
                    }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}14`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <GraduationCap style={{ width: 14, height: 14, color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: C.white }}>{name}</div>
                      <div style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: `${color}22`, color, fontWeight: 700, display: 'inline-block', marginTop: 2 }}>{div}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color, fontFamily: "'Outfit',sans-serif", lineHeight: 1, fontVariantNumeric: 'tabular-nums lining-nums' }}>{match}%</div>
                      <div style={{ fontSize: 8, color: C.white40, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Match</div>
                    </div>
                  </motion.div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, fontSize: 11, color: C.amber, fontWeight: 600, marginTop: 2 }}>
                  View all 14 matches <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURES — bento grid, rich mock-UI cells
// ═══════════════════════════════════════════════════════════════════════════════

// Shared cell wrapper
const CIRC = 2 * Math.PI * 68; // grade-ring circumference (r=68)

function BentoShell({ children, col, row, index, size = 400, accent }: {
  children: React.ReactNode;
  col: string; row: string; index: number; size?: number; accent?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div
      ref={ref}
      style={{ gridColumn: col, gridRow: row }}
      initial={{ opacity: 0, scale: 0.96, y: 14 }}
      animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.06, ease }}
    >
      <SpotlightCard
        size={size}
        className="trace-border h-full"
        style={{
          background: C.bg1, border: `1px solid ${C.border}`,
          borderRadius: 16, overflow: 'hidden', height: '100%',
          display: 'flex', flexDirection: 'column',
          position: 'relative',
        } as React.CSSProperties}
      >
        {accent && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1, zIndex: 10, pointerEvents: 'none',
            background: `linear-gradient(90deg, transparent, ${accent}90, transparent)`,
          }} />
        )}
        {children}
      </SpotlightCard>
    </motion.div>
  );
}

// ── Cell 1: Performance Grades (hero — 2 cols × 2 rows) ───────────────────────
function GradesCell({ index }: { index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const targetOffset = CIRC * (1 - 0.88);

  const stats = [
    { label: 'Shooting',    pct: 87, color: C.amber,   icon: Target  },
    { label: 'Defense',     pct: 72, color: '#9dd4c4', icon: Shield  },
    { label: 'Playmaking',  pct: 91, color: '#a78bfa', icon: Zap     },
    { label: 'Athleticism', pct: 84, color: '#38bdf8', icon: Activity },
  ] as const;

  const gameGrades = [78, 82, 75, 88, 84, 91, 88];
  const maxG = Math.max(...gameGrades);

  return (
    <BentoShell col="1 / 3" row="1 / 3" index={index} size={500} accent={C.amber}>
      {/* Radial gradient bg */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse 60% 80% at 20% 60%, rgba(198,208,216,0.07) 0%, transparent 70%)`,
      }} />
      {/* Subtle dot grid */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.06, zIndex: 0, pointerEvents: 'none' }}>
        <defs>
          <pattern id="dots-grades" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.9" fill={C.amber} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots-grades)" />
      </svg>

      <div ref={ref} style={{ padding: '26px 28px 22px', display: 'flex', flexDirection: 'column', gap: 18, height: '100%', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: `rgba(198,208,216,0.1)`, border: `1px solid rgba(198,208,216,0.22)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart3 style={{ width: 15, height: 15, color: C.amber }} />
            </div>
            <span className="font-display font-bold" style={{ fontSize: 17, color: C.white }}>Performance Grades</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 6, background: `rgba(198,208,216,0.08)`, border: `1px solid rgba(198,208,216,0.2)`, fontSize: 9, color: C.amber, fontWeight: 700, letterSpacing: '0.1em' }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
            LIVE
          </div>
        </div>

        {/* Center: ring + stat bars */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flex: 1, minHeight: 0 }}>
          {/* Grade ring */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', width: 160, height: 160 }}>
              {/* Outer glow halo */}
              <div style={{
                position: 'absolute', inset: -12, borderRadius: '50%', pointerEvents: 'none',
                background: `radial-gradient(circle, rgba(198,208,216,0.10) 0%, transparent 70%)`,
              }} />
              <svg width={160} height={160} viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
                <defs>
                  <linearGradient id="ring-grad-g" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={C.amber} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={C.amber} stopOpacity="1" />
                  </linearGradient>
                </defs>
                {/* Track */}
                <circle cx={80} cy={80} r={68} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
                {/* Animated fill */}
                <motion.circle
                  cx={80} cy={80} r={68} fill="none"
                  stroke="url(#ring-grad-g)" strokeWidth={8} strokeLinecap="round"
                  strokeDasharray={CIRC}
                  initial={{ strokeDashoffset: CIRC }}
                  animate={inView ? { strokeDashoffset: targetOffset } : {}}
                  transition={{ duration: 1.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                />
              </svg>
              {/* Center text */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                <span className="font-display font-bold" style={{ fontSize: 54, color: C.amber, lineHeight: 1, textShadow: `0 0 24px rgba(198,208,216,0.45)` }}>A−</span>
                <span style={{ fontSize: 9, color: C.white40, letterSpacing: '0.18em' }}>SEASON</span>
              </div>
            </div>
            <span style={{ fontSize: 10, color: C.white40, letterSpacing: '0.08em' }}>Mar 18 · Game 47</span>
          </div>

          {/* Stat bars */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 13 }}>
            {(stats as typeof stats).map(({ label, pct, color, icon: Icon }, i) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Icon style={{ width: 10, height: 10, color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: C.white60 }}>{label}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: "'Outfit',sans-serif" }}>{pct}</span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <motion.div
                    style={{
                      height: '100%', borderRadius: 3,
                      background: `linear-gradient(90deg, ${color}60, ${color})`,
                      boxShadow: `0 0 8px ${color}35`,
                    }}
                    initial={{ width: 0 }}
                    animate={inView ? { width: `${pct}%` } : {}}
                    transition={{ duration: 1.2, delay: 0.5 + i * 0.09, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: 7-game sparkline */}
        <div>
          <div style={{ fontSize: 9, color: C.white40, letterSpacing: '0.14em', marginBottom: 7 }}>LAST 7 GAMES</div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 26 }}>
            {gameGrades.map((g, i) => {
              const isLast = i === gameGrades.length - 1;
              return (
                <motion.div
                  key={i}
                  style={{
                    flex: 1, borderRadius: '2px 2px 0 0',
                    background: isLast ? C.amber : 'rgba(255,255,255,0.14)',
                    boxShadow: isLast ? `0 0 10px rgba(198,208,216,0.4)` : 'none',
                  }}
                  initial={{ height: 0 }}
                  animate={inView ? { height: `${(g / maxG) * 100}%` } : {}}
                  transition={{ duration: 0.5, delay: 0.9 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </BentoShell>
  );
}

// ── Cell 2: AI Video Analysis (compact — col 3, row 1) ────────────────────────
function VideoCell({ index }: { index: number }) {
  const accent = '#22c55e';
  return (
    <BentoShell col="3 / 4" row="1 / 2" index={index} size={300} accent={accent}>
      {/* Green bg glow */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse 70% 60% at 80% 15%, rgba(34,197,94,0.07) 0%, transparent 65%)`,
      }} />
      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 11, height: '100%', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Video style={{ width: 13, height: 13, color: accent }} />
            </div>
            <span className="font-display font-bold" style={{ fontSize: 13, color: C.white }}>AI Video Analysis</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 5, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.22)', fontSize: 9, color: accent, fontWeight: 700 }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: accent, display: 'inline-block', animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
            LIVE
          </div>
        </div>

        {/* Mock video frame */}
        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', flex: 1, minHeight: 0 }}>
          {/* Court background */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(160deg, #112211 0%, #0a1a0a 50%, #0a1018 100%)',
          }} />
          {/* Court line SVG */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 200 120" preserveAspectRatio="none">
            {/* Paint */}
            <rect x="60" y="45" width="80" height="75" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.7" />
            {/* Free throw arc */}
            <path d="M 60 45 A 40 40 0 0 1 140 45" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.7" />
            {/* 3pt arc */}
            <path d="M 5 120 A 90 90 0 0 1 195 120" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.7" />
            {/* Basket */}
            <circle cx="100" cy="38" r="5" fill="none" stroke="rgba(255,150,50,0.6)" strokeWidth="1" />
          </svg>
          {/* Detection overlays */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 200 120">
            {/* YOU — green box */}
            <rect x="72" y="30" width="26" height="52" rx="1.5" fill="rgba(34,197,94,0.06)" stroke={accent} strokeWidth="1.2" strokeDasharray="3 1.5" />
            <rect x="72" y="23" width="50" height="9" rx="2" fill="rgba(34,197,94,0.8)" />
            <text x="75" y="30" fontSize="5.5" fill="#000" fontWeight="700" fontFamily="monospace">#23 — YOU</text>
            {/* Opponent */}
            <rect x="120" y="42" width="22" height="44" rx="1.5" fill="none" stroke="rgba(198,208,216,0.45)" strokeWidth="0.8" strokeDasharray="2 1.5" />
            {/* Ball */}
            <circle cx="106" cy="50" r="4" fill="none" stroke="#f59e0b" strokeWidth="1.2" />
          </svg>
          {/* Confidence bar */}
          <div style={{ position: 'absolute', bottom: 6, left: 7, right: 7, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ flex: 1, height: 3, background: 'rgba(0,0,0,0.5)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: '94%', height: '100%', background: accent, borderRadius: 2, boxShadow: `0 0 6px rgba(34,197,94,0.5)` }} />
            </div>
            <span style={{ fontSize: 8, color: accent, fontFamily: 'monospace', flexShrink: 0, fontWeight: 700 }}>94%</span>
          </div>
        </div>

        {/* Stat chips */}
        <div style={{ display: 'flex', gap: 5 }}>
          {[{ v: '24', l: 'PTS', c: C.amber }, { v: '7', l: 'AST', c: '#a78bfa' }, { v: '3', l: 'STL', c: accent }].map(({ v, l, c }) => (
            <div key={l} style={{
              flex: 1, padding: '5px 4px', borderRadius: 7, textAlign: 'center',
              background: `${c}0d`, border: `1px solid ${c}28`,
            }}>
              <div className="font-display font-bold" style={{ fontSize: 15, color: c, lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 9, color: C.white40, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </BentoShell>
  );
}

// ── Cell 3: Skill Badges (compact — col 3, row 2) ─────────────────────────────
function BadgesCell({ index }: { index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const accent = '#a78bfa';

  const badges = [
    { label: 'Sharpshooter', icon: Target,   color: C.amber,   earned: true  },
    { label: 'Floor General', icon: Shield,   color: '#38bdf8', earned: true  },
    { label: 'Glass Cleaner', icon: Activity, color: accent,    earned: false },
    { label: 'Lockdown',      icon: Zap,      color: '#22c55e', earned: false },
  ] as const;

  return (
    <BentoShell col="3 / 4" row="2 / 3" index={index} size={300} accent={accent}>
      {/* Purple bg glow */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse 70% 60% at 80% 80%, rgba(167,139,250,0.08) 0%, transparent 65%)`,
      }} />
      <div ref={ref} style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 12, height: '100%', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award style={{ width: 13, height: 13, color: accent }} />
          </div>
          <span className="font-display font-bold" style={{ fontSize: 13, color: C.white }}>Skill Badges</span>
        </div>

        {/* 2×2 badge grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 7, flex: 1 }}>
          {(badges as typeof badges).map(({ label, icon: Icon, color, earned }) => (
            <div key={label} style={{
              borderRadius: 10, padding: '10px 8px',
              background: earned ? `${color}0d` : 'rgba(255,255,255,0.025)',
              border: `1px solid ${earned ? color + '30' : 'rgba(255,255,255,0.06)'}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              opacity: earned ? 1 : 0.38,
              boxShadow: earned ? `0 0 14px ${color}15, inset 0 0 10px ${color}06` : 'none',
              position: 'relative', overflow: 'hidden',
            }}>
              {earned && (
                <div style={{
                  position: 'absolute', top: -14, left: -14, width: 50, height: 50, borderRadius: '50%', pointerEvents: 'none',
                  background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
                }} />
              )}
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: earned ? `${color}18` : 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon style={{ width: 13, height: 13, color: earned ? color : C.white40 }} />
              </div>
              <span style={{ fontSize: 9, color: earned ? C.white60 : C.white40, textAlign: 'center', lineHeight: 1.2, fontWeight: earned ? 600 : 400 }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 9, color: C.white40 }}>Next: Glass Cleaner</span>
            <span style={{ fontSize: 9, color: accent, fontWeight: 700 }}>73%</span>
          </div>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <motion.div
              style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${accent}80, ${accent})`, boxShadow: `0 0 8px ${accent}45` }}
              initial={{ width: 0 }}
              animate={inView ? { width: '73%' } : {}}
              transition={{ duration: 1.1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <div style={{ marginTop: 6, fontSize: 9, color: C.white40 }}>+47 more badges to unlock</div>
        </div>
      </div>
    </BentoShell>
  );
}

// ── Cell 4: Leaderboards (compact — col 1, row 3) ─────────────────────────────
function LeaderboardCell({ index }: { index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const accent = '#f59e0b';

  const rows = [
    { rank: 1, initials: 'JM', name: 'Jordan M.', grade: 'A+', pts: 97, you: false },
    { rank: 2, initials: 'DK', name: 'Darius K.', grade: 'A',  pts: 91, you: false },
    { rank: 3, initials: 'ME', name: 'YOU',        grade: 'A−', pts: 88, you: true  },
  ];
  const maxPts = Math.max(...rows.map(r => r.pts));

  return (
    <BentoShell col="1 / 2" row="3 / 4" index={index} size={300} accent={accent}>
      {/* Gold glow */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse 70% 60% at 20% 80%, rgba(245,158,11,0.07) 0%, transparent 65%)`,
      }} />
      <div ref={ref} style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 10, height: '100%', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trophy style={{ width: 13, height: 13, color: accent }} />
          </div>
          <span className="font-display font-bold" style={{ fontSize: 13, color: C.white }}>Leaderboards</span>
        </div>

        {/* Mini podium bars */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 28 }}>
          {rows.map(({ rank, pts, you }) => (
            <motion.div
              key={rank}
              style={{
                flex: 1, borderRadius: '3px 3px 0 0',
                background: you ? accent : rank === 1 ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.1)',
                boxShadow: you ? `0 0 10px rgba(245,158,11,0.4)` : 'none',
              }}
              initial={{ height: 0 }}
              animate={inView ? { height: `${(pts / maxPts) * 100}%` } : {}}
              transition={{ duration: 0.6, delay: 0.3 + rank * 0.09, ease: [0.16, 1, 0.3, 1] }}
            />
          ))}
        </div>

        {/* Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
          {rows.map(({ rank, initials, name, grade, pts, you }) => (
            <div key={rank} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 9px', borderRadius: 9,
              background: you ? `rgba(245,158,11,0.08)` : 'rgba(255,255,255,0.025)',
              border: `1px solid ${you ? 'rgba(245,158,11,0.22)' : 'rgba(255,255,255,0.05)'}`,
              boxShadow: you ? `0 0 12px rgba(245,158,11,0.1)` : 'none',
            }}>
              {/* Avatar */}
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: rank === 1 ? 'rgba(245,158,11,0.18)' : you ? 'rgba(198,208,216,0.12)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${rank === 1 ? 'rgba(245,158,11,0.4)' : you ? 'rgba(198,208,216,0.25)' : 'rgba(255,255,255,0.08)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, fontWeight: 800, color: rank === 1 ? accent : you ? C.amber : C.white40,
                fontFamily: "'Outfit',sans-serif",
              }}>
                {initials}
              </div>
              {/* Rank + name */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: rank === 1 ? accent : C.white40, fontFamily: "'Outfit',sans-serif" }}>#{rank}</span>
                  <span style={{ fontSize: 11, color: you ? C.white : C.white60, fontWeight: you ? 700 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                </div>
              </div>
              <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>{grade}</span>
              <span style={{ fontSize: 10, color: C.white40, fontVariantNumeric: 'tabular-nums', fontFamily: "'Outfit',sans-serif" }}>{pts}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <TrendingUp style={{ width: 10, height: 10, color: '#22c55e' }} />
          <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 600 }}>↑ 4 spots this week</span>
        </div>
      </div>
    </BentoShell>
  );
}

// ── Cell 5: Coach Tools (wide — col 2–4, row 3) ───────────────────────────────
function CoachCell({ index }: { index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const accent = '#38bdf8';

  const teamStats = [
    { label: 'Offensive Rating', val: 94, max: 100, color: accent },
    { label: 'Defensive Rating', val: 87, max: 100, color: '#22c55e' },
    { label: 'Games Logged',     val: 47, max: 60,  color: '#a78bfa' },
  ];

  const players = [
    { initials: 'MJ', name: 'Marcus J.',  pos: 'Guard',   grade: 'A',  gc: '#22c55e', spark: [70,78,82,88,91] },
    { initials: 'DK', name: 'Darius K.',  pos: 'Forward', grade: 'B+', gc: '#38bdf8', spark: [65,72,68,76,74] },
    { initials: 'AT', name: 'Aria T.',    pos: 'Center',  grade: 'A−', gc: '#22c55e', spark: [80,76,84,82,88] },
  ];

  return (
    <BentoShell col="2 / 4" row="3 / 4" index={index} size={500} accent={accent}>
      {/* Blue bg glow */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse 60% 60% at 85% 20%, rgba(56,189,248,0.07) 0%, transparent 65%)`,
      }} />
      <div ref={ref} style={{ padding: '22px 24px 20px', display: 'flex', flexDirection: 'column', gap: 14, height: '100%', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users style={{ width: 14, height: 14, color: accent }} />
            </div>
            <span className="font-display font-bold" style={{ fontSize: 15, color: C.white }}>Coach Tools</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.22)' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fb923c', display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite' }} />
            <span style={{ fontSize: 10, color: '#fb923c', fontWeight: 700 }}>2 pending</span>
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 16, flex: 1, minHeight: 0 }}>
          {/* Left: team stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 9, color: C.white40, letterSpacing: '0.14em' }}>TEAM METRICS</div>
            {teamStats.map(({ label, val, max, color }, i) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: C.white60 }}>{label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color, fontFamily: "'Outfit',sans-serif" }}>{val}</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                  <motion.div
                    style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${color}60, ${color})`, boxShadow: `0 0 6px ${color}35` }}
                    initial={{ width: 0 }}
                    animate={inView ? { width: `${(val / max) * 100}%` } : {}}
                    transition={{ duration: 1.1, delay: 0.5 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Right: player cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ fontSize: 9, color: C.white40, letterSpacing: '0.14em' }}>ROSTER</div>
            {players.map(({ initials, name, pos, grade, gc, spark }) => (
              <div key={initials} style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 10px', borderRadius: 9,
                background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.06)`,
              }}>
                {/* Avatar */}
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                  background: `${gc}15`, border: `1px solid ${gc}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800, color: gc, fontFamily: "'Outfit',sans-serif",
                }}>
                  {initials}
                </div>
                {/* Name + pos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.white, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                  <div style={{ fontSize: 9, color: C.white40, marginTop: 1 }}>{pos}</div>
                </div>
                {/* Mini sparkline */}
                <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 18 }}>
                  {spark.map((v, si) => (
                    <motion.div
                      key={si}
                      style={{
                        width: 3, borderRadius: '1px 1px 0 0',
                        background: si === spark.length - 1 ? gc : `${gc}40`,
                      }}
                      initial={{ height: 0 }}
                      animate={inView ? { height: `${(v / Math.max(...spark)) * 100}%` } : {}}
                      transition={{ duration: 0.4, delay: 0.6 + si * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    />
                  ))}
                </div>
                {/* Grade */}
                <div style={{
                  padding: '2px 7px', borderRadius: 5,
                  background: `${gc}15`, border: `1px solid ${gc}30`,
                  fontSize: 11, fontWeight: 800, color: gc, fontFamily: "'Outfit',sans-serif",
                }}>
                  {grade}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BentoShell>
  );
}

function Features() {
  return (
    <section id="features" className="py-24 px-5" style={{ background: C.bg }}>
      <div className="max-w-6xl mx-auto">
        <Reveal className="mb-12 text-center">
          <Eyebrow>Features</Eyebrow>
          <h2 className="font-display font-bold mt-4" style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: C.white }}>
            Everything you need to{' '}
            <span style={{ color: C.amber }}>level up</span>
          </h2>
        </Reveal>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: '340px 260px auto',
          gap: 12,
        }}>
          <GradesCell      index={0} />
          <VideoCell       index={1} />
          <BadgesCell      index={2} />
          <LeaderboardCell index={3} />
          <CoachCell       index={4} />
        </div>
      </div>
    </section>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// HOW IT WORKS (enhanced — animated connector + spring circles)
// ═══════════════════════════════════════════════════════════════════════════════
const STEPS = [
  { n: '01', icon: Zap,       title: 'Log your game',  body: 'Enter stats after each game in under 2 minutes. Upload video for AI-powered extraction.' },
  { n: '02', icon: BarChart3, title: 'Get graded',     body: 'AI analyzes performance and gives you an A–F grade with position-specific feedback.' },
  { n: '03', icon: TrendingUp,title: 'Get discovered',  body: 'Your profile surfaces to college coaches matching your position and skill level. They reach out to you.' },
];

function HowItWorks() {
  const lineRef = useRef(null);
  const lineInView = useInView(lineRef, { once: true, margin: '-40px' });

  return (
    <section
      id="how"
      className="py-24 px-5"
      style={{ background: C.bg1, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}
    >
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-16">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="font-display font-bold mt-4" style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: C.white }}>
            Three steps to your best season
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Animated connector line */}
          <div
            ref={lineRef}
            className="absolute hidden md:block"
            style={{ top: 47, left: '16%', right: '16%', height: 1, overflow: 'hidden' }}
          >
            <motion.div
              initial={{ scaleX: 0 }}
              animate={lineInView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                originX: 0, width: '100%', height: '100%',
                background: `linear-gradient(90deg, transparent, ${C.amberTrace} 20%, ${C.amberTrace} 80%, transparent)`,
              }}
            />
          </div>

          {STEPS.map(({ n, icon: Icon, title, body }, i) => (
            <Reveal key={n} delay={i * 0.12}>
              <div className="flex flex-col items-center text-center gap-4">
                {/* Step circle — spring pop-in */}
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20, delay: i * 0.14 }}
                  className="relative w-24 h-24 rounded-full flex items-center justify-center z-10"
                  style={{
                    background: C.bg,
                    border: `1px solid ${C.border}`,
                    boxShadow: `0 0 0 8px ${C.bg1}`,
                  }}
                >
                  <Icon className="w-7 h-7" style={{ color: C.amber }} />
                  <span
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-display"
                    style={{ background: C.amberDim, color: '#fff' }}
                  >
                    {n.replace('0', '')}
                  </span>
                </motion.div>
                <div>
                  <h3 className="font-display font-bold text-lg mb-2" style={{ color: C.white }}>{title}</h3>
                  <p className="text-[14px] leading-relaxed max-w-xs mx-auto" style={{ color: C.white40 }}>{body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTIMONIALS (keep)
// ═══════════════════════════════════════════════════════════════════════════════
const TESTIMONIALS = [
  {
    quote: 'Two D1 coaches found my Caliber profile and reached out directly. The AI scouting report is what got their attention.',
    name: 'Destiny W.', role: 'D1 College Prospect · Oakland, CA', rating: 5, initials: 'DW', color: C.amber,
  },
  {
    quote: 'After logging 47 games this season, my shooting grade went from C+ to A−. The improvement tips after each game actually work.',
    name: 'Marcus J.', role: 'High School Point Guard', rating: 5, initials: 'MJ', color: C.amber,
  },
  {
    quote: 'I manage 3 AAU teams on Caliber. The game verification system and lineup analytics save me 5+ hours every week.',
    name: 'Coach Rivera', role: 'AAU Program Director', rating: 5, initials: 'CR', color: '#38bdf8',
  },
];

function Testimonials() {
  return (
    <section className="py-24 px-5" style={{ background: C.bg }}>
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-14">
          <Eyebrow>Testimonials</Eyebrow>
          <h2 className="font-display font-bold mt-4" style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: C.white }}>
            Real athletes. <span style={{ color: C.amber }}>Real recruitments.</span>
          </h2>
        </Reveal>

        <motion.div
          variants={stagger} initial="hidden"
          whileInView="visible" viewport={{ once: true, margin: '-40px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {TESTIMONIALS.map(({ quote, name, role, rating, initials, color }, i) => (
            <motion.div key={name} variants={fadeUp} custom={i}>
              <SpotlightCard
                className="trace-border rounded-2xl p-7 h-full flex flex-col gap-5"
                style={{ background: C.bg1, border: `1px solid ${C.border}` } as React.CSSProperties}
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: rating }).map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-current" style={{ color: C.amber }} />
                  ))}
                </div>
                <p className="text-[14px] leading-relaxed flex-1" style={{ color: C.white60 }}>
                  "{quote}"
                </p>
                <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: C.borderFine }}>
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold font-display flex-shrink-0"
                    style={{ background: `${color}20`, color, border: `1px solid ${color}30` }}
                  >
                    {initials}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold font-display" style={{ color: C.white }}>{name}</div>
                    <div className="text-[11px]" style={{ color: C.white40 }}>{role}</div>
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRICING PREVIEW (keep)
// ═══════════════════════════════════════════════════════════════════════════════
const PLANS = [
  {
    name: 'Free', price: '$0', period: 'forever',
    features: ['5 games/month', 'Basic grades', 'Public profile', 'Leaderboard access'],
    cta: 'Get started', highlight: false,
  },
  {
    name: 'Pro', price: '$9', period: '/month',
    features: ['Unlimited games', 'AI video analysis', 'Full badge system', 'Recruiting profile', 'Coach tools'],
    cta: 'Start free trial', highlight: true,
  },
  {
    name: 'Team', price: '$29', period: '/month',
    features: ['Everything in Pro', 'Up to 20 players', 'Lineup analytics', 'Practice tracking', 'Priority support'],
    cta: 'Contact us', highlight: false,
  },
];

function PricingPreview() {
  return (
    <section className="py-24 px-5" style={{ background: C.bg1, borderTop: `1px solid ${C.border}` }}>
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-14">
          <Eyebrow>Pricing</Eyebrow>
          <h2 className="font-display font-bold mt-4" style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: C.white }}>
            Simple, transparent pricing
          </h2>
          <p className="mt-3 text-[15px]" style={{ color: C.white40 }}>
            Start free. Upgrade when you're ready to take it further.
          </p>
        </Reveal>

        <motion.div
          variants={stagger} initial="hidden"
          whileInView="visible" viewport={{ once: true, margin: '-40px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {PLANS.map(({ name, price, period, features, cta, highlight }, i) => (
            <motion.div key={name} variants={fadeUp} custom={i}>
              <SpotlightCard
                className={`rounded-2xl p-8 h-full flex flex-col gap-6 ${highlight ? 'trace-border' : ''}`}
                style={{
                  background: highlight ? `linear-gradient(180deg, rgba(198,208,216,0.06) 0%, ${C.bg1} 100%)` : C.bg,
                  border: `1px solid ${highlight ? C.amberTrace : C.border}`,
                  boxShadow: highlight ? `0 0 40px rgba(198,208,216,0.08)` : undefined,
                } as React.CSSProperties}
              >
                {highlight && (
                  <div className="self-start px-2.5 py-0.5 rounded-full text-[11px] font-bold font-display uppercase tracking-wider"
                    style={{ background: C.amberDim, color: '#fff' }}>
                    Most popular
                  </div>
                )}
                <div>
                  <div className="font-display font-semibold text-[13px] uppercase tracking-[0.12em] mb-2" style={{ color: C.white40 }}>
                    {name}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display font-bold text-4xl" style={{ color: C.white }}>{price}</span>
                    <span className="text-[13px]" style={{ color: C.white40 }}>{period}</span>
                  </div>
                </div>
                <ul className="flex flex-col gap-2.5 flex-1">
                  {features.map(feat => (
                    <li key={feat} className="flex items-center gap-2.5 text-[13px]" style={{ color: C.white60 }}>
                      <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: C.amber }} />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link href="/pricing">
                  <a
                    className={`py-2.5 rounded-xl text-[13px] font-semibold font-display text-center transition-all duration-200 ${highlight ? 'shimmer-btn text-white' : ''}`}
                    style={!highlight ? { background: C.white06, border: `1px solid ${C.border}`, color: C.white } : undefined}
                  >
                    {cta}
                  </a>
                </Link>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FINAL CTA (enhanced breathing glow)
// ═══════════════════════════════════════════════════════════════════════════════
function FinalCTA() {
  return (
    <section className="py-28 px-5 relative overflow-hidden" style={{ background: C.bg }}>
      {/* Breathing radial glow (CSS animation, not scroll) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(198,208,216,0.10), transparent)',
          animation: 'breathe-glow 4s ease-in-out infinite',
        }}
      />
      {/* Secondary inner glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 40% 35% at 50% 105%, rgba(198,208,216,0.15), transparent)',
          animation: 'breathe-glow 4s ease-in-out 2s infinite',
        }}
      />
      <div className="absolute bottom-0 inset-x-0 h-px" style={{
        background: `linear-gradient(90deg, transparent 10%, ${C.amberTrace} 50%, transparent 90%)`,
      }} />

      <div className="relative max-w-3xl mx-auto text-center flex flex-col items-center gap-7">
        <Reveal>
          <Eyebrow>Get started today</Eyebrow>
        </Reveal>
        <Reveal delay={0.05}>
          <h2
            className="font-display font-bold"
            style={{ fontSize: 'clamp(32px, 5vw, 56px)', color: C.white, lineHeight: 1.1 }}
          >
            Your recruiting profile
            {' '}<span style={{ color: C.amber }}>starts here.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-[15px] leading-relaxed max-w-lg" style={{ color: C.white40, fontWeight: 300 }}>
            Join 10,000+ athletes building their AI recruiting profiles. 500+ college programs are actively searching Caliber for their next recruit — make sure they find you.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <MagneticButton>
              <Link href="/login">
                <a className="shimmer-btn inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-[14px] font-bold text-white font-display">
                  Create free account
                  <ArrowRight className="w-4 h-4" />
                </a>
              </Link>
            </MagneticButton>
            <Link href="/pricing">
              <a
                className="trace-border inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-[14px] font-medium transition-colors duration-200"
                style={{ background: C.white03, border: `1px solid ${C.border}`, color: C.white60 }}
                onMouseEnter={e => (e.currentTarget.style.color = C.white)}
                onMouseLeave={e => (e.currentTarget.style.color = C.white60)}
              >
                View pricing
              </a>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FOOTER (keep)
// ═══════════════════════════════════════════════════════════════════════════════
function Footer() {
  return (
    <footer className="py-10 px-5" style={{ borderTop: `1px solid ${C.border}`, background: C.bg1 }}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="font-display text-sm font-bold tracking-[0.18em] uppercase" style={{ color: C.amber }}>
          CALIBER
        </span>
        <div className="flex items-center gap-6">
          {([
            ['Privacy', '/privacy'],
            ['Terms', '/terms'],
            ['Blog', '/blog'],
            ['Pricing', '/pricing'],
            ['Scout Hub', '/login?redirect=/scout'],
            ['Contact', 'mailto:hello@caliber.app'],
          ] as [string, string][]).map(([label, href]) => (
            <a
              key={label} href={href}
              className="text-[12px] transition-colors duration-150"
              style={{ color: C.white40 }}
              onMouseEnter={e => (e.currentTarget.style.color = C.white)}
              onMouseLeave={e => (e.currentTarget.style.color = C.white40)}
            >
              {label}
            </a>
          ))}
        </div>
        <span className="text-[12px]" style={{ color: C.white40 }}>© 2025 Caliber Performance Labs</span>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLLEGE TRUST BAR
// ═══════════════════════════════════════════════════════════════════════════════
const COLLEGES = [
  { name: 'Duke',        conf: 'ACC',      color: '#003087' },
  { name: 'Stanford',    conf: 'Pac-12',   color: '#8C1515' },
  { name: 'Michigan',    conf: 'Big Ten',  color: '#FFCB05' },
  { name: 'Kentucky',    conf: 'SEC',      color: '#0033A0' },
  { name: 'UNC',         conf: 'ACC',      color: '#7BAFD4' },
  { name: 'Gonzaga',     conf: 'WCC',      color: '#002868' },
  { name: 'Kansas',      conf: 'Big 12',   color: '#0051A5' },
  { name: 'Memphis',     conf: 'AAC',      color: '#003087' },
  { name: 'UCONN',       conf: 'Big East', color: '#000E2F' },
  { name: 'Villanova',   conf: 'Big East', color: '#003366' },
  { name: 'Creighton',   conf: 'Big East', color: '#005CA9' },
  { name: "St. Mary's",  conf: 'WCC',      color: '#8C1D40' },
];

function CollegeTrustBar() {
  const doubled = [...COLLEGES, ...COLLEGES];
  return (
    <div style={{
      background: C.bg1,
      borderTop: `1px solid ${C.border}`,
      borderBottom: `1px solid ${C.border}`,
      padding: '20px 0',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Fade edges */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, zIndex: 2,
        background: `linear-gradient(to right, ${C.bg1}, transparent)`,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, zIndex: 2,
        background: `linear-gradient(to left, ${C.bg1}, transparent)`,
        pointerEvents: 'none',
      }} />

      <div style={{ marginBottom: 8, textAlign: 'center', fontSize: 10, fontWeight: 700, color: C.white40, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
        College programs actively recruiting on Caliber
      </div>

      <div style={{ display: 'flex', width: 'max-content', animation: 'marquee-left 32s linear infinite' }}>
        {doubled.map((c, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 18px',
            margin: '0 6px',
            borderRadius: 30,
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid rgba(255,255,255,0.07)`,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: `linear-gradient(135deg, ${c.color}60, ${c.color}30)`,
              border: `1px solid ${c.color}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 7, fontWeight: 900, color: '#fff', fontFamily: "'Outfit',sans-serif",
            }}>
              {c.name.slice(0, 2).toUpperCase()}
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.white60 }}>{c.name}</span>
            <span style={{ fontSize: 10, color: C.white40, borderLeft: `1px solid ${C.border}`, paddingLeft: 8 }}>{c.conf}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE ROOT
// ═══════════════════════════════════════════════════════════════════════════════
export default function ModernLandingPage() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      <style>{GLOBAL_STYLES}</style>
      <GlobalCursor />
      <Nav />
      <Hero />
      <Marquee />
      <CollegeTrustBar />
      <AppShowcase />
      <Stats />
      <GetDiscovered />
      <Features />
      <HowItWorks />
      <Testimonials />
      <PricingPreview />
      <FinalCTA />
      <Footer />
    </div>
  );
}
