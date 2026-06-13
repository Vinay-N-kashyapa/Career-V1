// components/avatar/AvatarDisplay.jsx
import { useEffect, useRef } from 'react';

const CFG = {
  priya:  { skin:'#F5C5B0', hair:'#2C1208', cloth:'#f472b6', eye:'#5C2E00', blush:'rgba(244,114,182,.3)',  glow:'rgba(244,114,182,.25)', female:true  },
  aisha:  { skin:'#C8915A', hair:'#111',    cloth:'#818cf8', eye:'#2A1200', blush:'rgba(129,140,248,.25)', glow:'rgba(129,140,248,.2)',  female:true, hijab:true },
  rohan:  { skin:'#DEBA8A', hair:'#1E0E06', cloth:'#fb923c', eye:'#2A1200', blush:'rgba(251,146,60,.2)',   glow:'rgba(251,146,60,.18)', female:false },
  vikram: { skin:'#C8915A', hair:'#0a0a0a', cloth:'#34d399', eye:'#111',    blush:'rgba(52,211,153,.18)',  glow:'rgba(52,211,153,.15)', female:false },
};

export default function AvatarDisplay({ teacherId = 'priya', speaking = false, size = 200 }) {
  const c = CFG[teacherId] || CFG.priya;
  const bodyRef  = useRef(null);
  const mouthRef = useRef(null);
  const rafRef   = useRef(null);

  useEffect(() => {
    let start = null;
    const tick = (ts) => {
      if (!start) start = ts;
      const t = ts - start;
      if (bodyRef.current) {
        const y = Math.sin(t / 1300) * 5;
        bodyRef.current.style.transform = `translateY(${y}px)`;
      }
      if (mouthRef.current) {
        if (speaking) {
          const open = Math.abs(Math.sin(t / 110)) * 6;
          mouthRef.current.setAttribute('d', `M 56,96 q 8,${open} 16,0`);
        } else {
          mouthRef.current.setAttribute('d', `M 56,96 q 8,4 16,0`);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [speaking]);

  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: `radial-gradient(circle at 50% 65%, ${c.glow} 0%, transparent 65%)`,
        opacity: speaking ? 1 : 0.55,
        transition: 'opacity .4s',
        pointerEvents: 'none',
      }} />

      <svg
        ref={bodyRef}
        viewBox="0 0 128 160"
        width={size} height={size}
        style={{
          display: 'block',
          filter: speaking
            ? `drop-shadow(0 0 10px ${c.glow})`
            : `drop-shadow(0 4px 14px rgba(0,0,0,.4))`,
          transition: 'filter .35s',
        }}
      >
        {/* Body */}
        <rect x="30" y="112" width="68" height="50" rx="13" fill={c.cloth} />
        {/* Collar */}
        <path d="M64,112 l-9,13 h18 z" fill="rgba(255,255,255,.85)" />
        {/* Neck */}
        <rect x="56" y="104" width="16" height="13" rx="3" fill={c.skin} />

        {/* Head */}
        <ellipse cx="64" cy="80" rx="29" ry="31" fill={c.skin} />

        {/* Hair */}
        {c.hijab ? (
          <>
            <ellipse cx="64" cy="62" rx="33" ry="26" fill={c.cloth} opacity=".88" />
            <rect x="30" y="72" width="68" height="26" rx="7" fill={c.cloth} opacity=".88" />
          </>
        ) : c.female ? (
          <>
            <ellipse cx="64" cy="54" rx="29" ry="13" fill={c.hair} />
            <rect x="34" y="54" width="60" height="18" rx="3" fill={c.hair} />
            <ellipse cx="65" cy="48" rx="9" ry="7" fill={c.hair} />
            <ellipse cx="36" cy="79" rx="7" ry="16" fill={c.hair} />
            <ellipse cx="92" cy="79" rx="7" ry="16" fill={c.hair} />
          </>
        ) : (
          <>
            <ellipse cx="64" cy="54" rx="29" ry="12" fill={c.hair} />
            <rect x="34" y="54" width="60" height="15" rx="3" fill={c.hair} />
            <ellipse cx="36" cy="76" rx="6" ry="13" fill={c.hair} />
            <ellipse cx="92" cy="76" rx="6" ry="13" fill={c.hair} />
          </>
        )}

        {/* Ears */}
        <ellipse cx="35" cy="81" rx="5" ry="7" fill={c.skin} />
        <ellipse cx="93" cy="81" rx="5" ry="7" fill={c.skin} />

        {/* Eye whites */}
        <ellipse cx="52" cy="79" rx="6.5" ry="7" fill="#fff" />
        <ellipse cx="76" cy="79" rx="6.5" ry="7" fill="#fff" />
        {/* Irises */}
        <ellipse cx="53" cy="80" rx="4.5" ry="5.5" fill={c.eye} />
        <ellipse cx="77" cy="80" rx="4.5" ry="5.5" fill={c.eye} />
        {/* Pupils */}
        <circle cx="54" cy="80" r="1.8" fill="#fff" />
        <circle cx="78" cy="80" r="1.8" fill="#fff" />
        {/* Eyelashes */}
        <path d="M45.5,76 Q51,73 57.5,76" fill="none" stroke={c.hair} strokeWidth="1.3" strokeLinecap="round" />
        <path d="M69.5,76 Q75,73 82.5,76" fill="none" stroke={c.hair} strokeWidth="1.3" strokeLinecap="round" />
        {/* Eyebrows */}
        <path d="M45,71 Q52,68 58,71" fill="none" stroke={c.hair} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M70,71 Q76,68 83,71" fill="none" stroke={c.hair} strokeWidth="1.8" strokeLinecap="round" />

        {/* Nose */}
        <ellipse cx="64" cy="88" rx="2" ry="1.5" fill="rgba(0,0,0,.08)" />

        {/* Mouth */}
        {c.female && <ellipse cx="64" cy="95.5" rx="8" ry="3" fill={c.cloth} opacity=".28" />}
        <path ref={mouthRef} d="M 56,96 q 8,4 16,0" fill="none" stroke={c.female ? c.cloth : '#8B2020'} strokeWidth="2" strokeLinecap="round" />

        {/* Blush */}
        <ellipse cx="42" cy="89" rx="9" ry="5.5" fill={c.blush} />
        <ellipse cx="86" cy="89" rx="9" ry="5.5" fill={c.blush} />

        {/* Arms */}
        <ellipse cx="23" cy="132" rx="9" ry="22" fill={c.cloth} transform="rotate(-10 23 132)" />
        <ellipse cx="105" cy="132" rx="9" ry="22" fill={c.cloth} transform="rotate(10 105 132)" />
        {/* Hands */}
        <ellipse cx="18" cy="151" rx="7.5" ry="6" fill={c.skin} />
        <ellipse cx="110" cy="151" rx="7.5" ry="6" fill={c.skin} />

        {/* Speaking dots */}
        {speaking && [56, 64, 72].map((cx, i) => (
          <circle key={i} cx={cx} cy={168} r="2.5" fill={c.cloth} opacity=".85">
            <animate attributeName="opacity" values="0;1;0" dur=".7s" begin={`${i * .2}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </svg>
    </div>
  );
}
