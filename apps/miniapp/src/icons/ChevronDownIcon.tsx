import type { HoomaIconProps } from './types';
export function ChevronDownIcon({ className, size = 24, title }: HoomaIconProps) {
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
        d="m6.5 9 5.5 5.5L17.5 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
