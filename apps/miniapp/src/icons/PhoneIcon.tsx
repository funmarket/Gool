import type { HoomaIconProps } from './types';
export function PhoneIcon({ className, size = 24, title }: HoomaIconProps) {
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
      <path
        d="M6.6 4.3 9 8l-1.7 1.8c1.35 2.9 3.15 4.7 6.05 6.05L15.2 14l3.8 2.4c-.3 2.15-1.55 3.2-3.7 3.2-5.85 0-10.9-5.05-10.9-10.9 0-2.1 1.05-3.35 3.2-3.7Z"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinejoin="round"
      />
    </svg>
  );
}
