'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toast = exports.useAppStore = void 0;
// apps/web/src/lib/store/useAppStore.ts
// Zustand for client-only UI state (sidebar, active tab, toasts, WebSocket).
// Server data lives in React Query. This store is ONLY for UI state.
const zustand_1 = require("zustand");
exports.useAppStore = (0, zustand_1.create)((set) => ({
    // UI
    sidebarOpen: true,
    activeTab: 'dashboard',
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    // Toasts
    toasts: [],
    addToast: (toast) => set((s) => ({
        toasts: [...s.toasts, { ...toast, id: Date.now().toString() }],
    })),
    removeToast: (id) => set((s) => ({
        toasts: s.toasts.filter(t => t.id !== id),
    })),
    // WebSocket
    wsConnected: false,
    setWsConnected: (connected) => set({ wsConnected: connected }),
    // Live scores
    liveScores: {},
    setLiveScore: (key, value) => set((s) => ({
        liveScores: { ...s.liveScores, [key]: value },
    })),
    // Exam
    examActive: false,
    examSessionToken: null,
    examAnswers: {},
    setExamActive: (active) => set({ examActive: active }),
    setExamToken: (token) => set({ examSessionToken: token }),
    saveExamAnswer: (questionId, answer) => set((s) => ({
        examAnswers: { ...s.examAnswers, [questionId]: answer },
    })),
    clearExam: () => set({
        examActive: false, examSessionToken: null, examAnswers: {},
    }),
}));
// Toast helpers — use these in components
exports.toast = {
    success: (title, message) => exports.useAppStore.getState().addToast({ type: 'success', title, message }),
    error: (title, message) => exports.useAppStore.getState().addToast({ type: 'error', title, message }),
    info: (title, message) => exports.useAppStore.getState().addToast({ type: 'info', title, message }),
    warning: (title, message) => exports.useAppStore.getState().addToast({ type: 'warning', title, message }),
};
