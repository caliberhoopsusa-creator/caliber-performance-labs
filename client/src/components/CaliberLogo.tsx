import { useEffect, useRef, useState } from "react";
import logoImage from "@assets/Gemini_Generated_Image_fzcsbpfzcsbpfzcs_1770855414576.png";

interface CaliberLogoProps {
  size?: number;
  color?: string;
  className?: string;
}

let cachedMaskUrl: string | null = null;

function createMask(): Promise<string> {
  if (cachedMaskUrl) return Promise.resolve(cachedMaskUrl);

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (brightness > 200) {
          data[i + 3] = 0;
        } else {
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
          data[i + 3] = 255;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      cachedMaskUrl = canvas.toDataURL();
      resolve(cachedMaskUrl);
    };
    img.src = logoImage;
  });
}

export function CaliberLogo({ size = 32, color = "#F97316", className }: CaliberLogoProps) {
  const [maskUrl, setMaskUrl] = useState(cachedMaskUrl);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!maskUrl) {
      createMask().then((url) => {
        if (mounted.current) setMaskUrl(url);
      });
    }
    return () => { mounted.current = false; };
  }, []);

  if (!maskUrl) {
    return <div style={{ width: size, height: size }} className={className} data-testid="img-caliber-logo" />;
  }

  return (
    <div
      data-testid="img-caliber-logo"
      aria-label="Caliber Logo"
      className={className}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        maskImage: `url(${maskUrl})`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskImage: `url(${maskUrl})`,
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
      }}
    />
  );
}
