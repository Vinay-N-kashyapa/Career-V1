// components/ui/NextStepCard.tsx
// Reusable CTA card for cross-page workflow handoffs.
//
// The audit found that most pages have 0–1 incoming hrefs from elsewhere:
// features exist, but the workflows between them are broken. This component
// is the unit of cross-feature wiring. Use it at the end of any page where
// the user has finished a logical task and would benefit from being told
// what to do next.
//
// Examples:
//   • After resume upload → "Study your gaps" → /learn?topic=...
//   • After mission complete → "See your new DNA score" → /career-dna
//   • After exam pass → "View your new certificate" → /vault
//   • After saving structured resume → "See your matched opportunities" → /opportunities

'use client';
import Link from 'next/link';

export interface NextStepCardProps {
  /** Short title — the verb describing what the user does next. */
  title: string;
  /** One-line explanation of why they should do it. */
  description: string;
  /** Where to take them. */
  href: string;
  /** CTA button text. */
  ctaLabel?: string;
  /** Icon. Emoji or short string. */
  icon?: string;
  /** Visual accent color. Use a CSS var like 'var(--teal)'. */
  color?: string;
  /** Optional small caption above the title (e.g. "Recommended next") */
  eyebrow?: string;
}

export default function NextStepCard({
  title,
  description,
  href,
  ctaLabel = 'Continue →',
  icon = '✦',
  color = 'var(--accent)',
  eyebrow = 'Next step',
}: NextStepCardProps) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '16px 20px',
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${color}`,
        borderRadius: 'var(--radius-xl)',
        textDecoration: 'none',
        color: 'var(--t1)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: `${color}1a`,                  // 10% alpha overlay of the accent
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 10.5,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            color: 'var(--t3)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            marginBottom: 2,
          }}
        >
          {eyebrow}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5 }}>{description}</div>
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color,
          fontFamily: 'var(--font-mono)',
          flexShrink: 0,
        }}
      >
        {ctaLabel}
      </div>
    </Link>
  );
}
