type RideIconProps = {
  className?: string;
  size?: number;
};

export function RideIcon({ className, size = 48 }: RideIconProps) {
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
      <path d="M5.2 10.2 7 6.5c.3-.7 1-1.2 1.8-1.2h6.4c.8 0 1.5.5 1.8 1.2l1.8 3.7" />
      <path d="M4 11.5h16v5.3H4z" />
      <path d="M6.2 16.8v1.7M17.8 16.8v1.7" />
      <circle cx="7.2" cy="14.2" r="1" />
      <circle cx="16.8" cy="14.2" r="1" />
      <path d="M8.6 11.5h6.8" />
    </svg>
  );
}
