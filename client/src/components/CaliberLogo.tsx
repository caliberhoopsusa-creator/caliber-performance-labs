import { useRef, useEffect, useState, useCallback } from "react";
import shieldLogo from "@assets/caliber-shield-logo.png";

interface CaliberLogoProps {
  size?: number;
  color?: string;
  className?: string;
  /**
   * Chrome-fill mode (operator 2026-07-17, metal-led direction): paints the
   * glyph with the liquid-metal sheen (same stops as `.wordmark-metal` /
   * `METAL_TEXT_STYLE`) instead of a flat color. Takes priority over `color`.
   */
  chrome?: boolean;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

function getAccentColorFromCSS(): string {
  const style = getComputedStyle(document.documentElement);
  const accent = style.getPropertyValue("--accent").trim();
  if (!accent) return "#4f6878";
  const parts = accent.split(/\s+/);
  if (parts.length >= 3) {
    return `hsl(${parts[0]}, ${parts[1]}, ${parts[2]})`;
  }
  return "#4f6878";
}

function hslStringToHex(hslStr: string): string {
  const match = hslStr.match(/hsl\((\d+),\s*([\d.]+)%?,\s*([\d.]+)%?\)/);
  if (!match) return hslStr;
  const h = parseInt(match[1]) / 360;
  const s = parseFloat(match[2]) / 100;
  const l = parseFloat(match[3]) / 100;

  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const IMG_ASPECT = 1204 / 650;

/** Read a token's raw "H S% L%" custom property as a canvas-safe hsl() string
 *  (canvas fillStyle can't resolve var() — it isn't cascaded to an element). */
function resolveTokenHsl(varName: string, fallback = "#9aa3ad"): string {
  if (typeof document === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  const parts = raw.split(/\s+/);
  return parts.length >= 3 ? `hsl(${parts[0]}, ${parts[1]}, ${parts[2]})` : fallback;
}

export function CaliberLogo({ size = 32, color, chrome, className }: CaliberLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [aspect, setAspect] = useState(IMG_ASPECT);

  const displayHeight = size;
  const displayWidth = Math.round(displayHeight * aspect);

  const recolor = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgLoaded) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (chrome) {
      /* Chrome-fill: build a pure alpha silhouette from the glyph's darkness
         (white fill, alpha = darkness), then composite the liquid-metal
         gradient into it with `source-in` — a true chrome fill instead of a
         flat recolor. Tokens only (design-language §4). */
      const silhouette = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const sData = silhouette.data;
      for (let i = 0; i < sData.length; i += 4) {
        const r = sData[i], g = sData[i + 1], b = sData[i + 2], a = sData[i + 3];
        if (a < 10) continue;
        const darkness = 1 - (r + g + b) / 3 / 255;
        if (darkness > 0.15) {
          sData[i] = 255;
          sData[i + 1] = 255;
          sData[i + 2] = 255;
          sData[i + 3] = Math.round(darkness * 255);
        } else {
          sData[i + 3] = 0;
        }
      }
      ctx.putImageData(silhouette, 0, 0);

      const gradient = ctx.createLinearGradient(
        0,
        canvas.height * 0.1,
        canvas.width,
        canvas.height * 0.9,
      );
      gradient.addColorStop(0, resolveTokenHsl("--silver-mute"));
      gradient.addColorStop(0.25, resolveTokenHsl("--silver"));
      gradient.addColorStop(0.5, resolveTokenHsl("--silver-hi"));
      gradient.addColorStop(0.75, resolveTokenHsl("--silver"));
      gradient.addColorStop(1, resolveTokenHsl("--silver-mute"));

      ctx.globalCompositeOperation = "source-in";
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";
      return;
    }

    /* Resolve the target color to hex. Accepts hex, hsl(...), or a token
       reference like "hsl(var(--crimson))" (tokens-only rule — no raw hex at
       call sites). Raw token values are space-separated: "356 85% 55%". */
    let targetHex: string | undefined = color;
    if (targetHex) {
      const varMatch = targetHex.match(/^hsl\(\s*var\((--[\w-]+)\)\s*\)$/);
      if (varMatch) {
        const raw = getComputedStyle(document.documentElement)
          .getPropertyValue(varMatch[1])
          .trim();
        const parts = raw.split(/\s+/);
        targetHex =
          parts.length >= 3
            ? hslStringToHex(`hsl(${parts[0]}, ${parts[1]}, ${parts[2]})`)
            : undefined;
      } else if (targetHex.startsWith("hsl")) {
        targetHex = hslStringToHex(targetHex);
      }
    }
    if (!targetHex) {
      const cssColor = getAccentColorFromCSS();
      targetHex = cssColor.startsWith("hsl") ? hslStringToHex(cssColor) : cssColor;
    }

    const rgb = hexToRgb(targetHex);
    if (!rgb) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a < 10) continue;

      const brightness = (r + g + b) / 3;
      const darkness = 1 - brightness / 255;

      if (darkness > 0.15) {
        data[i] = rgb.r;
        data[i + 1] = rgb.g;
        data[i + 2] = rgb.b;
        data[i + 3] = Math.round(darkness * 255);
      } else {
        data[i + 3] = 0;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [displayWidth, displayHeight, color, chrome, imgLoaded]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      if (img.naturalWidth && img.naturalHeight) {
        setAspect(img.naturalWidth / img.naturalHeight);
      }
      setImgLoaded(true);
    };
    img.src = shieldLogo;
  }, []);

  useEffect(() => {
    recolor();
  }, [recolor]);

  useEffect(() => {
    /* only the "follow the live accent token" path needs to watch for theme
       mutations — an explicit color or chrome fill is already token-resolved
       fresh on every recolor() call. */
    if (!color && !chrome) {
      const observer = new MutationObserver(() => recolor());
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
      return () => observer.disconnect();
    }
  }, [color, chrome, recolor]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="img-caliber-logo"
      className={className}
      style={{
        width: displayWidth,
        height: displayHeight,
      }}
      role="img"
      aria-label="Caliber Logo"
    />
  );
}
