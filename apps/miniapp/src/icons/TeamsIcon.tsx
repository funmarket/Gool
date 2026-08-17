type TeamsIconProps = {
  className?: string;
  size?: number;
};

export function TeamsIcon({ className, size = 48 }: TeamsIconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="8" r="2.5" />
      <circle cx="16.5" cy="9" r="2" />
      <path d="M4.5 18v-1.2c0-2.3 1.9-4.3 4.3-4.3h.4c2.4 0 4.3 2 4.3 4.3V18" />
      <path d="M14.2 13.4c.7-.5 1.6-.8 2.5-.8 2.1 0 3.8 1.6 3.8 3.7V18" />
      <path d="M2.8 17.6v-1c0-1.7 1.1-3.2 2.6-3.7" />
    </svg>
  );
}
