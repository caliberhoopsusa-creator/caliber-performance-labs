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
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      data-testid="img-caliber-logo"
      aria-label="Caliber Logo"
    >
      <path
        d="
          M100 10
          L170 40
          L170 120
          C170 160 140 185 100 195
          C60 185 30 160 30 120
          L30 40
          Z
        "
        stroke={color}
        strokeWidth="14"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="
          M130 68
          L110 68
          C108 60 105 56 100 53
          C94 50 88 50 82 53
          C76 56 72 62 72 72
          L72 128
          C72 138 76 144 82 147
          C88 150 94 150 100 147
          C105 144 108 140 110 132
          L130 132
          C128 148 120 158 110 163
          C102 167 94 167 86 163
          C74 157 58 145 58 128
          L58 72
          C58 55 74 43 86 37
          C94 33 102 33 110 37
          C120 42 128 52 130 68
          Z
        "
        fill={color}
      />
    </svg>
  );
}
