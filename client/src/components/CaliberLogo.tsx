import monogramLogo from "@assets/caliber-logo-monogram.png";

interface CaliberLogoProps {
  size?: number;
  color?: string;
  className?: string;
}

export function CaliberLogo({ size = 32, className }: CaliberLogoProps) {
  return (
    <img
      src={monogramLogo}
      alt="Caliber Logo"
      data-testid="img-caliber-logo"
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
      }}
    />
  );
}
