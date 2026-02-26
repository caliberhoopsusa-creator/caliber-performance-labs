import shieldLogo from "@assets/caliber-shield-logo.png";

interface CaliberLogoProps {
  size?: number;
  color?: string;
  className?: string;
}

export function CaliberLogo({ size = 32, className }: CaliberLogoProps) {
  return (
    <img
      src={shieldLogo}
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
