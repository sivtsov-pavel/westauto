import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 26, children, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}

export function KeyMark({ size = 26, ...rest }: IconProps) {
  return (
    <Icon size={size} {...rest}>
      <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M11.6 11.6L21 21M21 21H16M21 21V16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  );
}

export function ArrowRight({ size = 15, ...rest }: IconProps) {
  return (
    <Icon size={size} {...rest}>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  );
}

export function LayersIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3l8 4-8 4-8-4 8-4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M4 11l8 4 8-4M4 15l8 4 8-4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </Icon>
  );
}

export function TruckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="10" width="11" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14 12h3l3 3v2h-6v-5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="7" cy="19" r="1.6" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="17" cy="19" r="1.6" stroke="currentColor" strokeWidth="1.4" />
    </Icon>
  );
}

export function DocIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 3h9l3 3v15H6V3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 11h6M9 15h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </Icon>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3l7 3v6c0 5-3.4 8-7 9-3.6-1-7-4-7-9V6l7-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  );
}

export function PersonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 20c1.2-4 4-6 7-6s5.8 2 7 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </Icon>
  );
}

export function LockIcon({ size = 14, ...rest }: IconProps) {
  return (
    <Icon size={size} {...rest}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 10.5V7.5a3.5 3.5 0 1 1 7 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </Icon>
  );
}
