import type { HoomaIconProps } from './types';
export function RequestFlagIcon({ className, size = 24, title }: HoomaIconProps) {
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
      <path d="M6.4 20.5V4.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M6.7 5.1h9.65l-1.85 3 1.85 3H6.7V5.1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
