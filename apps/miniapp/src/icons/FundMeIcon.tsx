type FundMeIconProps = {
  className?: string;
  size?: number;
};

export function FundMeIcon({ className, size = 48 }: FundMeIconProps) {
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
      <path d="M8 4h8v4.5c0 3.1-1.8 5.5-4 5.5s-4-2.4-4-5.5V4Z" />
      <path d="M8 6H4.8v1.5c0 2.5 1.5 4 3.8 4.3" />
      <path d="M16 6h3.2v1.5c0 2.5-1.5 4-3.8 4.3" />
      <path d="M12 14v3.2" />
      <path d="M8.5 20h7" />
      <path d="M10 17.2h4" />
      <path d="m12 6.2.8 1.6 1.8.3-1.3 1.3.3 1.8-1.6-.8-1.6.8.3-1.8-1.3-1.3 1.8-.3.8-1.6Z" />
    </svg>
  );
}
