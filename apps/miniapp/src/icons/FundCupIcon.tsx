import type { HoomaIconProps } from './types';
export function FundCupIcon({ className, size = 24, title }: HoomaIconProps) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role={title?'img':undefined} aria-hidden={title?undefined:true}><title>{title}</title><path d="M7.2 4.5h9.6v3.75c0 4.25-1.95 6.8-4.8 6.8s-4.8-2.55-4.8-6.8V4.5Z" stroke="currentColor" strokeWidth="1.5"/><path d="M7.15 6H4.8v1.45c0 2.15 1.05 3.45 2.8 3.85M16.85 6h2.35v1.45c0 2.15-1.05 3.45-2.8 3.85M12 15.05v3.2M8.75 20h6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
}
