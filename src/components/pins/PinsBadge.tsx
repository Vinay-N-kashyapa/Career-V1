'use client';
// PinsBadge — shows current pin balance inline anywhere in the app
// Used in AppShell topbar, pricing page, and feature pages

import { useCareerOS } from '@/lib/context/CareerOSContext';
import Link from 'next/link';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  showLink?: boolean;
  className?: string;
}

export default function PinsBadge({ size = 'md', showLink = false, className }: Props) {
  const { pins } = useCareerOS();

  const low = pins < 20;
  const very_low = pins < 5;

  const sizes = {
    sm: { font: 11, pad: '2px 8px', iconSize: 11, borderRadius: 10 },
    md: { font: 12, pad: '4px 12px', iconSize: 13, borderRadius: 20 },
    lg: { font: 14, pad: '7px 16px', iconSize: 15, borderRadius: 20 },
  };
  const s = sizes[size];

  const badge = (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: s.pad,
        borderRadius: s.borderRadius,
        background: very_low
          ? 'rgba(220,38,38,0.12)'
          : low
          ? 'rgba(217,119,6,0.12)'
          : 'rgba(79,70,229,0.1)',
        border: `1px solid ${very_low ? 'rgba(220,38,38,0.25)' : low ? 'rgba(217,119,6,0.25)' : 'rgba(79,70,229,0.2)'}`,
        color: very_low ? 'var(--coral)' : low ? 'var(--amber)' : 'var(--accent)',
        fontSize: s.font,
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
        whiteSpace: 'nowrap',
        cursor: showLink ? 'pointer' : 'default',
        transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: s.iconSize }}>⚡</span>
      <span>{pins.toLocaleString()}</span>
      {size !== 'sm' && <span style={{ fontWeight: 400, opacity: 0.7 }}>📌</span>}
      {very_low && size !== 'sm' && <span style={{ fontSize: s.font - 1, marginLeft: 2 }}>⚠</span>}
    </div>
  );

  if (showLink) {
    return <Link href="/pricing" style={{ textDecoration: 'none' }}>{badge}</Link>;
  }
  return badge;
}
