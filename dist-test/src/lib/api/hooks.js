'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PIN_KEYS = exports.KEYS = void 0;
exports.useMe = useMe;
exports.useDashboard = useDashboard;
exports.useScores = useScores;
exports.useMissionsToday = useMissionsToday;
exports.useMissionHistory = useMissionHistory;
exports.useSubmitMission = useSubmitMission;
exports.useMissionStreak = useMissionStreak;
exports.useResumes = useResumes;
exports.useVault = useVault;
exports.useAddVaultItem = useAddVaultItem;
exports.useOpportunities = useOpportunities;
exports.useApply = useApply;
exports.useNotifications = useNotifications;
exports.useMarkRead = useMarkRead;
exports.useCareerDna = useCareerDna;
exports.useCareerDnaHistory = useCareerDnaHistory;
exports.useTrustScore = useTrustScore;
exports.useScheduledExams = useScheduledExams;
exports.useExamResults = useExamResults;
exports.useCareerTwin = useCareerTwin;
exports.useRunCareerTwin = useRunCareerTwin;
exports.useCandidates = useCandidates;
exports.usePersonality = usePersonality;
exports.useProfile = useProfile;
exports.useUpdateProfile = useUpdateProfile;
exports.usePinBalance = usePinBalance;
exports.useEarnPins = useEarnPins;
exports.useSpendPins = useSpendPins;
// apps/web/src/lib/api/hooks.ts
// All React Query hooks for the platform.
// Components import from here — never fetch directly.
const react_query_1 = require("@tanstack/react-query");
const client_1 = require("./client");
// ─── Query Keys ──────────────────────────────────────────────
exports.KEYS = {
    me: ['auth', 'me'],
    dashboard: ['dashboard'],
    scores: ['scores'],
    missions: ['missions'],
    missionsToday: ['missions', 'today'],
    missionsStreak: ['missions', 'streak'],
    resume: ['resume'],
    vault: ['vault'],
    opportunities: ['opportunities'],
    analytics: ['analytics'],
    notifications: ['notifications'],
    examScheduled: ['exam', 'scheduled'],
    examResults: ['exam', 'results'],
    careerDna: ['career-dna'],
    careerDnaHistory: ['career-dna', 'history'],
    careerTwin: ['career-twin'],
    trust: ['trust'],
    recruiter: ['recruiter', 'candidates'],
};
// ─── Auth ─────────────────────────────────────────────────────
function useMe() {
    return (0, react_query_1.useQuery)({
        queryKey: exports.KEYS.me,
        queryFn: () => client_1.api.get('/api/auth/me').then(r => r.user),
        staleTime: 60 * 1000,
        retry: false,
    });
}
// ─── Dashboard ────────────────────────────────────────────────
function useDashboard() {
    return (0, react_query_1.useQuery)({
        queryKey: exports.KEYS.dashboard,
        queryFn: () => client_1.api.get('/api/analytics/dashboard'),
        staleTime: 30 * 1000,
    });
}
function useScores() {
    return (0, react_query_1.useQuery)({
        queryKey: exports.KEYS.scores,
        queryFn: () => client_1.api.get('/api/career-dna/scores').then(r => r.scores),
        staleTime: 30 * 1000,
    });
}
// ─── Missions ─────────────────────────────────────────────────
function useMissionsToday() {
    return (0, react_query_1.useQuery)({
        queryKey: exports.KEYS.missionsToday,
        queryFn: () => client_1.api.get('/api/missions/today').then(r => r.missions),
        staleTime: 5 * 60 * 1000,
    });
}
function useMissionHistory() {
    return (0, react_query_1.useQuery)({
        queryKey: exports.KEYS.missions,
        queryFn: () => client_1.api.get('/api/missions/history').then(r => r.missions),
        staleTime: 2 * 60 * 1000,
    });
}
function useSubmitMission() {
    const qc = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: (data) => client_1.api.post('/api/missions/submit', data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: exports.KEYS.missionsToday });
            qc.invalidateQueries({ queryKey: exports.KEYS.scores });
            qc.invalidateQueries({ queryKey: exports.KEYS.dashboard });
            qc.invalidateQueries({ queryKey: exports.KEYS.missionsStreak });
        },
    });
}
/** Returns streak + XP total + XP level for the XP progress bar. */
function useMissionStreak() {
    return (0, react_query_1.useQuery)({
        queryKey: exports.KEYS.missionsStreak,
        queryFn: () => client_1.api.get('/api/missions/streak'),
        staleTime: 2 * 60 * 1000,
    });
}
// ─── Resume ───────────────────────────────────────────────────
function useResumes() {
    return (0, react_query_1.useQuery)({
        queryKey: exports.KEYS.resume,
        queryFn: () => client_1.api.get('/api/resume/list').then(r => r.resumes),
        staleTime: 5 * 60 * 1000,
    });
}
// ─── Vault ────────────────────────────────────────────────────
function useVault() {
    return (0, react_query_1.useQuery)({
        queryKey: exports.KEYS.vault,
        queryFn: () => client_1.api.get('/api/vault').then(r => r.items),
        staleTime: 2 * 60 * 1000,
    });
}
function useAddVaultItem() {
    const qc = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: (data) => client_1.api.post('/api/vault', data),
        onSuccess: () => qc.invalidateQueries({ queryKey: exports.KEYS.vault }),
    });
}
// ─── Opportunities ────────────────────────────────────────────
function useOpportunities(params) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return (0, react_query_1.useQuery)({
        queryKey: [...exports.KEYS.opportunities, params],
        queryFn: () => client_1.api.get(`/api/opportunities${qs}`).then(r => r.opportunities),
        staleTime: 2 * 60 * 1000,
    });
}
function useApply() {
    const qc = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: (data) => client_1.api.post('/api/opportunities/apply', data),
        onSuccess: () => qc.invalidateQueries({ queryKey: exports.KEYS.opportunities }),
    });
}
// ─── Notifications ────────────────────────────────────────────
function useNotifications() {
    return (0, react_query_1.useQuery)({
        queryKey: exports.KEYS.notifications,
        queryFn: () => client_1.api.get('/api/notifications').then(r => r.notifications),
        staleTime: 30 * 1000,
        refetchInterval: 60 * 1000,
    });
}
function useMarkRead() {
    const qc = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: (id) => client_1.api.patch(`/api/notifications/${id}/read`, {}),
        onSuccess: () => qc.invalidateQueries({ queryKey: exports.KEYS.notifications }),
    });
}
// ─── Career DNA ───────────────────────────────────────────────
function useCareerDna() {
    return (0, react_query_1.useQuery)({
        queryKey: exports.KEYS.careerDna,
        queryFn: () => client_1.api.get('/api/career-dna/profile'),
        staleTime: 60 * 1000,
    });
}
/**
 * Fetches 6-month score evolution history for the Career DNA evolution chart.
 * Falls back to synthesised data if score_snapshots table is empty.
 * Returns { history: HistoryPoint[], months: number }
 */
function useCareerDnaHistory(months = 6) {
    return (0, react_query_1.useQuery)({
        queryKey: [...exports.KEYS.careerDnaHistory, months],
        queryFn: async () => {
            try {
                return await client_1.api.get(`/api/career-dna/history?months=${months}`);
            }
            catch {
                // Network / backend not running — return empty so chart shows gracefully
                return { history: [], months };
            }
        },
        staleTime: 10 * 60 * 1000, // 10 min — history doesn't change fast
        gcTime: 30 * 60 * 1000,
        retry: false,
    });
}
// ─── Trust ────────────────────────────────────────────────────
function useTrustScore() {
    return (0, react_query_1.useQuery)({
        queryKey: exports.KEYS.trust,
        queryFn: () => client_1.api.get('/api/trust/score'),
        staleTime: 60 * 1000,
    });
}
// ─── Exams ────────────────────────────────────────────────────
function useScheduledExams() {
    return (0, react_query_1.useQuery)({
        queryKey: exports.KEYS.examScheduled,
        queryFn: () => client_1.api.get('/api/exam/scheduled').then(r => r.exams),
        staleTime: 2 * 60 * 1000,
    });
}
function useExamResults() {
    return (0, react_query_1.useQuery)({
        queryKey: exports.KEYS.examResults,
        queryFn: () => client_1.api.get('/api/exam/results').then(r => r.results),
        staleTime: 5 * 60 * 1000,
    });
}
// ─── Career Twin ──────────────────────────────────────────────
function useCareerTwin() {
    return (0, react_query_1.useQuery)({
        queryKey: exports.KEYS.careerTwin,
        queryFn: () => client_1.api.get('/api/career-twin/results'),
        staleTime: 30 * 60 * 1000,
    });
}
function useRunCareerTwin() {
    const qc = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: () => client_1.api.post('/api/career-twin/run', {}),
        onSuccess: () => qc.invalidateQueries({ queryKey: exports.KEYS.careerTwin }),
    });
}
// ─── Recruiter ────────────────────────────────────────────────
function useCandidates(filters) {
    const qs = '?' + new URLSearchParams(Object.entries(filters).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])).toString();
    return (0, react_query_1.useQuery)({
        queryKey: [...exports.KEYS.recruiter, filters],
        queryFn: () => client_1.api.get(`/api/recruiter/candidates${qs}`).then(r => r.candidates),
        staleTime: 2 * 60 * 1000,
        enabled: Object.keys(filters).length > 0,
    });
}
// ─── Personality ──────────────────────────────────────────────
function usePersonality() {
    return (0, react_query_1.useQuery)({
        queryKey: ['personality'],
        queryFn: () => client_1.api.get('/api/personality/report'),
        staleTime: 5 * 60 * 1000,
    });
}
// ─── Profile ──────────────────────────────────────────────────
function useProfile() {
    return (0, react_query_1.useQuery)({
        queryKey: ['profile'],
        queryFn: () => client_1.api.get('/api/auth/me'),
        staleTime: 60 * 1000,
    });
}
function useUpdateProfile() {
    const qc = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: (data) => client_1.api.patch('/api/auth/profile', data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['profile'] });
            qc.invalidateQueries({ queryKey: exports.KEYS.me });
        },
    });
}
// ─── Pins ──────────────────────────────────────────────────
exports.PIN_KEYS = {
    balance: ['pins', 'balance'],
};
function usePinBalance() {
    return (0, react_query_1.useQuery)({
        queryKey: exports.PIN_KEYS.balance,
        queryFn: () => client_1.api.get('/api/pins/balance'),
        staleTime: 30 * 1000,
    });
}
function useEarnPins() {
    const qc = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: (data) => client_1.api.post('/api/pins/earn', data),
        onSuccess: () => qc.invalidateQueries({ queryKey: exports.PIN_KEYS.balance }),
    });
}
function useSpendPins() {
    const qc = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: (data) => client_1.api.post('/api/pins/spend', data),
        onSuccess: () => qc.invalidateQueries({ queryKey: exports.PIN_KEYS.balance }),
    });
}
