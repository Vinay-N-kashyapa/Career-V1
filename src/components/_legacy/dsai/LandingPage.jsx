import React, { useState, useEffect, useRef } from 'react';
import dsaiLogo from '../assets/dsaiLogo.js';

/* ─────────────────────────────────────────────
   GLOBAL STYLES — injected once, cleaned on unmount
───────────────────────────────────────────── */
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .lp-root {
    min-height: 100vh;
    font-family: 'Sora', sans-serif;
    color: #0f172a;
    overflow-x: hidden;
    background: #f8faff;
  }

  .lp-root::-webkit-scrollbar { width: 5px; }
  .lp-root::-webkit-scrollbar-track { background: #e8f0fe; }
  .lp-root::-webkit-scrollbar-thumb { background: rgba(37,99,235,0.35); border-radius: 4px; }

  /* ── NAV ── */
  .lp-nav {
    position: sticky; top: 0; z-index: 500;
    height: 72px; padding: 0 48px;
    display: flex; align-items: center; justify-content: space-between;
    transition: all 0.4s cubic-bezier(0.4,0,0.2,1);
  }
  .lp-nav.scrolled {
    background: rgba(248,250,255,0.96);
    backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
    border-bottom: 1px solid rgba(37,99,235,0.1);
    box-shadow: 0 4px 32px rgba(37,99,235,0.06);
    height: 64px;
  }
  .lp-nav-brand { display:flex; align-items:center; gap:12px; cursor:pointer; }
  .lp-nav-brand-img-wrap { position:relative; }
  .lp-nav-brand-img { width:44px; height:44px; border-radius:50%; object-fit:cover; border:2px solid rgba(37,99,235,0.25); display:block; box-shadow:0 0 0 4px rgba(37,99,235,0.07); }
  .lp-nav-brand-dot { position:absolute; bottom:2px; right:2px; width:10px; height:10px; background:#10b981; border-radius:50%; border:2px solid white; box-shadow:0 0 0 2px rgba(16,185,129,0.25); animation:lp-pulse-dot 2.5s ease-in-out infinite; }
  .lp-nav-brand-text { line-height:1; }
  .lp-nav-brand-name { font-size:14px; font-weight:800; color:#060e1e; letter-spacing:-0.3px; display:block; }
  .lp-nav-brand-sub  { font-size:10px; font-weight:700; color:#2563eb; text-transform:uppercase; letter-spacing:1.2px; display:block; margin-top:2px; }

  .lp-nav-tabs { display:flex; gap:2px; background:rgba(37,99,235,0.06); border:1px solid rgba(37,99,235,0.12); border-radius:14px; padding:5px; }
  .lp-nav-tab  { padding:8px 22px; border-radius:10px; border:none; background:transparent; color:#64748b; font:600 13px/1 'Sora',sans-serif; cursor:pointer; transition:all 0.2s; }
  .lp-nav-tab:hover { color:#2563eb; }
  .lp-nav-tab.active { background:#fff; color:#2563eb; box-shadow:0 2px 12px rgba(37,99,235,0.15); }

  .lp-nav-signin { padding:10px 22px; border-radius:11px; border:none; background:#2563eb; color:#fff; font:700 13px/1 'Sora',sans-serif; cursor:pointer; box-shadow:0 4px 16px rgba(37,99,235,0.35); transition:all 0.2s; display:flex; align-items:center; gap:6px; }
  .lp-nav-signin:hover { background:#1d4ed8; transform:translateY(-1px); box-shadow:0 8px 24px rgba(37,99,235,0.45); }

  /* ── HERO ── */
  .lp-hero { position:relative; overflow:hidden; min-height:calc(100vh - 72px); display:flex; align-items:center; justify-content:center; padding:80px 48px 100px; }
  .lp-hero-bg {
    position:absolute; inset:0; z-index:0;
    background:
      radial-gradient(ellipse 80% 60% at 50% -10%, rgba(37,99,235,0.12) 0%, transparent 60%),
      radial-gradient(ellipse 50% 40% at 85% 70%, rgba(124,58,237,0.07) 0%, transparent 55%),
      radial-gradient(ellipse 40% 30% at 10% 80%, rgba(5,150,105,0.05) 0%, transparent 50%),
      #f8faff;
  }
  .lp-hero-grid {
    position:absolute; inset:0; z-index:0;
    background-image: linear-gradient(rgba(37,99,235,0.04) 1px,transparent 1px), linear-gradient(90deg,rgba(37,99,235,0.04) 1px,transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 80%);
    -webkit-mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 80%);
  }
  .lp-hero-inner { position:relative; z-index:1; max-width:800px; text-align:center; animation:lp-fade-up 0.8s cubic-bezier(0.22,1,0.36,1) both; }

  .lp-hero-eyebrow { display:inline-flex; align-items:center; gap:8px; background:rgba(5,150,105,0.08); border:1px solid rgba(5,150,105,0.25); border-radius:40px; padding:8px 20px; font:700 12px/1 'Sora',sans-serif; color:#059669; margin-bottom:32px; letter-spacing:0.2px; }
  .lp-hero-eyebrow-dot { width:7px; height:7px; border-radius:50%; background:#10b981; animation:lp-pulse-dot 2s ease-in-out infinite; }

  .lp-hero-h1 { font-size:clamp(42px,6.5vw,72px); font-weight:900; line-height:1.03; letter-spacing:-3px; color:#060e1e; margin-bottom:28px; }
  .lp-hero-h1 .grad { background:linear-gradient(135deg,#2563eb 0%,#7c3aed 55%,#db2777 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  .lp-hero-sub { font-size:18px; color:#475569; line-height:1.8; max-width:540px; margin:0 auto 48px; font-weight:400; }

  .lp-hero-btns { display:flex; gap:14px; justify-content:center; flex-wrap:wrap; margin-bottom:64px; }
  .lp-btn-primary { padding:16px 38px; border-radius:14px; border:none; background:linear-gradient(135deg,#1d4ed8,#2563eb,#4f46e5); color:#fff; font:700 15px/1 'Sora',sans-serif; cursor:pointer; letter-spacing:-0.2px; box-shadow:0 8px 32px rgba(37,99,235,0.4),inset 0 1px 0 rgba(255,255,255,0.15); transition:all 0.25s; display:flex; align-items:center; gap:8px; }
  .lp-btn-primary:hover { transform:translateY(-3px); box-shadow:0 16px 48px rgba(37,99,235,0.5),inset 0 1px 0 rgba(255,255,255,0.15); }
  .lp-btn-ghost { padding:16px 38px; border-radius:14px; border:1.5px solid rgba(37,99,235,0.22); background:rgba(255,255,255,0.75); color:#2563eb; font:700 15px/1 'Sora',sans-serif; cursor:pointer; backdrop-filter:blur(12px); transition:all 0.25s; display:flex; align-items:center; gap:8px; }
  .lp-btn-ghost:hover { background:rgba(37,99,235,0.06); border-color:rgba(37,99,235,0.4); transform:translateY(-2px); }

  /* Stats strip */
  .lp-stats { display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.85); border:1px solid rgba(37,99,235,0.12); border-radius:20px; padding:24px 32px; backdrop-filter:blur(16px); box-shadow:0 4px 32px rgba(37,99,235,0.06); }
  .lp-stat  { display:flex; flex-direction:column; align-items:center; padding:0 32px; }
  .lp-stat + .lp-stat { border-left:1px solid rgba(37,99,235,0.1); }
  .lp-stat-val   { font-size:26px; font-weight:900; letter-spacing:-1px; line-height:1; }
  .lp-stat-label { font-size:11px; font-weight:600; color:#94a3b8; text-transform:uppercase; letter-spacing:0.8px; margin-top:6px; }

  /* ── PORTALS SECTION (home) ── */
  .lp-portals-wrap { background:#fff; border-top:1px solid rgba(37,99,235,0.08); padding:100px 48px; }
  .lp-wrap-inner   { max-width:1080px; margin:0 auto; }
  .lp-section-row  { display:flex; justify-content:space-between; align-items:flex-end; gap:24px; flex-wrap:wrap; margin-bottom:52px; }
  .lp-section-eyebrow { font:700 11px/1 'Sora',sans-serif; text-transform:uppercase; letter-spacing:1.6px; color:#2563eb; margin-bottom:12px; display:block; }
  .lp-section-h { font-size:clamp(26px,3.5vw,40px); font-weight:900; letter-spacing:-1.5px; color:#060e1e; margin-bottom:12px; line-height:1.08; }
  .lp-section-p { font-size:15px; color:#64748b; line-height:1.8; max-width:480px; }
  .lp-view-btn { padding:11px 24px; border-radius:11px; border:1.5px solid rgba(37,99,235,0.2); background:transparent; color:#2563eb; font:700 13px/1 'Sora',sans-serif; cursor:pointer; transition:all 0.2s; white-space:nowrap; }
  .lp-view-btn:hover { background:rgba(37,99,235,0.06); }

  .lp-portal-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
  .lp-portal-card { position:relative; border-radius:24px; overflow:hidden; border:1.5px solid rgba(37,99,235,0.1); background:#fff; cursor:pointer; transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.3s,border-color 0.3s; display:flex; flex-direction:column; }
  .lp-portal-card:hover { transform:translateY(-8px); }
  .lp-portal-card-top { height:4px; width:100%; }
  .lp-portal-card-body { padding:32px 28px 28px; flex:1; display:flex; flex-direction:column; }
  .lp-portal-icon  { width:60px; height:60px; border-radius:18px; display:flex; align-items:center; justify-content:center; font-size:28px; margin-bottom:22px; border:1.5px solid; }
  .lp-portal-badge { display:inline-flex; align-items:center; font:700 10px/1 'Sora',sans-serif; text-transform:uppercase; letter-spacing:0.8px; padding:4px 10px; border-radius:20px; margin-bottom:12px; }
  .lp-portal-name  { font-size:20px; font-weight:800; margin-bottom:6px; letter-spacing:-0.5px; }
  .lp-portal-sub   { font-size:13px; color:#94a3b8; font-weight:500; line-height:1.6; margin-bottom:24px; }
  .lp-portal-feats { display:flex; flex-direction:column; gap:10px; flex:1; }
  .lp-portal-feat  { display:flex; align-items:center; gap:10px; font:500 13px/1.4 'Sora',sans-serif; color:#334155; }
  .lp-portal-feat-dot { width:20px; height:20px; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:800; flex-shrink:0; }
  .lp-portal-footer { display:flex; align-items:center; justify-content:space-between; margin-top:28px; padding-top:22px; border-top:1px solid rgba(37,99,235,0.07); }
  .lp-portal-enter-lbl { font:700 13px/1 'Sora',sans-serif; }
  .lp-portal-enter-arr { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:16px; transition:transform 0.2s; }
  .lp-portal-card:hover .lp-portal-enter-arr { transform:translateX(4px); }

  /* ── FEATURES SECTION (home preview) ── */
  .lp-features-wrap { background:#f8faff; border-top:1px solid rgba(37,99,235,0.07); padding:100px 48px; }
  .lp-feat-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
  .lp-feat-card { background:#fff; border:1.5px solid rgba(37,99,235,0.08); border-radius:18px; padding:26px 24px; transition:border-color 0.2s,box-shadow 0.2s,transform 0.5s,opacity 0.5s; opacity:0; transform:translateY(24px); }
  .lp-feat-card.visible { opacity:1; transform:translateY(0); }
  .lp-feat-card:hover { transform:translateY(-4px) !important; }
  .lp-feat-icon  { width:48px; height:48px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:22px; margin-bottom:18px; }
  .lp-feat-title { font:700 14px/1.2 'Sora',sans-serif; margin-bottom:9px; }
  .lp-feat-desc  { font-size:12.5px; color:#64748b; line-height:1.75; }

  /* Security band */
  .lp-sec-band::before { content:''; position:absolute; top:-80px; right:-80px; width:260px; height:260px; border-radius:50%; background:radial-gradient(circle,rgba(37,99,235,0.18) 0%,transparent 65%); pointer-events:none; }

  /* ── CTA BAND ── */
  .lp-cta-wrap { background:linear-gradient(135deg,#060e1e,#0c1d38,#131f35); padding:100px 48px; position:relative; overflow:hidden; }
  .lp-cta-wrap::before { content:''; position:absolute; top:-120px; left:50%; transform:translateX(-50%); width:700px; height:400px; border-radius:50%; background:radial-gradient(ellipse,rgba(37,99,235,0.15) 0%,transparent 65%); pointer-events:none; }
  .lp-cta-inner  { max-width:1080px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; gap:48px; flex-wrap:wrap; position:relative; z-index:1; }
  .lp-cta-tag    { font:700 11px/1 'Sora',sans-serif; text-transform:uppercase; letter-spacing:1.6px; color:#60a5fa; margin-bottom:16px; display:block; }
  .lp-cta-h      { font-size:clamp(24px,3vw,36px); font-weight:900; color:#fff; letter-spacing:-1px; margin-bottom:14px; line-height:1.1; }
  .lp-cta-p      { font-size:14px; color:#94a3b8; line-height:1.8; max-width:440px; }
  .lp-cta-btns   { display:flex; gap:12px; flex-wrap:wrap; }
  .lp-cta-btn    { padding:14px 28px; border-radius:12px; font:700 13px/1 'Sora',sans-serif; cursor:pointer; transition:all 0.22s; border:none; display:flex; align-items:center; gap:7px; }

  /* ── PAGE TABS ── */
  .lp-page { background:#f8faff; min-height:calc(100vh - 72px); padding:80px 48px; }
  .lp-page-inner  { max-width:1080px; margin:0 auto; }
  .lp-page-header { text-align:center; margin-bottom:60px; }
  .lp-page-eyebrow { display:inline-block; font:700 11px/1 'Sora',sans-serif; text-transform:uppercase; letter-spacing:1.6px; color:#94a3b8; background:rgba(37,99,235,0.06); border:1px solid rgba(37,99,235,0.14); border-radius:40px; padding:7px 18px; margin-bottom:18px; }
  .lp-page-h { font-size:clamp(28px,4vw,44px); font-weight:900; letter-spacing:-1.5px; color:#060e1e; margin-bottom:14px; line-height:1.06; }
  .lp-page-p { font-size:15px; color:#64748b; line-height:1.8; max-width:480px; margin:0 auto; }

  /* Portal rows */
  .lp-portal-row:hover { transform:translateX(4px); }
  .lp-portal-row-btn:hover { transform:translateY(-2px); filter:brightness(1.07); }

  /* About */

  /* Footer */
  .lp-footer { background:#fff; border-top:1px solid rgba(37,99,235,0.08); padding:28px 48px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:14px; }
  .lp-footer-nav { display:flex; gap:4px; }
  .lp-footer-navbtn { padding:6px 14px; border-radius:8px; border:none; font:500 12px/1 'Sora',sans-serif; cursor:pointer; transition:all 0.15s; background:none; color:#94a3b8; }
  .lp-footer-navbtn:hover { color:#2563eb; }
  .lp-footer-navbtn.active { background:rgba(37,99,235,0.07); color:#2563eb; font-weight:700; }


  /* ══════════════════════════════════
     PORTALS TAB — redesigned
  ══════════════════════════════════ */
  .lp-pt-wrap {
    background: #f8faff;
    min-height: calc(100vh - 72px);
    padding: 72px 48px 100px;
  }
  .lp-pt-inner { max-width: 1080px; margin: 0 auto; }

  /* Big hero-style header */
  .lp-pt-header {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    align-items: center;
    margin-bottom: 72px;
    padding-bottom: 64px;
    border-bottom: 1px solid rgba(37,99,235,0.08);
  }
  .lp-pt-header-left {}
  .lp-pt-header-right {
    display: flex; flex-direction: column; gap: 12px;
  }
  .lp-pt-stat-pill {
    display: flex; align-items: center; gap: 14px;
    background: #fff; border: 1px solid rgba(37,99,235,0.1);
    border-radius: 14px; padding: 16px 20px;
    transition: border-color 0.2s, transform 0.2s;
  }
  .lp-pt-stat-pill:hover { border-color: rgba(37,99,235,0.3); transform: translateX(4px); }
  .lp-pt-stat-pill-icon {
    width: 40px; height: 40px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; flex-shrink: 0;
  }
  .lp-pt-stat-pill-val { font-size: 18px; font-weight: 800; color: #060e1e; letter-spacing: -0.5px; line-height: 1; }
  .lp-pt-stat-pill-label { font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; margin-top: 3px; }

  /* Portal cards — full redesign */
  .lp-pt-cards { display: flex; flex-direction: column; gap: 0; border-radius: 24px; overflow: hidden; border: 1px solid rgba(37,99,235,0.1); background: #fff; box-shadow: 0 8px 48px rgba(37,99,235,0.06); }
  .lp-pt-card {
    display: grid;
    grid-template-columns: 72px 1fr auto;
    align-items: center;
    gap: 0;
    border-bottom: 1px solid rgba(37,99,235,0.07);
    transition: background 0.2s;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }
  .lp-pt-card:last-child { border-bottom: none; }
  .lp-pt-card::before {
    content: '';
    position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
    background: var(--card-color, #2563eb);
    opacity: 0; transition: opacity 0.2s;
  }
  .lp-pt-card:hover { background: #f8faff; }
  .lp-pt-card:hover::before { opacity: 1; }

  .lp-pt-card-num {
    display: flex; align-items: center; justify-content: center;
    height: 100%; padding: 32px 0;
    font-size: 11px; font-weight: 800; color: #cbd5e1;
    letter-spacing: 1px; font-family: 'JetBrains Mono', monospace;
    border-right: 1px solid rgba(37,99,235,0.07);
    flex-shrink: 0;
  }
  .lp-pt-card-body { padding: 32px 36px; }
  .lp-pt-card-top  { display: flex; align-items: center; gap: 14px; margin-bottom: 10px; }
  .lp-pt-card-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; border: 1.5px solid; }
  .lp-pt-card-title { font-size: 18px; font-weight: 800; letter-spacing: -0.4px; }
  .lp-pt-card-badge { font: 700 10px/1 'Sora',sans-serif; text-transform: uppercase; letter-spacing: 0.7px; padding: 4px 10px; border-radius: 20px; }
  .lp-pt-card-desc  { font-size: 13px; color: #64748b; line-height: 1.7; margin-bottom: 18px; max-width: 560px; }
  .lp-pt-card-feats { display: flex; flex-wrap: wrap; gap: 8px; }
  .lp-pt-card-feat  { font-size: 11.5px; color: #475569; background: #f1f5f9; border-radius: 6px; padding: 5px 10px; font-weight: 500; display: flex; align-items: center; gap: 5px; }
  .lp-pt-card-action { padding: 32px 36px; flex-shrink: 0; border-left: 1px solid rgba(37,99,235,0.07); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; min-width: 160px; }
  .lp-pt-card-action-btn { width: 100%; padding: 12px 20px; border-radius: 12px; border: none; color: #fff; font: 700 13px/1 'Sora',sans-serif; cursor: pointer; transition: all 0.2s; text-align: center; }
  .lp-pt-card-action-btn:hover { transform: translateY(-2px); filter: brightness(1.08); }
  .lp-pt-card-action-hint { font-size: 11px; color: #94a3b8; font-weight: 500; text-align: center; }

  /* ══════════════════════════════════
     ABOUT TAB — redesigned
  ══════════════════════════════════ */
  .lp-ab-wrap {
    background: #f8faff;
    min-height: calc(100vh - 72px);
    padding: 72px 48px 100px;
  }
  .lp-ab-inner { max-width: 1080px; margin: 0 auto; }

  /* Split hero */
  .lp-ab-hero {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    align-items: center;
    margin-bottom: 64px;
    padding: 56px;
    background: #fff;
    border-radius: 28px;
    border: 1px solid rgba(37,99,235,0.1);
    box-shadow: 0 8px 48px rgba(37,99,235,0.05);
    position: relative;
    overflow: hidden;
  }
  .lp-ab-hero::before {
    content: '';
    position: absolute; top: -80px; right: -80px;
    width: 320px; height: 320px; border-radius: 50%;
    background: radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 65%);
    pointer-events: none;
  }
  .lp-ab-hero-text { position: relative; z-index: 1; }
  .lp-ab-hero-visual {
    position: relative; z-index: 1;
    display: flex; flex-direction: column; gap: 12px;
  }

  /* Timeline */
  .lp-ab-timeline { position: relative; margin-bottom: 64px; }
  .lp-ab-timeline-line {
    position: absolute; left: 23px; top: 0; bottom: 0; width: 1px;
    background: linear-gradient(to bottom, rgba(37,99,235,0.15), rgba(37,99,235,0.05));
  }
  .lp-ab-tl-item {
    display: flex; gap: 24px; margin-bottom: 40px;
    animation: lp-fade-up 0.5s ease both;
  }
  .lp-ab-tl-dot {
    width: 46px; height: 46px; border-radius: 14px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; position: relative; z-index: 1;
    background: #fff; border: 1.5px solid rgba(37,99,235,0.15);
    box-shadow: 0 2px 12px rgba(37,99,235,0.08);
  }
  .lp-ab-tl-content { padding-top: 8px; }
  .lp-ab-tl-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .lp-ab-tl-title { font-size: 16px; font-weight: 800; color: #060e1e; letter-spacing: -0.3px; margin-bottom: 6px; }
  .lp-ab-tl-desc  { font-size: 13px; color: #64748b; line-height: 1.75; max-width: 560px; }

  /* Values grid */
  .lp-ab-values { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 64px; }
  .lp-ab-val-card {
    background: #fff; border: 1.5px solid rgba(37,99,235,0.09);
    border-radius: 20px; padding: 28px 24px;
    transition: border-color 0.25s, transform 0.25s, box-shadow 0.25s;
  }
  .lp-ab-val-card:hover { border-color: rgba(37,99,235,0.25); transform: translateY(-4px); box-shadow: 0 12px 40px rgba(37,99,235,0.08); }
  .lp-ab-val-icon { width: 52px; height: 52px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 18px; }
  .lp-ab-val-title { font-size: 15px; font-weight: 800; color: #060e1e; margin-bottom: 8px; letter-spacing: -0.3px; }
  .lp-ab-val-desc  { font-size: 12.5px; color: #64748b; line-height: 1.75; }

  /* Tech stack band */
  .lp-ab-stack {
    background: linear-gradient(135deg, #060e1e, #0d1f3a);
    border-radius: 24px; padding: 48px;
    display: grid; grid-template-columns: 1fr auto;
    gap: 48px; align-items: center;
    border: 1px solid rgba(37,99,235,0.2);
    margin-bottom: 24px;
    position: relative; overflow: hidden;
  }
  .lp-ab-stack::before {
    content: ''; position: absolute; top: -60px; right: -60px;
    width: 240px; height: 240px; border-radius: 50%;
    background: radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 65%);
    pointer-events: none;
  }
  .lp-ab-stack-chips { display: flex; flex-wrap: wrap; gap: 10px; }
  .lp-ab-stack-chip {
    font: 600 12px/1 'JetBrains Mono', monospace;
    color: #93c5fd; background: rgba(37,99,235,0.12);
    border: 1px solid rgba(37,99,235,0.25);
    border-radius: 8px; padding: 9px 14px;
    letter-spacing: 0.3px;
    transition: background 0.2s, color 0.2s;
  }
  .lp-ab-stack-chip:hover { background: rgba(37,99,235,0.22); color: #bfdbfe; }

  /* CTA */
  .lp-ab-cta {
    background: linear-gradient(135deg, #1d4ed8, #2563eb, #4f46e5);
    border-radius: 24px; padding: 52px 48px;
    display: flex; align-items: center; justify-content: space-between;
    gap: 32px; flex-wrap: wrap;
    position: relative; overflow: hidden;
    box-shadow: 0 16px 64px rgba(37,99,235,0.25);
  }
  .lp-ab-cta::before {
    content: ''; position: absolute; top: -100px; right: -100px;
    width: 360px; height: 360px; border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,0.09) 0%, transparent 65%);
    pointer-events: none;
  }
  .lp-ab-cta-title { font-size: 24px; font-weight: 900; color: #fff; letter-spacing: -0.8px; margin-bottom: 8px; }
  .lp-ab-cta-sub   { font-size: 14px; color: rgba(255,255,255,0.7); line-height: 1.7; max-width: 380px; }
  .lp-ab-cta-btns  { display: flex; gap: 10px; flex-wrap: wrap; flex-shrink: 0; }
  .lp-ab-cta-btn {
    padding: 13px 24px; border-radius: 12px; font: 700 13px/1 'Sora',sans-serif;
    cursor: pointer; transition: all 0.2s; border: 1.5px solid rgba(255,255,255,0.25);
    background: rgba(255,255,255,0.12); color: #fff; backdrop-filter: blur(8px);
  }
  .lp-ab-cta-btn:hover { background: rgba(255,255,255,0.22); transform: translateY(-2px); }

  /* Responsive — portals + about */
  @media (max-width: 900px) {
    .lp-pt-wrap, .lp-ab-wrap { padding: 48px 20px 80px; }
    .lp-pt-header { grid-template-columns: 1fr; gap: 32px; margin-bottom: 48px; padding-bottom: 40px; }
    .lp-pt-card   { grid-template-columns: 56px 1fr; }
    .lp-pt-card-action { display: none; }
    .lp-pt-card-body { padding: 24px 20px; }
    .lp-ab-hero { grid-template-columns: 1fr; padding: 36px 28px; }
    .lp-ab-values { grid-template-columns: 1fr; }
    .lp-ab-stack  { grid-template-columns: 1fr; gap: 28px; padding: 32px 28px; }
    .lp-ab-cta    { padding: 36px 28px; flex-direction: column; }
    .lp-ab-timeline-line { left: 22px; }
  }
  @media (max-width: 600px) {
    .lp-pt-card-feats { display: none; }
    .lp-ab-values { grid-template-columns: 1fr; }
  }

  /* Animations */
  @keyframes lp-fade-up { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
  @keyframes lp-pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.55;transform:scale(0.85)} }

  /* Responsive */
  @media (max-width:900px){
    .lp-nav { padding:0 20px; }
    .lp-nav-tabs { display:none; }
    .lp-hero { padding:60px 20px 80px; }
    .lp-portals-wrap,.lp-features-wrap,.lp-cta-wrap { padding:70px 20px; }
    .lp-portal-grid { grid-template-columns:1fr; }
    .lp-feat-grid { grid-template-columns:repeat(2,1fr); }
    .lp-page { padding:60px 20px; }
    .lp-portal-row { flex-direction:column; align-items:flex-start; padding:24px; }
    .lp-portal-row:hover { transform:none; }
    .lp-portal-row-btn { width:100%; justify-content:center; }
    .lp-about-grid { grid-template-columns:1fr; }
    .lp-about-main { grid-row:auto; }
    .lp-footer { padding:20px; }
  }
  @media (max-width:600px){
    .lp-hero-h1 { letter-spacing:-2px; }
    .lp-feat-grid { grid-template-columns:1fr; }
    .lp-stats { flex-direction:column; gap:20px; }
    .lp-stat + .lp-stat { border-left:none; border-top:1px solid rgba(37,99,235,0.1); padding-top:20px; }
    .lp-sec-band { flex-direction:column; padding:28px 20px; }
  }
`;

/* ─── Portal data ─── */
const PORTALS = [
  {
    key: 'student',
    icon: '🎓', label: 'Student Portal', badge: 'Most Active',
    sub: 'Your complete academic hub for exams, results and learning resources',
    color: '#2563eb', bg: '#eff6ff', borderColor: 'rgba(37,99,235,0.2)',
    grad: 'linear-gradient(135deg,#1d4ed8,#2563eb,#3b82f6)',
    badgeBg: 'rgba(37,99,235,0.09)', badgeColor: '#2563eb',
    feats: ['Take live & scheduled exams', 'View results after release', 'Download semester notes', 'Receive batch notifications', 'Message admin directly'],
    action: 'onStudentLogin',
  },
  {
    key: 'teacher',
    icon: '👨‍🏫', label: 'Teacher Portal', badge: 'Instructor',
    sub: 'Grade submissions, analyse class performance and export results',
    color: '#059669', bg: '#f0fdf4', borderColor: 'rgba(5,150,105,0.2)',
    grad: 'linear-gradient(135deg,#047857,#059669,#10b981)',
    badgeBg: 'rgba(5,150,105,0.09)', badgeColor: '#059669',
    feats: ['Grade essay & coding work', 'Class analytics & charts', 'Export results to Excel', 'Track student performance'],
    action: 'onTeacherLogin',
  },
  {
    key: 'admin',
    icon: '⚙️', label: 'Admin Portal', badge: 'Admin Only',
    sub: 'Full platform control — students, exams, results and announcements',
    color: '#7c3aed', bg: '#faf5ff', borderColor: 'rgba(124,58,237,0.2)',
    grad: 'linear-gradient(135deg,#6d28d9,#7c3aed,#a855f7)',
    badgeBg: 'rgba(124,58,237,0.09)', badgeColor: '#7c3aed',
    feats: ['Manage students & teachers', 'Create question papers', 'Upload study notes', 'Control result visibility', 'Send notifications'],
    action: 'onAdminLogin',
  },
];

const FEATURES = [
  { icon:'🔒', title:'Tab-Lock Security',     desc:'Every tab switch during a live exam is detected, logged and reported — keeping assessments fair and monitored in real time.', color:'#dc2626', bg:'#fef2f2' },
  { icon:'💻', title:'Coding Sandbox',         desc:'LeetCode-style editor with test cases. Students write, run and validate JavaScript directly inside the browser.',             color:'#2563eb', bg:'#eff6ff' },
  { icon:'⏱️', title:'Auto-Submit Timer',      desc:'Countdown timer auto-submits the paper on expiry. No missed deadlines, no manual monitoring required.',                      color:'#d97706', bg:'#fffbeb' },
  { icon:'📊', title:'Live Analytics',         desc:'Score distributions, batch-level comparisons and performance trends updated immediately after every submission.',              color:'#059669', bg:'#f0fdf4' },
  { icon:'📋', title:'6 Question Types',       desc:'MCQ, Multi-select, True/False, Fill-in-blank, Essay and Coding — all combined in a single configurable paper.',             color:'#7c3aed', bg:'#faf5ff' },
  { icon:'📚', title:'Study Notes Hub',        desc:'Upload PDFs and slides per batch and semester. Students download materials instantly with a single click.',                   color:'#0891b2', bg:'#ecfeff' },
  { icon:'🔐', title:'Result Visibility Gate', desc:'Admin holds the release toggle. Students see absolutely nothing until results are explicitly made live.',                     color:'#be185d', bg:'#fdf2f8' },
  { icon:'📤', title:'Excel Import & Export',  desc:'Bulk-import students and questions from spreadsheets. Export full class results to Excel with one click.',                    color:'#065f46', bg:'#ecfdf5' },
  { icon:'🔔', title:'Smart Notifications',    desc:'Send targeted announcements to specific batches or the whole institute. Delivered instantly to every dashboard.',              color:'#92400e', bg:'#fffbeb' },
];

/* ─── Scroll-reveal feature card ─── */
function FeatCard({ icon, title, desc, color, bg, delay }) {
  const ref = useRef();
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('visible'); obs.disconnect(); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className="lp-feat-card" style={{ transitionDelay: `${delay}ms` }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color+'44'; e.currentTarget.style.boxShadow = `0 10px 40px ${color}14`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div className="lp-feat-icon" style={{ background: bg }}>{icon}</div>
      <div className="lp-feat-title" style={{ color }}>{title}</div>
      <div className="lp-feat-desc">{desc}</div>
    </div>
  );
}

/* ─── Small reusable view-all button ─── */
function ViewBtn({ label, onClick }) {
  return (
    <button className="lp-view-btn" onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >{label}</button>
  );
}

/* ══════════════════════════════════════════
   MAIN
══════════════════════════════════════════ */
export default function LandingPage({ onStudentLogin, onAdminLogin, onTeacherLogin }) {
  const [tab,      setTab]      = useState('home');
  const [scrolled, setScrolled] = useState(false);
  const rootRef = useRef();

  const actions = { onStudentLogin, onTeacherLogin, onAdminLogin };

  /* Inject CSS once — clean up on unmount (I3 fix) */
  useEffect(() => {
    const id = 'lp-global-css';
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id; s.textContent = GLOBAL_CSS;
    document.head.appendChild(s);
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  useEffect(() => {
    const el = rootRef.current; if (!el) return;
    const fn = () => setScrolled(el.scrollTop > 56);
    el.addEventListener('scroll', fn, { passive: true });
    return () => el.removeEventListener('scroll', fn);
  }, []);

  const NAV_TABS = [
    { id: 'home',     label: 'Home'     },
    { id: 'portals',  label: 'Portals'  },
    { id: 'features', label: 'Features' },
    { id: 'about',    label: 'About'    },
  ];

  /* CTA login buttons (reused in multiple places) */
  const LoginButtons = () => (
    <div className="lp-cta-btns">
      {[
        { label: '🎓 Student',  action: onStudentLogin, color: '#2563eb', shadow: 'rgba(37,99,235,0.4)'  },
        { label: '👨‍🏫 Teacher',  action: onTeacherLogin, color: '#059669', shadow: 'rgba(5,150,105,0.4)'  },
        { label: '⚙️ Admin',    action: onAdminLogin,   color: '#7c3aed', shadow: 'rgba(124,58,237,0.4)' },
      ].map(b => (
        <button key={b.label} className="lp-cta-btn"
          onClick={b.action}
          style={{ background: b.color, color: '#fff', boxShadow: `0 6px 24px ${b.shadow}` }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.filter='brightness(1.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.filter='none'; }}
        >{b.label}</button>
      ))}
    </div>
  );

  return (
    <div ref={rootRef} className="lp-root" style={{ overflowY: 'auto', maxHeight: '100vh' }}>

      {/* ════ NAV ════ */}
      <nav className={`lp-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="lp-nav-brand" onClick={() => setTab('home')}>
          <div className="lp-nav-brand-img-wrap">
            <img src={dsaiLogo} alt="DSAI" className="lp-nav-brand-img" />
            <span className="lp-nav-brand-dot" />
          </div>
          <div className="lp-nav-brand-text">
            <span className="lp-nav-brand-name">BGS Institute</span>
            <span className="lp-nav-brand-sub">DSAI · Exam Portal</span>
          </div>
        </div>

        <div className="lp-nav-tabs">
          {NAV_TABS.map(t => (
            <button key={t.id} className={`lp-nav-tab${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>

        <button className="lp-nav-signin" onClick={onStudentLogin}>
          Sign In <span style={{ fontSize: 14 }}>→</span>
        </button>
      </nav>

      {/* ════ HOME ════ */}
      {tab === 'home' && (<>

        {/* Hero */}
        <section className="lp-hero">
          <div className="lp-hero-bg" />
          <div className="lp-hero-grid" />
          <div className="lp-hero-inner">
            <div className="lp-hero-eyebrow">
              <span className="lp-hero-eyebrow-dot" />
              Portal Active · Academic Year 2025–26
            </div>
            <h1 className="lp-hero-h1">
              BGS Institute of<br />
              <span className="grad">Management</span>
            </h1>
            <p className="lp-hero-sub">
              A unified digital platform for students, teachers and administrators —
              powering examinations, analytics and learning at DSAI.
            </p>
            <div className="lp-hero-btns">
              <button className="lp-btn-primary" onClick={onStudentLogin}>🎓 Student Login</button>
              <button className="lp-btn-ghost"   onClick={() => setTab('portals')}>Explore Portals <span style={{ fontSize:14 }}>→</span></button>
            </div>

            {/* Stats strip */}
            <div className="lp-stats">
              {[
                { val: '6',    label: 'Question Types', color: '#2563eb' },
                { val: '3',    label: 'Role Portals',   color: '#7c3aed' },
                { val: '100%', label: 'Browser Native', color: '#059669' },
                { val: '∞',   label: 'Exam Capacity',  color: '#d97706' },
              ].map(s => (
                <div key={s.label} className="lp-stat">
                  <span className="lp-stat-val" style={{ color: s.color }}>{s.val}</span>
                  <span className="lp-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Portal Cards */}
        <section className="lp-portals-wrap">
          <div className="lp-wrap-inner">
            <div className="lp-section-row">
              <div>
                <span className="lp-section-eyebrow">Access Points</span>
                <h2 className="lp-section-h">Choose Your Portal</h2>
                <p className="lp-section-p">Three dedicated portals built for each role — with tailored tools, controls and workflows.</p>
              </div>
              <ViewBtn label="View All →" onClick={() => setTab('portals')} />
            </div>

            <div className="lp-portal-grid">
              {PORTALS.map(p => (
                <div key={p.key} className="lp-portal-card"
                  onClick={actions[p.action]}
                  onMouseEnter={e => { e.currentTarget.style.borderColor=p.color; e.currentTarget.style.boxShadow=`0 20px 60px ${p.color}1a`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(37,99,235,0.1)'; e.currentTarget.style.boxShadow='none'; }}
                >
                  <div className="lp-portal-card-top" style={{ background: p.grad }} />
                  <div className="lp-portal-card-body">
                    <div className="lp-portal-icon" style={{ background: p.bg, borderColor: p.borderColor }}>{p.icon}</div>
                    <div className="lp-portal-badge" style={{ background: p.badgeBg, color: p.badgeColor }}>{p.badge}</div>
                    <div className="lp-portal-name"  style={{ color: p.color }}>{p.label}</div>
                    <div className="lp-portal-sub">{p.sub}</div>
                    <div className="lp-portal-feats">
                      {p.feats.slice(0, 4).map(f => (
                        <div key={f} className="lp-portal-feat">
                          <span className="lp-portal-feat-dot" style={{ background: p.bg, color: p.color, border: `1px solid ${p.borderColor}` }}>✓</span>
                          {f}
                        </div>
                      ))}
                    </div>
                    <div className="lp-portal-footer">
                      <span className="lp-portal-enter-lbl" style={{ color: p.color }}>Enter Portal</span>
                      <span className="lp-portal-enter-arr" style={{ background: p.bg, color: p.color }}>→</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features preview */}
        <section className="lp-features-wrap">
          <div className="lp-wrap-inner">
            <div className="lp-section-row">
              <div>
                <span className="lp-section-eyebrow">Platform Capabilities</span>
                <h2 className="lp-section-h">Everything Built In</h2>
                <p className="lp-section-p">No third-party tools. No extra subscriptions. Every feature your exam lifecycle needs, included.</p>
              </div>
              <ViewBtn label="All Features →" onClick={() => setTab('features')} />
            </div>
            <div className="lp-feat-grid">
              {FEATURES.slice(0, 6).map((f, i) => <FeatCard key={f.title} {...f} delay={i * 60} />)}
            </div>
          </div>
        </section>

        {/* CTA Band */}
        <section className="lp-cta-wrap">
          <div className="lp-cta-inner">
            <div style={{ maxWidth: 520 }}>
              <span className="lp-cta-tag">Ready to Begin?</span>
              <h3 className="lp-cta-h">Access Your Portal Today</h3>
              <p className="lp-cta-p">Log in with your credentials and access everything the DSAI platform has to offer — exams, analytics, notes and more.</p>
            </div>
            <LoginButtons />
          </div>
        </section>

      </>)}

      {/* ════ PORTALS TAB ════ */}
      {tab === 'portals' && (
        <div className="lp-pt-wrap">
          <div className="lp-pt-inner">

            {/* ── Split header ── */}
            <div className="lp-pt-header">
              <div className="lp-pt-header-left">
                <span className="lp-section-eyebrow">Access Points</span>
                <h2 style={{ fontSize:'clamp(32px,4vw,48px)', fontWeight:900, letterSpacing:'-2px', color:'#060e1e', lineHeight:1.05, marginBottom:16 }}>
                  Three portals.<br />One platform.
                </h2>
                <p style={{ fontSize:15, color:'#64748b', lineHeight:1.85, maxWidth:400 }}>
                  Every role gets exactly the tools it needs — nothing more, nothing less. Pick your portal and get started.
                </p>
              </div>
              <div className="lp-pt-header-right">
                {[
                  { icon:'🎓', val:'Students',  label:'Primary users',     color:'#2563eb', bg:'#eff6ff' },
                  { icon:'👨‍🏫', val:'Teachers',  label:'Instructors',       color:'#059669', bg:'#f0fdf4' },
                  { icon:'⚙️',  val:'Admins',    label:'Platform managers', color:'#7c3aed', bg:'#faf5ff' },
                ].map(s => (
                  <div key={s.val} className="lp-pt-stat-pill">
                    <div className="lp-pt-stat-pill-icon" style={{ background: s.bg }}>{s.icon}</div>
                    <div>
                      <div className="lp-pt-stat-pill-val" style={{ color: s.color }}>{s.val}</div>
                      <div className="lp-pt-stat-pill-label">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Portal accordion cards ── */}
            <div className="lp-pt-cards">
              {PORTALS.map((p, i) => (
                <div
                  key={p.key}
                  className="lp-pt-card"
                  style={{ '--card-color': p.color }}
                  onClick={actions[p.action]}
                  onMouseEnter={e => { e.currentTarget.style.background = p.bg + 'aa'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                >
                  {/* Number */}
                  <div className="lp-pt-card-num">0{i + 1}</div>

                  {/* Body */}
                  <div className="lp-pt-card-body">
                    <div className="lp-pt-card-top">
                      <div className="lp-pt-card-icon" style={{ background: p.bg, borderColor: p.borderColor }}>{p.icon}</div>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                          <span className="lp-pt-card-title" style={{ color: p.color }}>{p.label}</span>
                          <span className="lp-pt-card-badge" style={{ background: p.badgeBg, color: p.badgeColor }}>{p.badge}</span>
                        </div>
                      </div>
                    </div>
                    <p className="lp-pt-card-desc">{p.sub}</p>
                    <div className="lp-pt-card-feats">
                      {p.feats.map(f => (
                        <span key={f} className="lp-pt-card-feat">
                          <span style={{ width:5, height:5, borderRadius:'50%', background:p.color, display:'inline-block' }} />
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action column */}
                  <div className="lp-pt-card-action">
                    <button
                      className="lp-pt-card-action-btn"
                      style={{ background: p.grad, boxShadow: `0 6px 24px ${p.color}30` }}
                      onClick={e => { e.stopPropagation(); actions[p.action](); }}
                    >Enter Portal →</button>
                    <span className="lp-pt-card-action-hint">Click anywhere to enter</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* ════ FEATURES TAB ════ */}
      {tab === 'features' && (
        <div className="lp-page">
          <div className="lp-page-inner">
            <div className="lp-page-header">
              <span className="lp-page-eyebrow">Platform Capabilities</span>
              <h2 className="lp-page-h">Everything You Need</h2>
              <p className="lp-page-p">Built for modern academic institutions — secure, fast and complete from question creation to result release.</p>
            </div>
            <div className="lp-feat-grid">
              {FEATURES.map((f, i) => <FeatCard key={f.title} {...f} delay={i * 55} />)}
            </div>
            <div className="lp-sec-band">
              <div className="lp-sec-icon">🛡️</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Firebase-Powered Infrastructure</div>
                <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.8 }}>
                  All data lives in Firebase Realtime Database with strict role-based access rules. Files are stored as base64 inside the DB itself — eliminating CORS issues, external storage costs and third-party dependencies entirely.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ ABOUT TAB ════ */}
      {tab === 'about' && (
        <div className="lp-ab-wrap">
          <div className="lp-ab-inner">

            {/* ── Hero split ── */}
            <div className="lp-ab-hero">
              <div className="lp-ab-hero-text">
                <span className="lp-section-eyebrow">Our Institution</span>
                <h2 style={{ fontSize:'clamp(30px,4vw,46px)', fontWeight:900, letterSpacing:'-2px', color:'#060e1e', lineHeight:1.05, marginBottom:18 }}>
                  Building the<br />future of tech<br />education.
                </h2>
                <p style={{ fontSize:14, color:'#475569', lineHeight:1.9, marginBottom:24 }}>
                  BGS Institute of Management's DSAI division bridges academia and industry —
                  equipping students with hands-on data science and AI skills that matter.
                </p>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <img src={dsaiLogo} alt="DSAI" style={{ width:52, height:52, borderRadius:'50%', objectFit:'cover', border:'2px solid rgba(37,99,235,0.2)', boxShadow:'0 4px 16px rgba(37,99,235,0.14)', display:'block', flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:14, fontWeight:800, color:'#060e1e', letterSpacing:'-0.2px' }}>BGS Institute of Management</div>
                    <div style={{ fontSize:11, fontWeight:700, color:'#2563eb', letterSpacing:'0.4px', marginTop:2 }}>DSAI Division · Future of Tech</div>
                  </div>
                </div>
              </div>

              <div className="lp-ab-hero-visual">
                {[
                  { num:'3+',  label:'Years of DSAI education',  color:'#2563eb', bg:'#eff6ff' },
                  { num:'6',   label:'Question types supported',  color:'#7c3aed', bg:'#faf5ff' },
                  { num:'100%',label:'Browser-native platform',   color:'#059669', bg:'#f0fdf4' },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, border:`1px solid ${s.color}20`, borderRadius:16, padding:'20px 24px', display:'flex', alignItems:'center', gap:16 }}>
                    <span style={{ fontSize:28, fontWeight:900, color:s.color, letterSpacing:'-1px', lineHeight:1 }}>{s.num}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:'#475569', lineHeight:1.5 }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Story timeline ── */}
            <div style={{ marginBottom:56 }}>
              <h3 style={{ fontSize:20, fontWeight:800, color:'#060e1e', letterSpacing:'-0.5px', marginBottom:36 }}>
                What this portal does
              </h3>
              <div className="lp-ab-timeline">
                <div className="lp-ab-timeline-line" />
                {[
                  { icon:'📝', label:'Step 1', title:'Create & Schedule',  desc:'Admins build question papers with 6 question types — MCQ, coding, essay and more — then schedule them per batch with precise start/end times.' },
                  { icon:'🎓', label:'Step 2', title:'Students Take Exams', desc:'Students log in, see their scheduled exams, and attempt them in a secure browser-locked environment with an auto-submit countdown timer.' },
                  { icon:'👨‍🏫', label:'Step 3', title:'Teachers Grade',    desc:'Coding and essay answers go to teachers for review. Python and JavaScript submissions are auto-graded with live test-case execution in the browser.' },
                  { icon:'📊', label:'Step 4', title:'Results Released',    desc:'Admins control the visibility toggle. Once live, students see detailed results with scores, correct answers and performance analytics.' },
                ].map((item, i) => (
                  <div key={item.title} className="lp-ab-tl-item" style={{ animationDelay:`${i*80}ms` }}>
                    <div className="lp-ab-tl-dot">{item.icon}</div>
                    <div className="lp-ab-tl-content">
                      <div className="lp-ab-tl-label">{item.label}</div>
                      <div className="lp-ab-tl-title">{item.title}</div>
                      <div className="lp-ab-tl-desc">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Values ── */}
            <div style={{ marginBottom:56 }}>
              <h3 style={{ fontSize:20, fontWeight:800, color:'#060e1e', letterSpacing:'-0.5px', marginBottom:28 }}>Core Values</h3>
              <div className="lp-ab-values">
                {[
                  { icon:'🔬', title:'Innovation',  desc:'Embracing emerging technology in every aspect of education — from AI grading to in-browser code execution.',  color:'#2563eb', bg:'#eff6ff' },
                  { icon:'🤝', title:'Integrity',   desc:'Transparent, fair and unbiased assessments enforced through tab-lock security and admin-controlled visibility.', color:'#059669', bg:'#f0fdf4' },
                  { icon:'🚀', title:'Excellence',  desc:'Upholding the highest academic standards — from question design to result analysis and student feedback.',        color:'#7c3aed', bg:'#faf5ff' },
                ].map(v => (
                  <div key={v.title} className="lp-ab-val-card">
                    <div className="lp-ab-val-icon" style={{ background: v.bg }}>{v.icon}</div>
                    <div className="lp-ab-val-title" style={{ color: v.color }}>{v.title}</div>
                    <div className="lp-ab-val-desc">{v.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Tech stack ── */}
            <div className="lp-ab-stack">
              <div style={{ position:'relative', zIndex:1 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#60a5fa', textTransform:'uppercase', letterSpacing:'1.4px', marginBottom:12 }}>Built With</div>
                <div style={{ fontSize:20, fontWeight:800, color:'#fff', letterSpacing:'-0.5px', marginBottom:8 }}>Open-source. Zero vendor lock-in.</div>
                <div style={{ fontSize:13, color:'#94a3b8', lineHeight:1.8, marginBottom:24, maxWidth:500 }}>
                  Files stored as base64 in Firebase RTDB — no separate storage costs, no CORS issues. Python runs via Pyodide entirely in the browser. Everything is self-contained.
                </div>
                <div className="lp-ab-stack-chips">
                  {['React 18','Vite 5','Firebase RTDB','Pyodide','XLSX.js','Base64 Storage'].map(t => (
                    <span key={t} className="lp-ab-stack-chip">{t}</span>
                  ))}
                </div>
              </div>
              <div style={{ position:'relative', zIndex:1, textAlign:'center', flexShrink:0 }}>
                <div style={{ fontSize:64, marginBottom:8 }}>🛡️</div>
                <div style={{ fontSize:12, fontWeight:600, color:'#60a5fa' }}>Role-based<br />access control</div>
              </div>
            </div>

            {/* ── CTA ── */}
            <div className="lp-ab-cta">
              <div style={{ position:'relative', zIndex:1 }}>
                <div className="lp-ab-cta-title">Ready to get started?</div>
                <div className="lp-ab-cta-sub">Log in to your portal and experience the DSAI platform first-hand.</div>
              </div>
              <div className="lp-ab-cta-btns" style={{ position:'relative', zIndex:1 }}>
                {[
                  { label:'🎓 Student',  action: onStudentLogin },
                  { label:'👨‍🏫 Teacher',  action: onTeacherLogin },
                  { label:'⚙️ Admin',    action: onAdminLogin   },
                ].map(b => (
                  <button key={b.label} className="lp-ab-cta-btn" onClick={b.action}>{b.label}</button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ════ FOOTER ════ */}
      <footer className="lp-footer">
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <img src={dsaiLogo} alt="DSAI" style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover', border:'1.5px solid rgba(37,99,235,0.15)' }} />
          <span style={{ fontSize:12, color:'#94a3b8', fontWeight:500 }}>© 2025 BGS Institute of Management · DSAI Division</span>
        </div>
        <nav className="lp-footer-nav">
          {NAV_TABS.map(t => (
            <button key={t.id} className={`lp-footer-navbtn${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </nav>
      </footer>
    </div>
  );
}