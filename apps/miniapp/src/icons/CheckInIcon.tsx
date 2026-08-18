import type { HoomaIconProps } from './types';
export function CheckInIcon({ className, size = 24, title }: HoomaIconProps) {
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
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M11 7.2v4.2l2.7 1.7M14.5 18.1l1.9 1.9 4-4.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
