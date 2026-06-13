// lib/hooks/useKeyboard.ts
// Ported from: eduteach-ai/eduteach/frontend/src/hooks/useKeyboard.js
//
// Global keyboard shortcuts. Registers a single window-level listener and
// uses a ref so the listener closes over the latest shortcut array without
// being re-registered on every render.
//
// Example:
//   useKeyboard([
//     { key: 'u', ctrl: true, action: () => openUploadPanel() },
//     { key: 'e', ctrl: true, action: () => exportChat() },
//     { key: 'Escape', action: () => closeAllPanels(), allowInInput: true },
//   ]);
//
// By default a shortcut is suppressed while the user is typing in an
// <input>, <textarea>, or contentEditable element. Pass allowInInput:true
// to override (useful for Escape, F-keys).
'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useKeyboard = useKeyboard;
const react_1 = require("react");
function useKeyboard(shortcuts) {
    // Always-current ref so the effect can stay registered once.
    const ref = (0, react_1.useRef)(shortcuts);
    (0, react_1.useEffect)(() => {
        ref.current = shortcuts;
    });
    (0, react_1.useEffect)(() => {
        if (typeof window === 'undefined')
            return;
        const handler = (e) => {
            for (const s of ref.current) {
                if (e.key.toLowerCase() === s.key.toLowerCase() &&
                    !!s.ctrl === (e.ctrlKey || e.metaKey) && // treat Cmd on macOS as Ctrl
                    !!s.shift === e.shiftKey &&
                    !!s.alt === e.altKey) {
                    const el = document.activeElement;
                    const tag = el?.tagName;
                    const isEditable = tag === 'INPUT' ||
                        tag === 'TEXTAREA' ||
                        el?.isContentEditable === true;
                    if (s.allowInInput !== true && isEditable)
                        continue;
                    e.preventDefault();
                    s.action(e);
                    break; // first match wins
                }
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []); // register once
}
