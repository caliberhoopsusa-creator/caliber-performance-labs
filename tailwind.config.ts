import type { Config } from "tailwindcss";
import { tokens } from "./client/src/config/tokens";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // CSS variable colors — required for shadcn/ui and theming
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
          border: "hsl(var(--card-border) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
          border: "hsl(var(--popover-border) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
          border: "var(--primary-border)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
          border: "var(--secondary-border)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
          border: "var(--muted-border)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
          border: "var(--accent-border)",
          hover: "hsl(var(--accent-hover) / <alpha-value>)",
        },
        cta: {
          DEFAULT: "hsl(var(--cta) / <alpha-value>)",
          foreground: "hsl(var(--cta-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
          border: "var(--destructive-border)",
        },
        ring: "hsl(var(--ring) / <alpha-value>)",
        chart: {
          "1": "hsl(var(--chart-1) / <alpha-value>)",
          "2": "hsl(var(--chart-2) / <alpha-value>)",
          "3": "hsl(var(--chart-3) / <alpha-value>)",
          "4": "hsl(var(--chart-4) / <alpha-value>)",
          "5": "hsl(var(--chart-5) / <alpha-value>)",
        },
        sidebar: {
          ring: "hsl(var(--sidebar-ring) / <alpha-value>)",
          DEFAULT: "hsl(var(--sidebar-background) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-foreground) / <alpha-value>)",
          border: "hsl(var(--sidebar-border) / <alpha-value>)",
        },
        "sidebar-primary": {
          DEFAULT: "hsl(var(--sidebar-primary) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-primary-foreground) / <alpha-value>)",
          border: "var(--sidebar-primary-border)",
        },
        "sidebar-accent": {
          DEFAULT: "hsl(var(--sidebar-accent) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-accent-foreground) / <alpha-value>)",
          border: "var(--sidebar-accent-border)",
        },
        status: {
          online: "rgb(34 197 94)",
          away: "rgb(245 158 11)",
          busy: "rgb(239 68 68)",
          offline: "rgb(156 163 175)",
        },
        // Token-based colors
        neutral: tokens.colors.neutral,
        semantic: tokens.colors.semantic,
        "primary-dark": tokens.colors.primaryDark,
        "primary-light": tokens.colors.primaryLight,
        // Amber scale for direct use
        amber: {
          400: "#dde4e8",
          500: "#C6D0D8",
          600: "#4f6878",
          700: "#3d5262",
          800: "#2a3d4a",
          900: "#1a2d38",
        },
        // ── SIGNAL scales (docs/DESIGN-LANGUAGE.md §3) ──
        obsidian: {
          0: "hsl(var(--obsidian-0) / <alpha-value>)",
          1: "hsl(var(--obsidian-1) / <alpha-value>)",
          2: "hsl(var(--obsidian-2) / <alpha-value>)",
          3: "hsl(var(--obsidian-3) / <alpha-value>)",
        },
        silver: {
          DEFAULT: "hsl(var(--silver) / <alpha-value>)",
          hi: "hsl(var(--silver-hi) / <alpha-value>)",
          lo: "hsl(var(--silver-lo) / <alpha-value>)",
          mute: "hsl(var(--silver-mute) / <alpha-value>)",
        },
        crimson: {
          DEFAULT: "hsl(var(--crimson) / <alpha-value>)",
          hot: "hsl(var(--crimson-hot) / <alpha-value>)",
          deep: "hsl(var(--crimson-deep) / <alpha-value>)",
        },
        // --line carries its own alpha (the 1px border everywhere)
        line: "hsl(var(--line))",
        grade: {
          "a-plus": "hsl(var(--grade-a-plus) / <alpha-value>)",
          a: "hsl(var(--grade-a) / <alpha-value>)",
          b: "hsl(var(--grade-b) / <alpha-value>)",
          c: "hsl(var(--grade-c) / <alpha-value>)",
          d: "hsl(var(--grade-d) / <alpha-value>)",
          f: "hsl(var(--grade-f) / <alpha-value>)",
        },
        tier: {
          elite: "hsl(var(--tier-elite) / <alpha-value>)",
          strong: "hsl(var(--tier-strong) / <alpha-value>)",
          solid: "hsl(var(--tier-solid) / <alpha-value>)",
          developing: "hsl(var(--tier-developing) / <alpha-value>)",
          raw: "hsl(var(--tier-raw) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        serif: ["var(--font-serif)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      // SIGNAL fluid type scale — text-hero / text-title / text-stat / …
      fontSize: {
        hero: ["var(--text-hero)", { lineHeight: "1" }],
        title: ["var(--text-title)", { lineHeight: "1.05" }],
        stat: ["var(--text-stat)", { lineHeight: "1" }],
        section: ["var(--text-section)", { lineHeight: "1.3" }],
        body: ["var(--text-body)", { lineHeight: "1.5" }],
        label: ["var(--text-label)", { lineHeight: "1.2", letterSpacing: "0.18em" }],
        data: ["var(--text-data)", { lineHeight: "1.4" }],
      },
      borderRadius: {
        lg: ".5625rem",
        md: ".375rem",
        sm: ".1875rem",
        xl: tokens.radius.xl,
        "2xl": tokens.radius["2xl"],
        "3xl": "1.75rem",
        full: tokens.radius.full,
        // SIGNAL shape steps — sharp-ish on purpose (instrument, not bubble)
        input: "var(--radius-input)",
        card: "var(--radius-card)",
        modal: "var(--radius-modal)",
      },
      spacing: {
        xs: tokens.spacing.xs,
        sm: tokens.spacing.sm,
        md: tokens.spacing.md,
        lg: tokens.spacing.lg,
        xl: tokens.spacing.xl,
        "2xl": tokens.spacing["2xl"],
        "3xl": tokens.spacing["3xl"],
        "4xl": tokens.spacing["4xl"],
        section: "var(--space-section)",
      },
      boxShadow: {
        ...tokens.shadows,
        "glow-sm": "0 0 10px rgba(224,36,36,0.25), 0 0 30px rgba(224,36,36,0.08)",
        "glow-md": "0 0 20px rgba(224,36,36,0.35), 0 0 60px rgba(224,36,36,0.12)",
        "glow-lg": "0 0 40px rgba(224,36,36,0.4), 0 0 100px rgba(224,36,36,0.15)",
        "glow-platinum": "0 0 20px rgba(198,208,216,0.3), 0 0 60px rgba(198,208,216,0.08)",
        "inner-glow": "inset 0 1px 0 rgba(255,255,255,0.05)",
      },
      transitionDuration: {
        fast: "150ms",
        normal: "300ms",
        slow: "500ms",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "out-expo": "var(--ease-out-expo)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "hero-glow": "radial-gradient(ellipse at 60% 40%, rgba(198,208,216,0.12) 0%, transparent 45%), radial-gradient(ellipse at 20% 80%, rgba(224,36,36,0.08) 0%, transparent 40%)",
        "amber-glow": "radial-gradient(ellipse at center, rgba(198,208,216,0.2) 0%, transparent 70%)",
        "noise": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "float-delayed": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(224, 36, 36, 0.3), 0 0 40px rgba(198, 208, 216, 0.1)" },
          "50%": { boxShadow: "0 0 40px rgba(224, 36, 36, 0.5), 0 0 80px rgba(224, 36, 36, 0.15)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(32px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        float: "float 4s ease-in-out infinite",
        "float-delayed": "float-delayed 5s ease-in-out infinite 1s",
        "glow-pulse": "glow-pulse 2.5s ease-in-out infinite",
        shimmer: "shimmer 2.5s infinite",
        "fade-up": "fade-up 0.5s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "slide-in-right": "slide-in-right 0.4s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
