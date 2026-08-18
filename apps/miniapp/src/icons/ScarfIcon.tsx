import type { HoomaIconProps } from './types';
export function ScarfIcon({ className, size = 24, title }: HoomaIconProps) {
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
        d="M7.2 4.25c1.65 1.05 3.25 1.55 4.8 1.55s3.15-.5 4.8-1.55v7.4c-1.55.85-3.15 1.28-4.8 1.28s-3.25-.43-4.8-1.28v-7.4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M7.2 10.8 4.6 19.4l3.2-.95 1.6 2.35 2.6-7.9M16.8 10.8l2.6 8.6-3.2-.95-1.6 2.35-2.6-7.9M9 8.8h6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
