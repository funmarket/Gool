import type { HoomaIconProps } from './types';
export function ShareIcon({ className, size = 24, title }: HoomaIconProps) {
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
      <circle cx="6" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.5" cy="6" r="2.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.5" cy="18" r="2.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="m7.9 10.9 7.7-3.9M7.9 13.1l7.7 3.9" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
