import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

export const ease = [0.16, 1, 0.3, 1] as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease },
  }),
};

export const stagger = { visible: { transition: { staggerChildren: 0.07 } } };

export function GlobalCursor() {
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);
  const glowX = useSpring(mouseX, { stiffness: 80, damping: 20 });
  const glowY = useSpring(mouseY, { stiffness: 80, damping: 20 });
  const glowLeft = useTransform(glowX, (x) => x - 450);
  const glowTop = useTransform(glowY, (y) => y - 450);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      aria-hidden
      style={{
        position: "fixed",
        left: glowLeft,
        top: glowTop,
        width: 900,
        height: 900,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(198,208,216,0.06) 0%, transparent 65%)",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
}

export function SplitReveal({
  text,
  className = "",
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <span ref={ref} className={className} style={{ display: "inline-block" }}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          style={{ display: "inline-block" }}
          initial={{ opacity: 0, y: 22, filter: "blur(10px)" }}
          animate={
            inView
              ? { opacity: 1, y: 0, filter: "blur(0px)" }
              : {}
          }
          transition={{ duration: 0.55, delay: delay + i * 0.028, ease }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  );
}

export function MagneticButton({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 25 });
  const sy = useSpring(y, { stiffness: 200, damping: 25 });

  const onMove = useCallback(
    (e: React.MouseEvent) => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      x.set((e.clientX - (r.left + r.width / 2)) * 0.35);
      y.set((e.clientY - (r.top + r.height / 2)) * 0.35);
    },
    [x, y]
  );

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={onMove}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      <motion.div style={{ x: sx, y: sy }}>{children}</motion.div>
    </div>
  );
}

export function TiltCard({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const sX = useSpring(rotX, { stiffness: 150, damping: 20 });
  const sY = useSpring(rotY, { stiffness: 150, damping: 20 });

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    rotX.set(((e.clientY - (r.top + r.height / 2)) / r.height) * -8);
    rotY.set(((e.clientX - (r.left + r.width / 2)) / r.width) * 8);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => {
        rotX.set(0);
        rotY.set(0);
      }}
      style={{
        rotateX: sX,
        rotateY: sY,
        transformPerspective: 900,
        ...style,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      variants={fadeUp}
      custom={delay}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
    >
      {children}
    </motion.div>
  );
}

const SAMPLE_EVENTS = [
  { player: "Aria T.", action: "got scouted by USC" },
  { player: "Marcus J.", action: "earned Sharpshooter badge" },
  { player: "Destiny W.", action: "matched with 3 D1 programs" },
  { player: "Coach Rivera", action: "verified 3 games" },
  { player: "Jaylen M.", action: "profile viewed by Michigan" },
];

export function LiveFeed() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setIdx((i) => (i + 1) % SAMPLE_EVENTS.length),
      2800
    );
    return () => clearInterval(id);
  }, []);
  const ev = SAMPLE_EVENTS[idx];

  return (
    <div
      className="hidden sm:block fixed z-20 max-w-[272px]"
      style={{ bottom: 24, right: 24 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10, x: 8 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
          className="rounded-xl px-3.5 py-2.5 border border-border backdrop-blur-xl"
          style={{ background: "rgba(12,12,12,0.92)" }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/60" />
            <span className="font-label text-muted-foreground">Sample activity</span>
          </div>
          <div className="text-xs text-muted-foreground leading-snug">
            <span className="text-foreground font-semibold">{ev.player}</span>{" "}
            {ev.action}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
