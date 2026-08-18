import type { HoomaIconProps } from './types';
export function RideBallIcon({ className, size = 24, title }: HoomaIconProps) {
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
        d="M4.2 13.25 5.7 9.4h12.6l1.5 3.85v4.1H4.2v-4.1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M6.25 9.4 7.4 6.5h9.2l1.15 2.9M7 17.35v2M17 17.35v2M6.7 14.2h2.2M15.1 14.2h2.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12.1" r="1.8" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}
