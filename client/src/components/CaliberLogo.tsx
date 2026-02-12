import logoImage from "@assets/Gemini_Generated_Image_fzcsbpfzcsbpfzcs_1770855414576.png";

interface CaliberLogoProps {
  size?: number;
  color?: string;
  className?: string;
}

export function CaliberLogo({ size = 32, color = "#F97316", className }: CaliberLogoProps) {
  return (
    <div
      data-testid="img-caliber-logo"
      aria-label="Caliber Logo"
      className={className}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        maskImage: `url(${logoImage})`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskImage: `url(${logoImage})`,
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
      }}
    />
  );
}
