import type { SVGProps } from 'react';

/**
 * Иконки — инлайновый stroke-SVG, наследуют currentColor.
 * Одна геометрия с макетом, никаких иконочных шрифтов и эмодзи.
 */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 17, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function KeyMark({ size = 22, ...rest }: IconProps) {
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

export function CalcIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 8h8M8 12h3M13 12h3M8 16h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </Icon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </Icon>
  );
}

export function ListIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </Icon>
  );
}

export function GearIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M19 12a7 7 0 0 0-.12-1.28l2-1.4-1.6-2.77-2.32.86a7.1 7.1 0 0 0-2.2-1.28L14.4 4h-4.8l-.36 2.13a7.1 7.1 0 0 0-2.2 1.28l-2.32-.86-1.6 2.77 2 1.4A7 7 0 0 0 5 12c0 .43.04.86.12 1.28l-2 1.4 1.6 2.77 2.32-.86c.65.55 1.4.98 2.2 1.28L9.6 20h4.8l.36-2.13c.8-.3 1.55-.73 2.2-1.28l2.32.86 1.6-2.77-2-1.4c.08-.42.12-.85.12-1.28Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </Icon>
  );
}

export function CarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 16V11l1.8-4.2A2 2 0 0 1 8.64 5.6h6.72a2 2 0 0 1 1.84 1.2L19 11v5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M5 11h14" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="15.5" r="1.4" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="16" cy="15.5" r="1.4" stroke="currentColor" strokeWidth="1.4" />
    </Icon>
  );
}

export function SearchIcon({ size = 15, ...rest }: IconProps) {
  return (
    <Icon size={size} {...rest}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </Icon>
  );
}

export function PencilIcon({ size = 12, ...rest }: IconProps) {
  return (
    <Icon size={size} {...rest}>
      <path d="M4 20l1-4.5L15.5 5 19 8.5 8.5 19 4 20Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </Icon>
  );
}

export function CopyIcon({ size = 13, ...rest }: IconProps) {
  return (
    <Icon size={size} {...rest}>
      <rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4H5.5A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </Icon>
  );
}

export function EyeIcon({ size = 13, ...rest }: IconProps) {
  return (
    <Icon size={size} {...rest}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.4" />
    </Icon>
  );
}

export function CheckIcon({ size = 13, ...rest }: IconProps) {
  return (
    <Icon size={size} {...rest}>
      <path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  );
}

export function TrashIcon({ size = 13, ...rest }: IconProps) {
  return (
    <Icon size={size} {...rest}>
      <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  );
}

export function PlusIcon({ size = 14, ...rest }: IconProps) {
  return (
    <Icon size={size} {...rest}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Icon>
  );
}

export function SunIcon({ size = 15, ...rest }: IconProps) {
  return (
    <Icon size={size} {...rest}>
      <path
        d="M12 4v1.5M12 18.5V20M4 12h1.5M18.5 12H20M6.3 6.3l1.1 1.1M16.6 16.6l1.1 1.1M6.3 17.7l1.1-1.1M16.6 7.4l1.1-1.1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.5" />
    </Icon>
  );
}

export function MoonIcon({ size = 15, ...rest }: IconProps) {
  return (
    <Icon size={size} {...rest}>
      <path
        d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </Icon>
  );
}

export function InfoIcon({ size = 16, ...rest }: IconProps) {
  return (
    <Icon size={size} {...rest}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12 11v5.5M12 7.8h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Icon>
  );
}

export function DownloadIcon({ size = 13, ...rest }: IconProps) {
  return (
    <Icon size={size} {...rest}>
      <path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  );
}

export function RefreshIcon({ size = 13, ...rest }: IconProps) {
  return (
    <Icon size={size} {...rest}>
      <path d="M20 12a8 8 0 1 1-2.3-5.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M20 4v4h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  );
}

export function UploadIcon({ size = 13, ...rest }: IconProps) {
  return (
    <Icon size={size} {...rest}>
      <path d="M12 19V8M7.5 12.5L12 8l4.5 4.5M5 5h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H5.5A1.5 1.5 0 0 1 4 15.5v-10Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M20 5.5A1.5 1.5 0 0 0 18.5 4H14a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h4.5a1.5 1.5 0 0 0 1.5-1.5v-10Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </Icon>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 19c.9-3.2 3-5 5.5-5s4.6 1.8 5.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M16 5.5a3 3 0 0 1 0 5.6M17.5 19c-.3-1.4-.8-2.6-1.5-3.5 2 .2 3.5 1.6 4.2 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </Icon>
  );
}

export function WalletIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="6" width="18" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17" cy="14.5" r="1.3" fill="currentColor" />
    </Icon>
  );
}
