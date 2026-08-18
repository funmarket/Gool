import type { HoomaIconProps } from './types';
export function ShieldIcon({ className, size = 24, title }: HoomaIconProps) {
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
        d="M12 3.2 18.5 5.7v5.05c0 4.25-2.35 7.25-6.5 9.45-4.15-2.2-6.5-5.2-6.5-9.45V5.7L12 3.2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="m12 8.1 1 2.05 2.25.32-1.63 1.58.39 2.23L12 13.22l-2.01 1.06.39-2.23-1.63-1.58 2.25-.32L12 8.1Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  );
}
