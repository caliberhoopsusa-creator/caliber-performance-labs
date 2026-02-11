interface CaliberLogoProps {
  size?: number;
  color?: string;
  className?: string;
}

export function CaliberLogo({ size = 32, color = "#F97316", className }: CaliberLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      data-testid="img-caliber-logo"
      aria-label="Caliber Logo"
    >
      <path
        d="
          M26 8 L50 2 L74 8 L82 12 L82 34 L74 34 L74 28
          C70 22 63 18 54 16 L50 16 C41 16 34 20 30 26
          L28 30 L28 74 L30 78
          C34 84 41 88 50 88 L54 88 C63 86 70 82 74 76
          L74 70 L82 70 L82 82
          C78 90 70 96 60 100 L50 102
          C36 100 24 94 18 84 L16 78 L16 30
          L18 20 Z
        "
        fill={color}
      />
      <path
        d="
          M42 36 C46 32 50 31 54 32 C60 34 64 38 66 44
          L66 48 L58 48 L58 46 C56 42 54 40 50 39
          C48 39 46 40 44 42 L43 44 L43 68 L44 70
          C46 72 48 73 50 73 C54 72 56 70 58 66
          L58 64 L66 64 L66 68
          C64 74 60 78 54 80 C50 81 46 80 42 78
          C38 74 36 70 36 64 L36 48
          C36 42 38 38 42 36 Z
        "
        fill={color}
      />
    </svg>
  );
}
