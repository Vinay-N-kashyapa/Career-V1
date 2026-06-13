'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCareerProfile = useCareerProfile;
// useCareerProfile — loads all dashboard data from Firestore
const react_1 = require("react");
const AuthContext_1 = require("@/lib/context/AuthContext");
const client_1 = require("@/lib/api/client");
function useCareerProfile() {
    const { user } = (0, AuthContext_1.useAuth)();
    const [profile, setProfile] = (0, react_1.useState)(null);
    const [missions, setMissions] = (0, react_1.useState)([]);
    const [opportunities, setOpportunities] = (0, react_1.useState)([]);
    const [analytics, setAnalytics] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const [lastUpdate, setLastUpdate] = (0, react_1.useState)(Date.now());
    const fetchAll = (0, react_1.useCallback)(async () => {
        if (!user)
            return;
        try {
            setLoading(true);
            const [me, m, o, a] = await Promise.allSettled([
                client_1.api.get('/api/auth/me'),
                client_1.api.get('/api/missions/today'),
                client_1.api.get('/api/opportunities/feed'),
                client_1.api.get('/api/analytics/dashboard'),
            ]);
            if (me.status === 'fulfilled')
                setProfile(me.value?.user || me.value);
            if (m.status === 'fulfilled')
                setMissions(m.value?.missions || []);
            if (o.status === 'fulfilled')
                setOpportunities(o.value?.opportunities || []);
            if (a.status === 'fulfilled')
                setAnalytics(a.value);
            setLastUpdate(Date.now());
            setError(null);
        }
        catch (e) {
            setError('Failed to load career profile');
        }
        finally {
            setLoading(false);
        }
    }, [user]);
    (0, react_1.useEffect)(() => { fetchAll(); }, [fetchAll]);
    return {
        profile, missions, opportunities, analytics,
        loading, error, refresh: fetchAll,
        wsStatus: 'disconnected', lastUpdate,
    };
}
