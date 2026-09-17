import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 24, children, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}

export function ArrowRight({ size = 16, ...rest }: IconProps) {
  return (
    <Icon size={size} {...rest}>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </Icon>
  );
}

export function GavelIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M13.5 4.5l6 6M16.5 1.5l6 6M15 6L6 15M18 9l-9 9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M2 21h9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </Icon>
  );
}

export function ShieldCheck(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3l7 3v6c0 5-3.4 8-7 9-3.6-1-7-4-7-9V6l7-3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  );
}

export function ShipIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 17l1.6-5.4a1 1 0 0 1 .96-.7h12.88a1 1 0 0 1 .96.7L21 17" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M12 10.9V5M8 5h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M2.5 19c1.6 0 1.6 1.5 3.2 1.5S7.3 19 8.9 19s1.6 1.5 3.2 1.5S13.7 19 15.3 19s1.6 1.5 3.2 1.5S20.1 19 21.7 19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </Icon>
  );
}

export function DocIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 3h9l3 3v15H6V3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9 11h6M9 15h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </Icon>
  );
}

export function PlateIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="7" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7 11h2M11 11h2M15 11h2M7 14h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </Icon>
  );
}

export function PlayIcon({ size = 22, ...rest }: IconProps) {
  return (
    <Icon size={size} {...rest}>
      <path d="M8 5.5v13l11-6.5L8 5.5Z" fill="currentColor" />
    </Icon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Icon>
  );
}

export function LockIcon({ size = 15, ...rest }: IconProps) {
  return (
    <Icon size={size} {...rest}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8.5 10.5V7.5a3.5 3.5 0 1 1 7 0v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </Icon>
  );
}

export function PhoneIcon({ size = 16, ...rest }: IconProps) {
  return (
    <Icon size={size} {...rest}>
      <path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5L16 12l4 1.5v3a2 2 0 0 1-2.2 2C10.3 17.8 6.2 13.7 4.5 5.2A2 2 0 0 1 6.5 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </Icon>
  );
}

// ─── Соцсети ────────────────────────────────────────────────────────────────

export function TelegramIcon({ size = 18, ...rest }: IconProps) {
  return (
    <Icon size={size} {...rest}>
      <path d="M21 4.5L2.8 11.3c-.9.3-.9 1.6.1 1.9l4.6 1.4 1.7 5.1c.3.8 1.3 1 1.9.4l2.5-2.4 4.5 3.3c.7.5 1.7.1 1.9-.8l3-14.2c.2-.9-.7-1.7-1.6-1.4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7.5 14.6L18 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </Icon>
  );
}

export function InstagramIcon({ size = 18, ...rest }: IconProps) {
  return (
    <Icon size={size} {...rest}>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </Icon>
  );
}

export function FacebookIcon({ size = 18, ...rest }: IconProps) {
  return (
    <Icon size={size} {...rest}>
      <path d="M14 8.5V7a1.5 1.5 0 0 1 1.5-1.5H17V3h-2.2A4 4 0 0 0 10.8 7v1.5H9V11h1.8v10H14V11h2.2l.5-2.5H14Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </Icon>
  );
}

export function TikTokIcon({ size = 18, ...rest }: IconProps) {
  return (
    <Icon size={size} {...rest}>
      <path d="M14.5 3v10.6a3.4 3.4 0 1 1-2.8-3.35" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.5 3c.4 2.4 2 4 4.5 4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  );
}

export function ViberIcon({ size = 18, ...rest }: IconProps) {
  return (
    <Icon size={size} {...rest}>
      <path d="M12 3c4.6 0 7.5 2.7 7.5 7s-2.9 7-7.5 7c-.7 0-1.4-.06-2-.18L6 19.5l.6-2.9C4.7 15.3 4.5 13.3 4.5 10c0-4.3 2.9-7 7.5-7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9.5 8c1 0 1.6 1.8 1.2 2.3-.5.5.6 2 1.2 2 .6 0 1.9-.7 2.3-.2.5.6.3 1.9-.7 1.9-3 0-5.5-2.6-5.5-5 0-.7.6-1 1.5-1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </Icon>
  );
}
