// lib/hooks/useExport.ts
// Ported from: eduteach-ai/eduteach/frontend/src/hooks/useExport.js
//
// Download a session (chat history) as a plain-text file.
// Generalised from the EduTeach version: works for any role in a transcript,
// not just teacher↔student, so it can also export interview-AI sessions etc.
'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useExport = useExport;
const react_1 = require("react");
const teachers_1 = require("@/lib/teachers");
const MODE_LABELS = {
    explain: 'Explanation',
    oral: 'Oral Test',
    written: 'Written Test',
    flashcard: 'Flashcards',
    summary: 'Summary',
    interview: 'Interview Practice',
    chat: 'Avatar Chat',
};
function useExport() {
    const exportChat = (0, react_1.useCallback)((messages, options = {}) => {
        if (!messages.length)
            return;
        const { teacherId, mode, notesTitles = [], filenamePrefix = 'pinit-session', headerTitle = 'PinIT — Session Export', } = options;
        const teacher = teacherId ? (0, teachers_1.getTeacher)(teacherId) : null;
        const modeLabel = mode ? (MODE_LABELS[mode] || mode) : '—';
        const now = new Date().toLocaleString();
        const headerLines = [
            '═══════════════════════════════════════════',
            `  ${headerTitle}`,
            teacher ? `  Teacher : ${teacher.name} (${teacher.type})` : null,
            mode ? `  Mode    : ${modeLabel}` : null,
            `  Notes   : ${notesTitles.length ? notesTitles.join(', ') : '—'}`,
            `  Date    : ${now}`,
            '═══════════════════════════════════════════',
            '',
        ].filter(Boolean);
        const lines = [...headerLines];
        messages.forEach((msg) => {
            const role = msg.role === 'assistant'
                ? teacher?.name || 'Assistant'
                : msg.role === 'user'
                    ? 'You'
                    : msg.role;
            const clean = msg.content
                .replace(/[*_`#]/g, '')
                .replace(/\n{3,}/g, '\n\n');
            const ts = msg.timestamp ? ` (${new Date(msg.timestamp).toLocaleTimeString()})` : '';
            lines.push(`[${role}${ts}]`);
            lines.push(clean);
            lines.push('');
        });
        lines.push('─ End of session ─');
        const blob = new Blob([lines.join('\n')], {
            type: 'text/plain;charset=utf-8',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filenamePrefix}-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }, []);
    return { exportChat };
}
