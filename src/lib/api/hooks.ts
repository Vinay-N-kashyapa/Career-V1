'use client';
// apps/web/src/lib/api/hooks.ts
// All React Query hooks for the platform.
// Components import from here — never fetch directly.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

// ─── Query Keys ──────────────────────────────────────────────
export const KEYS = {
  me:              ['auth', 'me']              as const,
  dashboard:       ['dashboard']               as const,
  scores:          ['scores']                  as const,
  missions:        ['missions']                as const,
  missionsToday:   ['missions', 'today']       as const,
  missionsStreak:  ['missions', 'streak']      as const,
  resume:          ['resume']                  as const,
  vault:           ['vault']                   as const,
  opportunities:   ['opportunities']           as const,
  analytics:       ['analytics']               as const,
  notifications:   ['notifications']           as const,
  examScheduled:   ['exam', 'scheduled']       as const,
  examResults:     ['exam', 'results']         as const,
  careerDna:       ['career-dna']              as const,
  careerDnaHistory:['career-dna', 'history']  as const,
  careerTwin:      ['career-twin']             as const,
  trust:           ['trust']                   as const,
  recruiter:       ['recruiter', 'candidates'] as const,
};

// ─── Auth ─────────────────────────────────────────────────────
export function useMe() {
  return useQuery({
    queryKey: KEYS.me,
    queryFn:  () => api.get<{ user: User }>('/api/auth/me').then(r => r.user),
    staleTime: 60 * 1000,
    retry:     false,
  });
}

// ─── Dashboard ────────────────────────────────────────────────
export function useDashboard() {
  return useQuery({
    queryKey: KEYS.dashboard,
    queryFn:  () => api.get<DashboardData>('/api/analytics/dashboard'),
    staleTime: 30 * 1000,
  });
}

export function useScores() {
  return useQuery({
    queryKey: KEYS.scores,
    queryFn:  () => api.get<{ scores: CareerScores }>('/api/career-dna/scores').then(r => r.scores),
    staleTime: 30 * 1000,
  });
}

// ─── Missions ─────────────────────────────────────────────────
export function useMissionsToday() {
  return useQuery({
    queryKey: KEYS.missionsToday,
    queryFn:  () => api.get<{ missions: Mission[] }>('/api/missions/today').then(r => r.missions),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMissionHistory() {
  return useQuery({
    queryKey: KEYS.missions,
    queryFn:  () => api.get<{ missions: Mission[] }>('/api/missions/history').then(r => r.missions),
    staleTime: 2 * 60 * 1000,
  });
}

export function useSubmitMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { missionId: string; proofType: string; proofUrl?: string; proofText?: string }) =>
      api.post('/api/missions/submit', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.missionsToday });
      qc.invalidateQueries({ queryKey: KEYS.scores });
      qc.invalidateQueries({ queryKey: KEYS.dashboard });
      qc.invalidateQueries({ queryKey: KEYS.missionsStreak });
    },
  });
}

/** Returns streak + XP total + XP level for the XP progress bar. */
export function useMissionStreak() {
  return useQuery({
    queryKey: KEYS.missionsStreak,
    queryFn:  () => api.get<{ streak: number; xpTotal: number; xpLevel: number }>('/api/missions/streak'),
    staleTime: 2 * 60 * 1000,
  });
}

// ─── Resume ───────────────────────────────────────────────────
export function useResumes() {
  return useQuery({
    queryKey: KEYS.resume,
    queryFn:  () => api.get<{ resumes: Resume[] }>('/api/resume/list').then(r => r.resumes),
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Vault ────────────────────────────────────────────────────
export function useVault() {
  return useQuery({
    queryKey: KEYS.vault,
    queryFn:  () => api.get<{ items: VaultItem[] }>('/api/vault').then(r => r.items),
    staleTime: 2 * 60 * 1000,
  });
}

export function useAddVaultItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<VaultItem>) => api.post('/api/vault', data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEYS.vault }),
  });
}

// ─── Opportunities ────────────────────────────────────────────
export function useOpportunities(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return useQuery({
    queryKey: [...KEYS.opportunities, params],
    queryFn:  () => api.get<{ opportunities: Opportunity[] }>(`/api/opportunities${qs}`).then(r => r.opportunities),
    staleTime: 2 * 60 * 1000,
  });
}

export function useApply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { opportunityId: string; coverLetter?: string }) =>
      api.post('/api/opportunities/apply', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.opportunities }),
  });
}

// ─── Notifications ────────────────────────────────────────────
export function useNotifications() {
  return useQuery({
    queryKey: KEYS.notifications,
    queryFn:  () => api.get<{ notifications: Notification[] }>('/api/notifications').then(r => r.notifications),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/api/notifications/${id}/read`, {}),
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEYS.notifications }),
  });
}

// ─── Career DNA ───────────────────────────────────────────────
export function useCareerDna() {
  return useQuery({
    queryKey: KEYS.careerDna,
    queryFn:  () => api.get<CareerDnaProfile>('/api/career-dna/profile'),
    staleTime: 60 * 1000,
  });
}

/**
 * Fetches 6-month score evolution history for the Career DNA evolution chart.
 * Falls back to synthesised data if score_snapshots table is empty.
 * Returns { history: HistoryPoint[], months: number }
 */
export function useCareerDnaHistory(months = 6) {
  return useQuery({
    queryKey: [...KEYS.careerDnaHistory, months],
    queryFn:  async () => {
      try {
        return await api.get<CareerDnaHistory>(`/api/career-dna/history?months=${months}`);
      } catch {
        // Network / backend not running — return empty so chart shows gracefully
        return { history: [], months } as CareerDnaHistory;
      }
    },
    staleTime:    10 * 60 * 1000, // 10 min — history doesn't change fast
    gcTime:       30 * 60 * 1000,
    retry:        false,
  });
}

// ─── Trust ────────────────────────────────────────────────────
export function useTrustScore() {
  return useQuery({
    queryKey: KEYS.trust,
    queryFn:  () => api.get<TrustData>('/api/trust/score'),
    staleTime: 60 * 1000,
  });
}

// ─── Exams ────────────────────────────────────────────────────
export function useScheduledExams() {
  return useQuery({
    queryKey: KEYS.examScheduled,
    queryFn:  () => api.get<{ exams: ExamSchedule[] }>('/api/exam/scheduled').then(r => r.exams),
    staleTime: 2 * 60 * 1000,
  });
}

export function useExamResults() {
  return useQuery({
    queryKey: KEYS.examResults,
    queryFn:  () => api.get<{ results: ExamResult[] }>('/api/exam/results').then(r => r.results),
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Career Twin ──────────────────────────────────────────────
export function useCareerTwin() {
  return useQuery({
    queryKey: KEYS.careerTwin,
    queryFn:  () => api.get<CareerTwinResult>('/api/career-twin/results'),
    staleTime: 30 * 60 * 1000,
  });
}

export function useRunCareerTwin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/api/career-twin/run', {}),
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEYS.careerTwin }),
  });
}

// ─── Recruiter ────────────────────────────────────────────────
export function useCandidates(filters: Record<string, string | number>) {
  const qs = '?' + new URLSearchParams(
    Object.entries(filters).filter(([,v]) => v !== undefined && v !== '').map(([k,v]) => [k, String(v)])
  ).toString();
  return useQuery({
    queryKey: [...KEYS.recruiter, filters],
    queryFn:  () => api.get<{ candidates: Candidate[] }>(`/api/recruiter/candidates${qs}`).then(r => r.candidates),
    staleTime: 2 * 60 * 1000,
    enabled:   Object.keys(filters).length > 0,
  });
}

// ─── Personality ──────────────────────────────────────────────
export function usePersonality() {
  return useQuery({
    queryKey: ['personality'],
    queryFn:  () => api.get<PersonalityData>('/api/personality/report'),
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Profile ──────────────────────────────────────────────────
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn:  () => api.get<{ user: User; profile: CareerScores }>('/api/auth/me'),
    staleTime: 60 * 1000,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<User>) => api.patch('/api/auth/profile', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      qc.invalidateQueries({ queryKey: KEYS.me });
    },
  });
}

// ─── Types ───────────────────────────────────────────────────

export interface HistoryPoint {
  date:             string;
  ats_score:        number;
  trust_score:      number;
  career_dna_score: number;
  mission_streak:   number;
}

export interface CareerDnaHistory {
  history: HistoryPoint[];
  months:  number;
}

interface User {
  id: string; username: string; displayName: string; role: string;
  atsScore: number; trustScore: number; careerDnaScore: number;
  missionStreak: number; weakAreas: string[]; skillTags: string[];
}
interface CareerScores {
  ats_score: number; trust_score: number; career_dna_score: number;
  career_readiness: number; mission_streak: number;
  leadership_score: number; communication_score: number;
  execution_score: number; consistency_score: number;
  reliability_score: number; innovation_score: number; adaptability_score: number;
}
interface DashboardData { scores: CareerScores; missions: Mission[]; recentActivity: unknown[] }
interface Mission { id: string; title: string; type: string; status: string; dueDate: string; trustReward: number }
interface Resume  { id: string; atsScore: number; keywordGaps: string[]; createdAt: string }
interface VaultItem { id: string; title: string; type: string; verificationStatus: string; isPublic: boolean }
interface Opportunity { id: string; title: string; requiredSkills: string[]; matchScore?: number }
interface Notification { id: string; title: string; body: string; read: boolean; createdAt: string }
interface CareerDnaProfile { scores: Record<string, number>; weakAreas: string[]; profile?: Record<string, number> }
interface TrustData { score: number; breakdown: Record<string, number> }
interface ExamSchedule { id: string; title: string; startTime: string; durationMinutes: number }
interface ExamResult { id: string; percentage: number; badgeLevel: string; status: string }
interface CareerTwinResult { bestPath: string; salaryRange: unknown; countryFit: unknown[] }
interface Candidate { id: string; trustScore: number; atsScore: number; careerReadiness: number; matchScore: number }
interface PersonalityData { traits: Record<string, number>; insights: string[]; weekly_change: Record<string, number> }

// ─── Pins ──────────────────────────────────────────────────
export const PIN_KEYS = {
  balance: ['pins', 'balance'] as const,
};

export function usePinBalance() {
  return useQuery({
    queryKey: PIN_KEYS.balance,
    queryFn:  () => api.get<{ pins: number; transactions: unknown[] }>('/api/pins/balance'),
    staleTime: 30 * 1000,
  });
}

export function useEarnPins() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { source: string; amount: number }) => api.post('/api/pins/earn', data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: PIN_KEYS.balance }),
  });
}

export function useSpendPins() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { featureKey: string; cost: number }) => api.post('/api/pins/spend', data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: PIN_KEYS.balance }),
  });
}
