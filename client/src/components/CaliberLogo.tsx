import caliberLogoImg from "@assets/caliber-logo-orange.png";

interface CaliberLogoProps {
  size?: number;
  color?: string;
  className?: string;
}

export function CaliberLogo({ size = 32, className }: CaliberLogoProps) {
  return (
    <img
      src={caliberLogoImg}
      alt="Caliber Logo"
      width={size}
      height={size}
      className={`object-cover rounded-md ${className || ""}`}
      style={{ width: size, height: size }}
      data-testid="img-caliber-logo"
      draggable={false}
    />
  );
}
