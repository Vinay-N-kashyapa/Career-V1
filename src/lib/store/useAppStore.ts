'use client';
// apps/web/src/lib/store/useAppStore.ts
// Zustand for client-only UI state (sidebar, active tab, toasts, WebSocket).
// Server data lives in React Query. This store is ONLY for UI state.

import { create } from 'zustand';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface AppState {
  // UI
  sidebarOpen:    boolean;
  activeTab:      string;
  setSidebarOpen: (open: boolean) => void;
  setActiveTab:   (tab: string)   => void;

  // Toasts
  toasts:     Toast[];
  addToast:   (toast: Omit<Toast, 'id'>) => void;
  removeToast:(id: string) => void;

  // WebSocket
  wsConnected:    boolean;
  setWsConnected: (connected: boolean) => void;

  // Live score updates (pushed via WebSocket, not fetched)
  liveScores: Record<string, number>;
  setLiveScore: (key: string, value: number) => void;

  // Exam state (local — not persisted to server until submit)
  examActive:    boolean;
  examSessionToken: string | null;
  examAnswers:   Record<string, unknown>;
  setExamActive: (active: boolean) => void;
  setExamToken:  (token: string | null) => void;
  saveExamAnswer:(questionId: string, answer: unknown) => void;
  clearExam:     () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // UI
  sidebarOpen:    true,
  activeTab:      'dashboard',
  setSidebarOpen: (open)   => set({ sidebarOpen: open }),
  setActiveTab:   (tab)    => set({ activeTab: tab }),

  // Toasts
  toasts: [],
  addToast: (toast) => set((s) => ({
    toasts: [...s.toasts, { ...toast, id: Date.now().toString() }],
  })),
  removeToast: (id) => set((s) => ({
    toasts: s.toasts.filter(t => t.id !== id),
  })),

  // WebSocket
  wsConnected:    false,
  setWsConnected: (connected) => set({ wsConnected: connected }),

  // Live scores
  liveScores: {},
  setLiveScore: (key, value) => set((s) => ({
    liveScores: { ...s.liveScores, [key]: value },
  })),

  // Exam
  examActive:       false,
  examSessionToken: null,
  examAnswers:      {},
  setExamActive:    (active) => set({ examActive: active }),
  setExamToken:     (token)  => set({ examSessionToken: token }),
  saveExamAnswer:   (questionId, answer) => set((s) => ({
    examAnswers: { ...s.examAnswers, [questionId]: answer },
  })),
  clearExam: () => set({
    examActive: false, examSessionToken: null, examAnswers: {},
  }),
}));

// Toast helpers — use these in components
export const toast = {
  success: (title: string, message?: string) =>
    useAppStore.getState().addToast({ type: 'success', title, message }),
  error: (title: string, message?: string) =>
    useAppStore.getState().addToast({ type: 'error', title, message }),
  info: (title: string, message?: string) =>
    useAppStore.getState().addToast({ type: 'info', title, message }),
  warning: (title: string, message?: string) =>
    useAppStore.getState().addToast({ type: 'warning', title, message }),
};
