import type { SVGProps } from 'react';
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};
export function BallIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props} {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="m9.2 9.2 2.8-2 2.8 2-1.1 3.3h-3.4L9.2 9.2Z" />
      <path d="m12 7.2-.1-3M14.8 9.2l2.9-1.1M13.7 12.5l1.8 2.7M10.3 12.5l-1.8 2.7M9.2 9.2 6.3 8.1M6.3 8.1 4.6 10.5M17.7 8.1l1.7 2.4M15.5 15.2l-.8 3M8.5 15.2l.8 3" />
    </svg>
  );
}
export function PitchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props} {...base}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M12 4v16M3 9h4v6H3M21 9h-4v6h4" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}
export function ScarfIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props} {...base}>
      <path d="M6 4h12v9a6 6 0 0 1-12 0V4Z" />
      <path d="M6 8h12M8 18v3m3-2v2m5-3v3m-3-2v2" />
    </svg>
  );
}
export function RequestFlagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props} {...base}>
      <path d="M5 21V4m0 1h11l-2 3 2 3H5" />
      <circle cx="18" cy="17" r="3" />
      <path d="M18 15.7v1.6m0 1.2h.01" />
    </svg>
  );
}
export function RideBallIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props} {...base}>
      <path d="m4 15 1.8-5h10.4l2.2 5M3 15h17v4H3z" />
      <circle cx="7" cy="19" r="1.5" />
      <circle cx="17" cy="19" r="1.5" />
      <path d="M8 10l1.2-3h5.3l1.2 3" />
      <circle cx="19" cy="7" r="2.2" />
      <path d="m18.3 6.4.7-.5.7.5-.3.8h-.8l-.3-.8Z" />
    </svg>
  );
}
export function FundCupIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props} {...base}>
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4v2a4 4 0 0 0 4 4m9-6h3v2a4 4 0 0 1-4 4M12 13v4m-4 3h8M9 17h6" />
      <path d="M12 6v4m-2-2h4" />
    </svg>
  );
}
