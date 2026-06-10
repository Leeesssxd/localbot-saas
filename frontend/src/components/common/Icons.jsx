function IconBase({ children, className = '', title, viewBox = '0 0 24 24' }) {
  return (
    <svg
      className={className}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : 'presentation'}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function BrandMark({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="localbot-brand" x1="12" y1="10" x2="52" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#86efac" />
          <stop offset="0.5" stopColor="#22c55e" />
          <stop offset="1" stopColor="#16a34a" />
        </linearGradient>
      </defs>
      <path
        d="M18 10h28c6.627 0 12 5.373 12 12v14c0 6.627-5.373 12-12 12H30l-10 8V48c-6.627 0-12-5.373-12-12V22c0-6.627 5.373-12 12-12Z"
        fill="url(#localbot-brand)"
      />
      <rect x="20" y="20" width="24" height="16" rx="8" fill="#0f172a" />
      <circle cx="27.5" cy="28" r="2.6" fill="#6ee7b7" />
      <circle cx="36.5" cy="28" r="2.6" fill="#6ee7b7" />
      <path d="M28 42h8" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M32 10v-4" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="5" r="4.5" fill="#22c55e" opacity="0.18" />
    </svg>
  );
}

export function MenuIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </IconBase>
  );
}

export function BellIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M15 17H5c1.5-1.2 2-3 2-5V9a5 5 0 0 1 10 0v3c0 2 .5 3.8 2 5Z" />
      <path d="M9.5 19a2.5 2.5 0 0 0 5 0" />
    </IconBase>
  );
}

export function SearchIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </IconBase>
  );
}

export function PlusIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14M5 12h14" />
    </IconBase>
  );
}

export function ArrowRightIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </IconBase>
  );
}

export function ChevronRightIcon(props) {
  return (
    <IconBase {...props}>
      <path d="m9 6 6 6-6 6" />
    </IconBase>
  );
}

export function ChevronLeftIcon(props) {
  return (
    <IconBase {...props}>
      <path d="m15 6-6 6 6 6" />
    </IconBase>
  );
}

export function CalendarIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="4" y="6" width="16" height="14" rx="3" />
      <path d="M8 4v4M16 4v4M4 10h16" />
    </IconBase>
  );
}

export function MessagesIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M5 5h10a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4H9l-4 3v-3H5a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4Z" />
      <path d="M8 10h6M8 13h4" />
    </IconBase>
  );
}

export function UsersIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5H9a4.5 4.5 0 0 0-4.5 4.5V20" />
      <circle cx="10.75" cy="8" r="3" />
      <path d="M20 20v-1a3.5 3.5 0 0 0-3-3.46" />
      <path d="M16.2 5.6a3 3 0 0 1 0 4.8" />
    </IconBase>
  );
}

export function ChartIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M5 19V5" />
      <path d="M5 19h14" />
      <path d="M8 15v-4" />
      <path d="M12 15V8" />
      <path d="M16 15v-6" />
    </IconBase>
  );
}

export function GearIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="m19 12-.9-.5a7.1 7.1 0 0 0-.6-1.5l.5-.9-2-2-.9.5a7.1 7.1 0 0 0-1.5-.6L13 4h-2l-.5.9a7.1 7.1 0 0 0-1.5.6l-.9-.5-2 2 .5.9a7.1 7.1 0 0 0-.6 1.5L5 12l.9.5a7.1 7.1 0 0 0 .6 1.5l-.5.9 2 2 .9-.5a7.1 7.1 0 0 0 1.5.6L11 20h2l.5-.9a7.1 7.1 0 0 0 1.5-.6l.9.5 2-2-.5-.9a7.1 7.1 0 0 0 .6-1.5Z" />
    </IconBase>
  );
}

export function SparkIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M12 3l1.7 5.1L19 10l-5.3 1.9L12 17l-1.7-5.1L5 10l5.3-1.9L12 3Z" />
      <path d="M5 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z" />
    </IconBase>
  );
}

export function ShieldIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M12 3 5 6v6c0 4.4 2.9 8.5 7 9 4.1-.5 7-4.6 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-5" />
    </IconBase>
  );
}

export function ClockIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </IconBase>
  );
}

export function LogoutIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M10 17H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h4" />
      <path d="M14 7l5 5-5 5" />
      <path d="M19 12H9" />
    </IconBase>
  );
}

export function CopyIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="9" y="9" width="10" height="10" rx="2" />
      <path d="M7 15H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
    </IconBase>
  );
}

export function EditIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M4 20h4l10-10-4-4L4 16v4Z" />
      <path d="m13 7 4 4" />
    </IconBase>
  );
}

export function TrashIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M4 7h16" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M9 7V4h6v3" />
    </IconBase>
  );
}

export function EyeIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </IconBase>
  );
}

export function XIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </IconBase>
  );
}

export function SunIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M4.2 4.2 6 6M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8" />
    </IconBase>
  );
}

export function MoonIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
    </IconBase>
  );
}
