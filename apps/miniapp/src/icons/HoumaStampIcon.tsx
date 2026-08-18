import type { HoomaIconProps } from './types';
export function HoumaStampIcon({ className, size = 48, title }: HoomaIconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      <title>{title}</title>
      <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="2" />
      <circle
        cx="24"
        cy="24"
        r="16.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <path d="m24 16 5 3.6-1.9 5.9h-6.2L19 19.6 24 16Z" fill="currentColor" />
      <path
        d="M16 12.5h-3M35 12.5h-3M15 35.5h-3M36 35.5h-3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M11.5 24h3M33.5 24h3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
