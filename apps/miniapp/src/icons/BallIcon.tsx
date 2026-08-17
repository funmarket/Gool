import type { HoomaIconProps } from './types';
export function BallIcon({ className, size = 24, title }: HoomaIconProps) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}><title>{title}</title><circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.7"/><path d="m12 7 3.3 2.4-1.25 3.9H9.95L8.7 9.4 12 7Z" fill="currentColor"/><path d="M12 2.75 9.9 6.1 6 7.2 3.8 10.4M12 2.75l2.1 3.35L18 7.2l2.2 3.2M3.3 14.5l3.6-.2 3.05 3.2-.8 3.25M20.7 14.5l-3.6-.2-3.05 3.2.8 3.25" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
