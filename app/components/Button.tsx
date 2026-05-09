import Link from 'next/link';
import type { ReactNode, ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react';

// ──────────────────────────────────────────
// Offroady Shared Button Component
// Source of truth for all button variants.
// See docs/Design.md §13 for full spec.
// ──────────────────────────────────────────

export type ButtonVariant =
  | 'primary'       // Main CTA — bg green, white text
  | 'secondary'     // Outline, light bg — gray border, dark text
  | 'secondary-light' // Outline, dark/image bg — white border, white text
  | 'danger'        // Destructive — red bg, white text
  | 'ghost'         // Minimal — green text, green hover bg
  | 'link';         // Text-only — green, underlined

export type ButtonSize = 'sm' | 'md' | 'lg';

type SharedButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
  className?: string;
  children: ReactNode;
};

// ── Variant → Tailwind classes ────────────

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[#2f5d3a] text-white hover:bg-[#264d30] disabled:opacity-70',
  secondary:
    'border border-gray-300 text-gray-800 hover:bg-gray-50 disabled:opacity-70',
  'secondary-light':
    'border border-white/80 bg-[#1b2e20]/70 text-white shadow-sm hover:bg-[#1b2e20]/90 backdrop-blur-sm disabled:opacity-70',
  danger:
    'bg-[#9f2d2d] text-white hover:bg-[#862626] disabled:opacity-70',
  ghost:
    'text-[#2f5d3a] hover:bg-[#eef5ee] disabled:opacity-70',
  link:
    'text-[#2f5d3a] underline hover:text-[#264d30] disabled:opacity-70',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-sm',
};

const baseClasses =
  'inline-flex items-center justify-center rounded-lg font-semibold transition cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f5d3a] select-none';

function resolveClasses(
  variant: ButtonVariant,
  size: ButtonSize,
  loading: boolean,
  className?: string,
): string {
  const parts = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    loading ? 'pointer-events-none' : '',
    className ?? '',
  ];
  return parts.filter(Boolean).join(' ');
}

// ── Native <button> ───────────────────────

type ButtonAsButtonProps = SharedButtonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children' | 'disabled'> & {
    as?: 'button';
    href?: undefined;
  };

// ── <Link> (internal navigation) ──────────

type ButtonAsLinkProps = SharedButtonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children' | 'href'> & {
    as: 'link';
    href: string;
    target?: string;
    rel?: string;
  };

// ── Native <a> (external navigation) ──────

type ButtonAsExternalProps = SharedButtonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children' | 'href'> & {
    as: 'external';
    href: string;
    target?: string;
    rel?: string;
  };

type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps | ButtonAsExternalProps;

export default function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingLabel,
    className,
    children,
    ...rest
  } = props;

  const cls = resolveClasses(variant, size, loading, className);

  // ── Link variant (internal Next.js navigation) ──
  if (props.as === 'link') {
    const linkProps = rest as ButtonAsLinkProps;
    const { as: _omitLink, href, target, rel, ...anchorRest } = linkProps;
    void _omitLink;
    return (
      <Link
        href={href}
        className={cls}
        target={target}
        rel={target === '_blank' && !rel ? 'noopener noreferrer' : rel}
        {...anchorRest}
      >
        {children}
      </Link>
    );
  }

  // ── External link variant ──
  if (props.as === 'external') {
    const extProps = rest as ButtonAsExternalProps;
    const { as: _omitExt, href, target, rel, ...anchorRest } = extProps;
    void _omitExt;
    return (
      <a
        href={href}
        className={cls}
        target={target}
        rel={target === '_blank' && !rel ? 'noopener noreferrer' : rel}
        {...anchorRest}
      >
        {children}
      </a>
    );
  }

  // ── Native button ──
  const { as: _omitBtn, ...buttonRest } = rest as ButtonAsButtonProps;
  void _omitBtn;

  return (
    <button
      type="button"
      disabled={loading}
      className={cls}
      {...buttonRest}
    >
      {loading ? (loadingLabel ?? (typeof children === 'string' ? children : 'Loading...')) : children}
    </button>
  );
}
