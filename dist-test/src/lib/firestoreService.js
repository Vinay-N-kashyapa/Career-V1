"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMPTY_PROFILE = exports.DEMO_NOTIFICATIONS = exports.DEMO_OPPORTUNITIES = exports.DEMO_MISSIONS = exports.DEMO_PROFILE = void 0;
exports.getUserProfile = getUserProfile;
exports.createUserProfile = createUserProfile;
exports.updateUserProfile = updateUserProfile;
exports.ensureSeedData = ensureSeedData;
exports.getTodayMissions = getTodayMissions;
exports.getMissionHistory = getMissionHistory;
exports.submitMission = submitMission;
exports.getVaultItems = getVaultItems;
exports.addVaultItem = addVaultItem;
exports.generateResumeFromVault = generateResumeFromVault;
exports.getNotifications = getNotifications;
exports.markAllNotificationsRead = markAllNotificationsRead;
exports.getOpportunities = getOpportunities;
exports.applyToOpportunity = applyToOpportunity;
exports.recalculateCareerDna = recalculateCareerDna;
exports.getDashboardAnalytics = getDashboardAnalytics;
exports.createInterviewSession = createInterviewSession;
exports.getInterviewSession = getInterviewSession;
exports.appendInterviewTranscript = appendInterviewTranscript;
exports.completeInterviewSession = completeInterviewSession;
exports.getInterviewHistory = getInterviewHistory;
exports.getAllUsers = getAllUsers;
exports.addJob = addJob;
exports.updateJob = updateJob;
exports.deleteJob = deleteJob;
exports.getJobs = getJobs;
exports.getApplicationsForRecruiter = getApplicationsForRecruiter;
exports.updateApplicationStatus = updateApplicationStatus;
exports.verifyVaultItem = verifyVaultItem;
exports.scheduleSession = scheduleSession;
exports.getSessions = getSessions;
exports.addAuditEntry = addAuditEntry;
exports.getAuditLogs = getAuditLogs;
exports.sendBroadcastNotification = sendBroadcastNotification;
exports.generateCustomSkillQuests = generateCustomSkillQuests;
// Firestore service — complete implementation (from Document 9)
const firestore_1 = require("firebase/firestore");
const firebase_1 = require("./firebase");
const supabaseClient_1 = require("./supabaseClient");
exports.DEMO_PROFILE = {
    displayName: 'Ashwanth Kumar', role: 'student', registerNumber: 'REG2024001',
    ats_score: 72, career_dna_score: 68, trust_score: 81, mission_streak: 7,
    recruiter_visibility: 65, career_readiness: 74, communication_score: 76,
    execution_score: 71, leadership_score: 58, consistency_score: 83, adaptability_score: 69,
    confidence_score: 72, innovation_score: 65,
    weak_areas: ['System Design', 'DSA - Trees', 'Behavioral STAR'],
    skill_tags: ['React', 'Node.js', 'Python', 'Machine Learning', 'TypeScript'],
    certifications: ['AWS Cloud Practitioner', 'Google Data Analytics'],
    target_role: 'Full Stack Engineer', career_goal: 'Land at a top product company',
    intelligence_score: 78, career_dna_archetype: 'builder',
    xp_total: 2500, xp_level: 2, missions_completed: 18, interviews_done: 6, vault_count: 3,
};
exports.DEMO_MISSIONS = [
    { title: 'LinkedIn Post: Tech Insight', description: 'Write a 200-word LinkedIn post sharing a technical insight. Use STAR format and include one specific metric.', type: 'communication', status: 'pending', proof_type: 'url', due_date: new Date().toISOString().slice(0, 10), trust_reward: 8, source_weakness: 'Communication', estimated_minutes: 20, learn_url: 'https://linkedin.com', ai_evaluation: null },
    { title: 'LeetCode: Binary Tree Problem', description: 'Solve any medium-difficulty binary tree problem. Share your solution with time/space complexity analysis.', type: 'skill', status: 'pending', proof_type: 'url', due_date: new Date().toISOString().slice(0, 10), trust_reward: 12, source_weakness: 'DSA - Trees', estimated_minutes: 45, learn_url: 'https://leetcode.com', ai_evaluation: null },
    { title: 'STAR Story Practice', description: 'Record a 90-second video answering "Tell me about a time you solved a complex problem under pressure."', type: 'personality', status: 'pending', proof_type: 'url', due_date: new Date().toISOString().slice(0, 10), trust_reward: 10, source_weakness: 'Behavioral STAR', estimated_minutes: 30, learn_url: null, ai_evaluation: null },
];
exports.DEMO_OPPORTUNITIES = [
    { title: 'Software Engineer II', company: 'Zomato', location: 'Bangalore', type: 'Full-time', salary: '₹25-35 LPA', match_score: 88, skills: ['React', 'Node.js', 'PostgreSQL'], posted_at: '2 days ago', description: 'Join our platform team building high-scale food delivery infrastructure.' },
    { title: 'Full Stack Developer', company: 'PhonePe', location: 'Bangalore (Hybrid)', type: 'Full-time', salary: '₹20-30 LPA', match_score: 84, skills: ['TypeScript', 'React', 'Python'], posted_at: '1 day ago', description: "Work on India's leading fintech platform, serving 500M+ users." },
    { title: 'ML Engineer', company: 'Swiggy', location: 'Bangalore', type: 'Full-time', salary: '₹22-32 LPA', match_score: 79, skills: ['Python', 'TensorFlow', 'SQL'], posted_at: '3 days ago', description: 'Build recommendation systems powering food and grocery delivery.' },
    { title: 'React Developer', company: 'Razorpay', location: 'Bangalore', type: 'Full-time', salary: '₹15-25 LPA', match_score: 91, skills: ['React', 'TypeScript', 'GraphQL'], posted_at: '1 hour ago', description: "Build beautiful payment UIs for India's leading payment gateway." },
    { title: 'SDE Intern', company: 'Meesho', location: 'Bangalore', type: 'Internship', salary: '₹80K/month', match_score: 95, skills: ['React', 'Node.js'], posted_at: '12 hours ago', description: 'Summer internship with pre-placement offer potential.' },
];
exports.DEMO_NOTIFICATIONS = [
    { type: 'success', title: 'Mission Completed!', message: 'You completed "LinkedIn Post" and earned +8 trust points.', source: 'mission', read: false, is_read: false, createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
    { type: 'info', title: 'New Opportunity Match', message: 'Razorpay React Developer — 91% match for your profile.', source: 'opportunities', read: false, is_read: false, createdAt: new Date(Date.now() - 5 * 3600000).toISOString() },
    { type: 'warning', title: 'Career DNA Update', message: 'Your DSA score dropped. Complete 2 algorithm missions to recover.', source: 'exam', read: true, is_read: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
];
exports.EMPTY_PROFILE = {
    displayName: '', role: 'student', registerNumber: null,
    ats_score: 0, career_dna_score: 0, trust_score: 40, mission_streak: 0,
    recruiter_visibility: 0, career_readiness: 0, communication_score: 0,
    execution_score: 0, leadership_score: 0, consistency_score: 0, adaptability_score: 0,
    confidence_score: 0, innovation_score: 0,
    weak_areas: [], skill_tags: [], certifications: [],
    target_role: '', career_goal: '', intelligence_score: 0, career_dna_archetype: 'explorer',
    xp_total: 0, xp_level: 1, missions_completed: 0, interviews_done: 0, vault_count: 0,
    onboardingStep: 0, resumeGenerated: false, roadmapGenerated: false,
    completedQuests: [], javaTestPassed: false, recruiterVisible: false
};
async function getUserProfile(uid) {
    const snap = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'users', uid));
    return snap.exists() ? snap.data() : null;
}
async function createUserProfile(uid, data) {
    await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'users', uid), { ...exports.EMPTY_PROFILE, ...data, createdAt: (0, firestore_1.serverTimestamp)() });
}
async function updateUserProfile(uid, data) {
    try {
        await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'users', uid), data);
    }
    catch {
        await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'users', uid), { ...exports.EMPTY_PROFILE, ...data, createdAt: (0, firestore_1.serverTimestamp)() });
    }
}
async function ensureSeedData(uid, profile) {
    const missCol = (0, firestore_1.collection)(firebase_1.db, 'users', uid, 'missions');
    const ex = await (0, firestore_1.getDocs)((0, firestore_1.query)(missCol, (0, firestore_1.limit)(1)));
    if (ex.empty) {
        for (const m of exports.DEMO_MISSIONS)
            await (0, firestore_1.addDoc)(missCol, { ...m, uid, createdAt: (0, firestore_1.serverTimestamp)() });
    }
    const notifCol = (0, firestore_1.collection)(firebase_1.db, 'users', uid, 'notifications');
    const exN = await (0, firestore_1.getDocs)((0, firestore_1.query)(notifCol, (0, firestore_1.limit)(1)));
    if (exN.empty) {
        for (const n of exports.DEMO_NOTIFICATIONS)
            await (0, firestore_1.addDoc)(notifCol, { ...n, uid, createdAt: (0, firestore_1.serverTimestamp)() });
    }
    const oppCol = (0, firestore_1.collection)(firebase_1.db, 'opportunities');
    const exO = await (0, firestore_1.getDocs)((0, firestore_1.query)(oppCol, (0, firestore_1.limit)(1)));
    if (exO.empty) {
        for (const o of exports.DEMO_OPPORTUNITIES)
            await (0, firestore_1.addDoc)(oppCol, { ...o, createdAt: (0, firestore_1.serverTimestamp)() });
    }
}
async function getTodayMissions(uid) {
    const today = new Date().toISOString().slice(0, 10);
    const col = (0, firestore_1.collection)(firebase_1.db, 'users', uid, 'missions');
    const snap = await (0, firestore_1.getDocs)((0, firestore_1.query)(col, (0, firestore_1.where)('due_date', '>=', today), (0, firestore_1.orderBy)('due_date')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function getMissionHistory(uid) {
    const snap = await (0, firestore_1.getDocs)((0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, 'users', uid, 'missions'), (0, firestore_1.orderBy)('due_date', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function submitMission(uid, missionId, data) {
    await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'users', uid, 'missions', missionId), { status: 'submitted', proof: data, submittedAt: (0, firestore_1.serverTimestamp)() });
    const missionSnap = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'users', uid, 'missions', missionId));
    const missionData = missionSnap.exists() ? missionSnap.data() : null;
    const missionTitle = missionData?.title || 'Daily Mission';
    const profile = await getUserProfile(uid);
    if (profile) {
        await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'users', uid), { trust_score: Math.min(100, (profile.trust_score || 0) + 8), mission_streak: (profile.mission_streak || 0) + 1, missions_completed: (profile.missions_completed || 0) + 1 });
    }
    try {
        await (0, firestore_1.addDoc)((0, firestore_1.collection)(firebase_1.db, 'users', uid, 'notifications'), {
            type: 'success',
            title: 'Mission Completed!',
            message: `You completed "${missionTitle}" and earned +8 trust points.`,
            source: 'mission',
            read: false,
            is_read: false,
            createdAt: new Date().toISOString()
        });
    }
    catch (err) {
        console.error('Failed to create mission notification:', err);
    }
}
async function getVaultItems(uid) {
    try {
        const { data, error } = await supabaseClient_1.supabase
            .from('vault_items')
            .select('*')
            .eq('user_id', uid)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return (data || []).map(item => ({
            id: item.id,
            title: item.title,
            item_type: item.item_type || 'resume',
            organization_name: item.organization_name || '',
            description: item.description || '',
            verified: !!item.verified,
            ai_confidence_score: item.ai_confidence_score || 0,
            skill_tags: item.skill_tags || [],
            is_public: !!item.is_public
        }));
    }
    catch (err) {
        console.warn('Failed to fetch vault from Supabase, falling back to local storage:', err);
        const snap = await (0, firestore_1.getDocs)((0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, 'users', uid, 'vault'), (0, firestore_1.orderBy)('createdAt', 'desc')));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
}
async function addVaultItem(uid, item) {
    try {
        const { data, error } = await supabaseClient_1.supabase
            .from('vault_items')
            .insert([{
                user_id: uid,
                title: item.title,
                item_type: item.item_type || 'resume',
                organization_name: item.organization_name || '',
                description: item.description || '',
                verified: !!item.verified,
                ai_confidence_score: item.ai_confidence_score || 0,
                skill_tags: item.skill_tags || [],
                is_public: !!item.is_public
            }])
            .select();
        if (error)
            throw error;
        return data?.[0]?.id || `supabase-${Date.now()}`;
    }
    catch (err) {
        console.warn('Failed to write vault to Supabase, falling back to local:', err);
        const ref = await (0, firestore_1.addDoc)((0, firestore_1.collection)(firebase_1.db, 'users', uid, 'vault'), { ...item, uid, createdAt: (0, firestore_1.serverTimestamp)() });
        return ref.id;
    }
}
async function generateResumeFromVault(uid, parsedResume, targetRole) {
    // 1. Update user profile with structured resume and ATS score
    await updateUserProfile(uid, {
        structured_resume: parsedResume,
        ats_score: parsedResume.ats_score || 72,
        resumeGenerated: true,
        weak_areas: parsedResume.keyword_gaps || ["Docker", "CI/CD", "System Design"]
    });
    // 2. Add targeted missions for the gaps
    const missionCol = (0, firestore_1.collection)(firebase_1.db, 'users', uid, 'missions');
    const serverTime = (0, firestore_1.serverTimestamp)();
    const today = new Date().toISOString().slice(0, 10);
    const activeGaps = parsedResume.keyword_gaps || [];
    if (activeGaps.includes('Docker')) {
        await (0, firestore_1.addDoc)(missionCol, {
            title: 'Learn Docker Containerization',
            description: 'ML Resume Builder identified Docker as a gap. Create a Dockerfile to package your Java Solution class, exposing container port 8080.',
            type: 'skill',
            status: 'pending',
            proof_type: 'url',
            due_date: today,
            trust_reward: 15,
            source_weakness: 'Docker',
            estimated_minutes: 30,
            learn_url: 'https://docs.docker.com',
            ai_evaluation: null,
            createdAt: serverTime
        });
    }
    if (activeGaps.includes('CI/CD')) {
        await (0, firestore_1.addDoc)(missionCol, {
            title: 'Automate Java Tests with CI/CD',
            description: 'ML Resume Builder identified CI/CD as a gap. Configure a basic GitHub Actions workflow file (.yml) to build and test your Java project.',
            type: 'skill',
            status: 'pending',
            proof_type: 'url',
            due_date: today,
            trust_reward: 15,
            source_weakness: 'CI/CD',
            estimated_minutes: 30,
            learn_url: 'https://github.com/features/actions',
            ai_evaluation: null,
            createdAt: serverTime
        });
    }
    if (activeGaps.includes('System Design')) {
        await (0, firestore_1.addDoc)(missionCol, {
            title: 'Star Story: Scale microservices',
            description: 'ML Resume Builder identified System Design as a gap. Practice presenting a STAR behavioral response detailing how you split a monolith into microservices.',
            type: 'communication',
            status: 'pending',
            proof_type: 'url',
            due_date: today,
            trust_reward: 12,
            source_weakness: 'System Design',
            estimated_minutes: 25,
            learn_url: null,
            ai_evaluation: null,
            createdAt: serverTime
        });
    }
    // 3. Add targeted missions based on "what you want to be" (Target Role) to train a particular skill
    const role = (targetRole || '').toLowerCase();
    if (role.includes('front') || role.includes('full stack') || role.includes('web')) {
        await (0, firestore_1.addDoc)(missionCol, {
            title: 'Optimize React Rendering Performance',
            description: `Targeting ${targetRole || 'Full Stack'} role: Optimize rendering performance in functional React components using memoization hooks.`,
            type: 'skill',
            status: 'pending',
            proof_type: 'url',
            due_date: today,
            trust_reward: 15,
            source_weakness: 'React performance',
            estimated_minutes: 35,
            learn_url: 'https://react.dev/reference/react/useMemo',
            ai_evaluation: null,
            createdAt: serverTime
        });
    }
    else if (role.includes('data') || role.includes('ml') || role.includes('machine') || role.includes('ai')) {
        await (0, firestore_1.addDoc)(missionCol, {
            title: 'Train ML Model Classifier',
            description: `Targeting ${targetRole || 'ML Engineer'} role: Preprocess dataset features, split training sets, and train a classifier using scikit-learn.`,
            type: 'skill',
            status: 'pending',
            proof_type: 'url',
            due_date: today,
            trust_reward: 15,
            source_weakness: 'Machine Learning',
            estimated_minutes: 40,
            learn_url: 'https://scikit-learn.org',
            ai_evaluation: null,
            createdAt: serverTime
        });
    }
    else if (role.includes('back') || role.includes('system') || role.includes('database')) {
        await (0, firestore_1.addDoc)(missionCol, {
            title: 'Design Database Indexing Strategy',
            description: `Targeting ${targetRole || 'Backend Developer'} role: Build a query optimization schema with cluster indices for transactional database collections.`,
            type: 'skill',
            status: 'pending',
            proof_type: 'url',
            due_date: today,
            trust_reward: 15,
            source_weakness: 'Database indexing',
            estimated_minutes: 30,
            learn_url: 'https://postgresql.org',
            ai_evaluation: null,
            createdAt: serverTime
        });
    }
    // 4. Add notification about gaps & generated quests
    const gapsList = activeGaps.length > 0 ? activeGaps.join(', ') : 'None';
    await (0, firestore_1.addDoc)((0, firestore_1.collection)(firebase_1.db, 'users', uid, 'notifications'), {
        type: 'warning',
        title: 'Vault Resume Compiled',
        message: `ML Resume Builder processed your document. Gaps identified: ${gapsList}. Custom learning quests have been added for your target role: ${targetRole || 'SDE'}.`,
        source: 'mission',
        read: false,
        is_read: false,
        createdAt: new Date().toISOString()
    });
}
async function getNotifications(uid) {
    const snap = await (0, firestore_1.getDocs)((0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, 'users', uid, 'notifications'), (0, firestore_1.orderBy)('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function markAllNotificationsRead(uid) {
    const snap = await (0, firestore_1.getDocs)((0, firestore_1.collection)(firebase_1.db, 'users', uid, 'notifications'));
    for (const d of snap.docs)
        await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'users', uid, 'notifications', d.id), { read: true, is_read: true });
}
async function getOpportunities() {
    const snap = await (0, firestore_1.getDocs)((0, firestore_1.collection)(firebase_1.db, 'opportunities'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function applyToOpportunity(uid, oppId) {
    await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'applications', `${uid}_${oppId}`), { uid, oppId, status: 'applied', appliedAt: (0, firestore_1.serverTimestamp)() });
}
async function recalculateCareerDna(uid) {
    const profile = await getUserProfile(uid);
    if (!profile)
        return null;
    const missions = await getMissionHistory(uid);
    const completed = missions.filter((m) => m.status === 'submitted' || m.status === 'completed').length;
    const newDna = Math.min(100, (profile.career_dna_score || 68) + completed);
    await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'users', uid), { career_dna_score: newDna });
    return { ...profile, career_dna_score: newDna };
}
async function getDashboardAnalytics(uid) {
    const profile = await getUserProfile(uid);
    return { missions: { completed: profile?.missions_completed || 0 }, score_history: [] };
}
async function createInterviewSession(uid, data) {
    const ref = await (0, firestore_1.addDoc)((0, firestore_1.collection)(firebase_1.db, 'users', uid, 'interview_sessions'), { ...data, uid, status: 'active', createdAt: (0, firestore_1.serverTimestamp)() });
    return ref.id;
}
async function getInterviewSession(uid, sessionId) {
    const snap = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'users', uid, 'interview_sessions', sessionId));
    if (!snap.exists())
        return null;
    return { id: snap.id, ...snap.data() };
}
async function appendInterviewTranscript(uid, sessionId, entries) {
    const ref = (0, firestore_1.doc)(firebase_1.db, 'users', uid, 'interview_sessions', sessionId);
    const snap = await (0, firestore_1.getDoc)(ref);
    if (!snap.exists())
        return;
    const existing = snap.data().transcript || [];
    await (0, firestore_1.updateDoc)(ref, { transcript: [...existing, ...entries] });
}
async function completeInterviewSession(uid, sessionId, evaluation) {
    await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'users', uid, 'interview_sessions', sessionId), { status: 'completed', overall_score: evaluation.overall_score, evaluation, completedAt: (0, firestore_1.serverTimestamp)() });
    const profile = await getUserProfile(uid);
    if (profile) {
        const prev = profile.communication_score || 60;
        const next = Math.min(100, Math.round(prev * 0.6 + (evaluation.communication_score || prev) * 0.4));
        await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'users', uid), { communication_score: next, interviews_done: (profile.interviews_done || 0) + 1 });
    }
}
async function getInterviewHistory(uid) {
    const snap = await (0, firestore_1.getDocs)((0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, 'users', uid, 'interview_sessions'), (0, firestore_1.orderBy)('createdAt', 'desc'), (0, firestore_1.limit)(20)));
    return snap.docs.map(d => { const data = d.data(); return { id: d.id, mode: data.mode, status: data.status, overall_score: data.overall_score || 0, started_at: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString() }; });
}
async function getAllUsers() {
    const snap = await (0, firestore_1.getDocs)((0, firestore_1.collection)(firebase_1.db, 'users'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
// ── Recruiter Job Posting helper functions ──
async function addJob(recruiterId, jobData) {
    const ref = await (0, firestore_1.addDoc)((0, firestore_1.collection)(firebase_1.db, 'jobs'), {
        ...jobData,
        recruiter_id: recruiterId,
        is_deleted: false,
        createdAt: (0, firestore_1.serverTimestamp)(),
    });
    return ref.id;
}
async function updateJob(jobId, jobData) {
    await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'jobs', jobId), jobData);
}
async function deleteJob(jobId) {
    await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'jobs', jobId), { is_deleted: true });
}
async function getJobs(recruiterId) {
    const q = recruiterId
        ? (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, 'jobs'), (0, firestore_1.where)('recruiter_id', '==', recruiterId), (0, firestore_1.where)('is_deleted', '==', false))
        : (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, 'jobs'), (0, firestore_1.where)('is_deleted', '==', false));
    const snap = await (0, firestore_1.getDocs)(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
// ── Recruiter Job Applications helpers ──
async function getApplicationsForRecruiter(recruiterId) {
    const recruiterJobs = await getJobs(recruiterId);
    const jobIds = recruiterJobs.map(j => j.id);
    if (jobIds.length === 0)
        return [];
    const snap = await (0, firestore_1.getDocs)((0, firestore_1.collection)(firebase_1.db, 'applications'));
    const allApps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const filtered = allApps.filter((a) => jobIds.includes(a.oppId));
    const resolved = [];
    for (const app of filtered) {
        const uProfile = await getUserProfile(app.uid);
        const matchedJob = recruiterJobs.find(j => j.id === app.oppId);
        resolved.push({
            ...app,
            jobTitle: matchedJob ? matchedJob.title : 'Unknown Job',
            jobCompany: matchedJob ? matchedJob.company : 'Unknown Company',
            user: uProfile ? {
                full_name: uProfile.displayName || uProfile.username || 'Student',
                email: uProfile.email || '',
                phone: uProfile.phone || '',
                ats_score: uProfile.ats_score || 50,
                trust_score: uProfile.trust_score || 50,
                career_dna_score: uProfile.career_dna_score || 50
            } : null
        });
    }
    return resolved;
}
async function updateApplicationStatus(appId, status) {
    // Check if document exists first, if not create it
    const ref = (0, firestore_1.doc)(firebase_1.db, 'applications', appId);
    const snap = await (0, firestore_1.getDoc)(ref);
    if (snap.exists()) {
        await (0, firestore_1.updateDoc)(ref, { status, updatedAt: (0, firestore_1.serverTimestamp)() });
    }
    else {
        // If it was a mock ID or composite key, create it
        const parts = appId.split('_');
        const uid = parts[0] || 'unknown';
        const oppId = parts[1] || 'unknown';
        await (0, firestore_1.setDoc)(ref, { uid, oppId, status, appliedAt: (0, firestore_1.serverTimestamp)() });
    }
}
// ── Consultant Document/Vault Verification helpers ──
async function verifyVaultItem(studentId, itemId, status) {
    await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'users', studentId, 'vault', itemId), {
        status,
        verified: status === 'verified',
        verifiedAt: (0, firestore_1.serverTimestamp)(),
    });
    // Increment student trust score on verification
    const profile = await getUserProfile(studentId);
    if (profile && status === 'verified') {
        const current = profile.trust_score || 40;
        await updateUserProfile(studentId, { trust_score: Math.min(100, current + 5) });
    }
}
// ── Consultant 1:1 Sessions helpers ──
async function scheduleSession(sessionData) {
    const ref = await (0, firestore_1.addDoc)((0, firestore_1.collection)(firebase_1.db, 'sessions'), {
        ...sessionData,
        createdAt: (0, firestore_1.serverTimestamp)(),
    });
    // Send notification to the student
    if (sessionData.studentId) {
        await (0, firestore_1.addDoc)((0, firestore_1.collection)(firebase_1.db, 'users', sessionData.studentId, 'notifications'), {
            type: 'info',
            title: 'New 1:1 Session Scheduled',
            message: `Consultant scheduled a session: "${sessionData.title}" on ${sessionData.date} at ${sessionData.time}.`,
            read: false,
            is_read: false,
            createdAt: new Date().toISOString(),
        });
    }
    return ref.id;
}
async function getSessions(consultantId, studentId) {
    let q = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, 'sessions'));
    const snap = await (0, firestore_1.getDocs)(q);
    const allSessions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (consultantId) {
        return allSessions.filter((s) => s.consultantId === consultantId);
    }
    else if (studentId) {
        return allSessions.filter((s) => s.studentId === studentId);
    }
    return allSessions;
}
// ── Admin Audit Log helpers ──
async function addAuditEntry(adminId, action, targetId, meta) {
    await (0, firestore_1.addDoc)((0, firestore_1.collection)(firebase_1.db, 'audit_logs'), {
        adminId,
        action,
        targetId,
        meta,
        timestamp: new Date().toISOString()
    });
}
async function getAuditLogs() {
    try {
        const snap = await (0, firestore_1.getDocs)((0, firestore_1.collection)(firebase_1.db, 'audit_logs'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    catch {
        return [];
    }
}
async function sendBroadcastNotification(senderId, title, message, type, targetRole) {
    const users = await getAllUsers();
    const targets = targetRole ? users.filter(u => u.role === targetRole) : users;
    for (const target of targets) {
        await (0, firestore_1.addDoc)((0, firestore_1.collection)(firebase_1.db, 'users', target.id, 'notifications'), {
            type: type || 'info',
            title: title || 'Broadcast Announcement',
            message: message || '',
            read: false,
            is_read: false,
            createdAt: new Date().toISOString()
        });
    }
    await addAuditEntry(senderId, 'broadcast', 'all', { title, message, type, targetRole });
    return targets.length;
}
async function generateCustomSkillQuests(uid, targetRole, skill) {
    const missionCol = (0, firestore_1.collection)(firebase_1.db, 'users', uid, 'missions');
    const serverTime = (0, firestore_1.serverTimestamp)();
    const today = new Date().toISOString().slice(0, 10);
    // Generate 2 structured learning missions/quests for the selected skill
    await (0, firestore_1.addDoc)(missionCol, {
        title: `Master ${skill} Core Concepts`,
        description: `Targeting ${targetRole || 'Software Engineer'} role: Explain the core pillars, design patterns, and optimization practices of ${skill} in a socratic discussion.`,
        type: 'theory',
        status: 'pending',
        proof_type: 'url',
        due_date: today,
        trust_reward: 12,
        source_weakness: skill,
        estimated_minutes: 20,
        learn_url: `https://google.com/search?q=${encodeURIComponent(skill + ' guide')}`,
        ai_evaluation: null,
        createdAt: serverTime
    });
    await (0, firestore_1.addDoc)(missionCol, {
        title: `Build and Deploy ${skill} Sandbox`,
        description: `Targeting ${targetRole || 'Software Engineer'} role: Create a local sandbox repository using ${skill}, compile a working demo, and link your code repository.`,
        type: 'skill',
        status: 'pending',
        proof_type: 'url',
        due_date: today,
        trust_reward: 18,
        source_weakness: skill,
        estimated_minutes: 45,
        learn_url: null,
        ai_evaluation: null,
        createdAt: serverTime
    });
    // Add notification
    await (0, firestore_1.addDoc)((0, firestore_1.collection)(firebase_1.db, 'users', uid, 'notifications'), {
        type: 'success',
        title: 'Training Modules Generated',
        message: `We generated custom learning quest modules for ${skill} to help you qualify for the ${targetRole || 'SDE'} benchmarks!`,
        source: 'mission',
        read: false,
        is_read: false,
        createdAt: new Date().toISOString()
    });
}
