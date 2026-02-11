interface CaliberLogoProps {
  size?: number;
  color?: string;
  className?: string;
}

export function CaliberLogo({ size = 32, color = "currentColor", className }: CaliberLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      data-testid="img-caliber-logo"
    >
      <path
        d="M6 3h20a3 3 0 0 1 3 3v12c0 2.5-1 4.8-2.8 6.5L16 31l-10.2-6.5C4 22.8 3 20.5 3 18V6a3 3 0 0 1 3-3z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.5 11.5a5.5 5.5 0 1 0-3 9.8"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
