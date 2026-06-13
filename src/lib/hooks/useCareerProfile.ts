'use client';
// useCareerProfile — loads all dashboard data from Firestore
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { api }     from '@/lib/api/client';

export function useCareerProfile() {
  const { user } = useAuth();
  const [profile,       setProfile]      = useState<any>(null);
  const [missions,      setMissions]     = useState<any[]>([]);
  const [opportunities, setOpportunities]= useState<any[]>([]);
  const [analytics,     setAnalytics]    = useState<any>(null);
  const [loading,       setLoading]      = useState(true);
  const [error,         setError]        = useState<string|null>(null);
  const [lastUpdate,    setLastUpdate]   = useState(Date.now());

  const fetchAll = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [me, m, o, a] = await Promise.allSettled([
        api.get<any>('/api/auth/me'),
        api.get<any>('/api/missions/today'),
        api.get<any>('/api/opportunities/feed'),
        api.get<any>('/api/analytics/dashboard'),
      ]);
      if (me.status === 'fulfilled')            setProfile(me.value?.user || me.value);
      if (m.status  === 'fulfilled')            setMissions(m.value?.missions || []);
      if (o.status  === 'fulfilled')            setOpportunities(o.value?.opportunities || []);
      if (a.status  === 'fulfilled')            setAnalytics(a.value);
      setLastUpdate(Date.now());
      setError(null);
    } catch (e) {
      setError('Failed to load career profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return {
    profile, missions, opportunities, analytics,
    loading, error, refresh: fetchAll,
    wsStatus: 'disconnected' as const, lastUpdate,
  };
}
