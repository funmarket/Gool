import type { HoomaIconProps } from './types';
export function SearchIcon({ className, size = 24, title }: HoomaIconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      <title>{title}</title>
      <circle cx="10.5" cy="10.5" r="6.25" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="m15.2 15.2 4.55 4.55"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
