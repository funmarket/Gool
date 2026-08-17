type RequestsIconProps = {
  className?: string;
  size?: number;
};

export function RequestsIcon({ className, size = 48 }: RequestsIconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="M12 5v14" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M3 9h3v6H3" />
      <path d="M21 9h-3v6h3" />
    </svg>
  );
}
