/**
 * hooks.js — Shared utility hooks
 * Extracted from StudentPages.jsx and ExamEngine.jsx to eliminate duplication.
 */
import { useState, useEffect } from 'react';

export function useIsMobile(breakpoint = 768) {
  const [m, setM] = useState(() => typeof window !== 'undefined' ? window.innerWidth < breakpoint : false);
  useEffect(() => {
    const h = () => setM(window.innerWidth < breakpoint);
    window.addEventListener('resize', h, { passive: true });
    return () => window.removeEventListener('resize', h);
  }, [breakpoint]);
  return m;
}