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
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      data-testid="img-caliber-logo"
      aria-label="Caliber Logo"
    >
      <path
        d="M50 4L12 22V58C12 76 28 92 50 97C72 92 88 76 88 58V22L50 4Z"
        fill={color}
        fillOpacity={0.15}
        stroke={color}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <path
        d="M50 12L18 27V58C18 73 31 86 50 91C69 86 82 73 82 58V27L50 12Z"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeOpacity={0.3}
        strokeLinejoin="round"
      />
      <text
        x="50"
        y="62"
        textAnchor="middle"
        fontFamily="'Teko', 'Inter', system-ui, sans-serif"
        fontWeight="700"
        fontSize="52"
        fill={color}
        letterSpacing="-1"
      >
        C
      </text>
    </svg>
  );
}
