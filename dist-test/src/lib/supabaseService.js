"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMPTY_PROFILE = exports.DEMO_NOTIFICATIONS = exports.DEMO_OPPORTUNITIES = exports.DEMO_MISSIONS = exports.DEMO_PROFILE = void 0;
exports.mapRowToProfile = mapRowToProfile;
exports.mapProfileToRow = mapProfileToRow;
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
// Supabase service — complete implementation mapping Firestore logic to PostgreSQL
const supabaseClient_1 = require("./supabaseClient");
exports.DEMO_PROFILE = {
    display_name: 'Ashwanth Kumar',
    role: 'student',
    register_number: 'REG2024001',
    ats_score: 72,
    career_dna_score: 68,
    trust_score: 81,
    mission_streak: 7,
    recruiter_visibility: 65,
    career_readiness: 74,
    communication_score: 76,
    execution_score: 71,
    leadership_score: 58,
    consistency_score: 83,
    adaptability_score: 69,
    confidence_score: 72,
    innovation_score: 65,
    weak_areas: ['System Design', 'DSA - Trees', 'Behavioral STAR'],
    skill_tags: ['React', 'Node.js', 'Python', 'Machine Learning', 'TypeScript'],
    certifications: ['AWS Cloud Practitioner', 'Google Data Analytics'],
    target_role: 'Full Stack Engineer',
    career_goal: 'Land at a top product company',
    intelligence_score: 78,
    career_dna_archetype: 'builder',
    xp_total: 2500,
    xp_level: 2,
    missions_completed: 18,
    interviews_done: 6,
    vault_count: 3,
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
    { type: 'success', title: 'Mission Completed!', message: 'You completed "LinkedIn Post" and earned +8 trust points.', source: 'mission', is_read: false, created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
    { type: 'info', title: 'New Opportunity Match', message: 'Razorpay React Developer — 91% match for your profile.', source: 'opportunities', is_read: false, created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
    { type: 'warning', title: 'Career DNA Update', message: 'Your DSA score dropped. Complete 2 algorithm missions to recover.', source: 'exam', is_read: true, created_at: new Date(Date.now() - 86400000).toISOString() },
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
    completedQuests: [], javaTestPassed: false, recruiterVisible: false, pins: 100, pinHistory: []
};
// Map database snake_case keys back to camelCase frontend schema properties
function mapRowToProfile(row) {
    if (!row)
        return null;
    return {
        id: row.id,
        displayName: row.display_name || '',
        role: row.role || 'student',
        registerNumber: row.register_number || null,
        selectedTeacherId: row.selected_teacher_id || 'priya',
        ats_score: row.ats_score ?? 0,
        career_dna_score: row.career_dna_score ?? 0,
        trust_score: row.trust_score ?? 40,
        mission_streak: row.mission_streak ?? 0,
        recruiter_visibility: row.recruiter_visibility ?? 0,
        career_readiness: row.career_readiness ?? 0,
        communication_score: row.communication_score ?? 60,
        execution_score: row.execution_score ?? 60,
        leadership_score: row.leadership_score ?? 60,
        consistency_score: row.consistency_score ?? 60,
        adaptability_score: row.adaptability_score ?? 60,
        confidence_score: row.confidence_score ?? 60,
        innovation_score: row.innovation_score ?? 60,
        intelligence_score: row.intelligence_score ?? 0,
        weak_areas: row.weak_areas || [],
        skill_tags: row.skill_tags || [],
        certifications: row.certifications || [],
        target_role: row.target_role || '',
        career_goal: row.career_goal || '',
        career_dna_archetype: row.career_dna_archetype || 'explorer',
        xp_total: row.xp_total ?? 0,
        xp_level: row.xp_level ?? 1,
        missions_completed: row.missions_completed ?? 0,
        interviews_done: row.interviews_done ?? 0,
        vault_count: row.vault_count ?? 0,
        onboardingStep: row.onboarding_step ?? 0,
        onboardingAnswers: row.onboarding_answers || { role: '', education: '', skills: '', experience: '', hasCompleted: false },
        jdMissingSkills: row.jd_missing_skills || [],
        structured_resume: row.structured_resume || null,
        pins: row.pins ?? 100,
        pinHistory: row.pin_history || [],
        resumeGenerated: !!row.resume_generated,
        roadmapGenerated: !!row.roadmap_generated,
        completedQuests: row.completed_quests || [],
        javaTestPassed: !!row.java_test_passed,
        recruiterVisible: !!row.recruiter_visible,
        forceShowCareerBuilder: !!row.force_show_career_builder,
        demoTabsUnlocked: !!row.demo_tabs_unlocked,
        status: row.onboarding_answers?.status || 'onboarding',
        visa_status: row.onboarding_answers?.visa_status || 'not_started',
        targetCountry: row.onboarding_answers?.targetCountry || 'USA',
        programType: row.onboarding_answers?.programType || 'Masters',
        tasks: row.onboarding_answers?.tasks || [],
        documents: row.onboarding_answers?.documents || [],
    };
}
// Map frontend profile camelCase properties back to snake_case database schema
function mapProfileToRow(profile) {
    if (!profile)
        return null;
    const row = {};
    if (profile.displayName !== undefined)
        row.display_name = profile.displayName;
    if (profile.role !== undefined)
        row.role = profile.role;
    if (profile.registerNumber !== undefined)
        row.register_number = profile.registerNumber;
    if (profile.selectedTeacherId !== undefined)
        row.selected_teacher_id = profile.selectedTeacherId;
    if (profile.ats_score !== undefined)
        row.ats_score = profile.ats_score;
    if (profile.career_dna_score !== undefined)
        row.career_dna_score = profile.career_dna_score;
    if (profile.trust_score !== undefined)
        row.trust_score = profile.trust_score;
    if (profile.mission_streak !== undefined)
        row.mission_streak = profile.mission_streak;
    if (profile.recruiter_visibility !== undefined)
        row.recruiter_visibility = profile.recruiter_visibility;
    if (profile.career_readiness !== undefined)
        row.career_readiness = profile.career_readiness;
    if (profile.communication_score !== undefined)
        row.communication_score = profile.communication_score;
    if (profile.execution_score !== undefined)
        row.execution_score = profile.execution_score;
    if (profile.leadership_score !== undefined)
        row.leadership_score = profile.leadership_score;
    if (profile.consistency_score !== undefined)
        row.consistency_score = profile.consistency_score;
    if (profile.adaptability_score !== undefined)
        row.adaptability_score = profile.adaptability_score;
    if (profile.confidence_score !== undefined)
        row.confidence_score = profile.confidence_score;
    if (profile.innovation_score !== undefined)
        row.innovation_score = profile.innovation_score;
    if (profile.intelligence_score !== undefined)
        row.intelligence_score = profile.intelligence_score;
    if (profile.weak_areas !== undefined)
        row.weak_areas = profile.weak_areas;
    if (profile.skill_tags !== undefined)
        row.skill_tags = profile.skill_tags;
    if (profile.certifications !== undefined)
        row.certifications = profile.certifications;
    if (profile.target_role !== undefined)
        row.target_role = profile.target_role;
    if (profile.career_goal !== undefined)
        row.career_goal = profile.career_goal;
    if (profile.career_dna_archetype !== undefined)
        row.career_dna_archetype = profile.career_dna_archetype;
    if (profile.xp_total !== undefined)
        row.xp_total = profile.xp_total;
    if (profile.xp_level !== undefined)
        row.xp_level = profile.xp_level;
    if (profile.missions_completed !== undefined)
        row.missions_completed = profile.missions_completed;
    if (profile.interviews_done !== undefined)
        row.interviews_done = profile.interviews_done;
    if (profile.vault_count !== undefined)
        row.vault_count = profile.vault_count;
    if (profile.onboardingStep !== undefined)
        row.onboarding_step = profile.onboardingStep;
    if (profile.onboardingAnswers !== undefined)
        row.onboarding_answers = profile.onboardingAnswers;
    if (profile.jdMissingSkills !== undefined)
        row.jd_missing_skills = profile.jdMissingSkills;
    if (profile.structured_resume !== undefined)
        row.structured_resume = profile.structured_resume;
    if (profile.pins !== undefined)
        row.pins = profile.pins;
    if (profile.pinHistory !== undefined)
        row.pin_history = profile.pinHistory;
    if (profile.resumeGenerated !== undefined)
        row.resume_generated = profile.resumeGenerated;
    if (profile.roadmapGenerated !== undefined)
        row.roadmap_generated = profile.roadmapGenerated;
    if (profile.completedQuests !== undefined)
        row.completed_quests = profile.completedQuests;
    if (profile.javaTestPassed !== undefined)
        row.java_test_passed = profile.javaTestPassed;
    if (profile.recruiterVisible !== undefined)
        row.recruiter_visible = profile.recruiterVisible;
    if (profile.forceShowCareerBuilder !== undefined)
        row.force_show_career_builder = profile.forceShowCareerBuilder;
    if (profile.demoTabsUnlocked !== undefined)
        row.demo_tabs_unlocked = profile.demoTabsUnlocked;
    return row;
}
async function getUserProfile(uid) {
    const { data, error } = await supabaseClient_1.supabase.from('users').select('*').eq('id', uid).maybeSingle();
    if (error)
        throw error;
    return data ? mapRowToProfile(data) : null;
}
async function createUserProfile(uid, data) {
    const answersUpdate = {};
    if (data.status !== undefined)
        answersUpdate.status = data.status;
    if (data.visa_status !== undefined)
        answersUpdate.visa_status = data.visa_status;
    if (data.targetCountry !== undefined)
        answersUpdate.targetCountry = data.targetCountry;
    if (data.programType !== undefined)
        answersUpdate.programType = data.programType;
    if (data.tasks !== undefined)
        answersUpdate.tasks = data.tasks;
    if (data.documents !== undefined)
        answersUpdate.documents = data.documents;
    const mappedData = mapProfileToRow({ ...exports.EMPTY_PROFILE, ...data });
    const row = {
        id: uid,
        ...mappedData,
    };
    if (Object.keys(answersUpdate).length > 0) {
        row.onboarding_answers = {
            ...(row.onboarding_answers || {}),
            ...answersUpdate
        };
    }
    const { error } = await supabaseClient_1.supabase.from('users').upsert(row);
    if (error)
        throw error;
}
async function updateUserProfile(uid, data) {
    const answersUpdate = {};
    if (data.status !== undefined)
        answersUpdate.status = data.status;
    if (data.visa_status !== undefined)
        answersUpdate.visa_status = data.visa_status;
    if (data.targetCountry !== undefined)
        answersUpdate.targetCountry = data.targetCountry;
    if (data.programType !== undefined)
        answersUpdate.programType = data.programType;
    if (data.tasks !== undefined)
        answersUpdate.tasks = data.tasks;
    if (data.documents !== undefined)
        answersUpdate.documents = data.documents;
    let currentAnswers = {};
    try {
        const { data: current } = await supabaseClient_1.supabase.from('users').select('onboarding_answers').eq('id', uid).maybeSingle();
        if (current?.onboarding_answers) {
            currentAnswers = current.onboarding_answers;
        }
    }
    catch (e) {
        console.warn('Failed to load current onboarding_answers for merge:', e);
    }
    const row = mapProfileToRow(data);
    if (Object.keys(answersUpdate).length > 0) {
        row.onboarding_answers = {
            ...currentAnswers,
            ...answersUpdate
        };
    }
    const { error } = await supabaseClient_1.supabase.from('users').update(row).eq('id', uid);
    if (error) {
        // If update fails due to user profile not existing, attempt to create it
        await createUserProfile(uid, data);
    }
}
async function ensureSeedData(uid, profile) {
    const emailLower = (profile?.email || '').toLowerCase();
    const isDemo = emailLower === 'admin@pinit.in' || emailLower === 'rec@pinit.in' || emailLower === 'con@pinit.in';
    if (isDemo) {
        // 1. Seed missions
        const { count: missionCount, error: mErr } = await supabaseClient_1.supabase.from('missions').select('*', { count: 'exact', head: true }).eq('user_id', uid);
        if (!mErr && missionCount === 0) {
            const rows = exports.DEMO_MISSIONS.map(m => ({
                user_id: uid,
                title: m.title,
                description: m.description,
                type: m.type,
                status: m.status,
                proof_type: m.proof_type,
                due_date: m.due_date,
                trust_reward: m.trust_reward,
                source_weakness: m.source_weakness,
                estimated_minutes: m.estimated_minutes,
                learn_url: m.learn_url,
            }));
            await supabaseClient_1.supabase.from('missions').insert(rows);
        }
        // 2. Seed notifications
        const { count: notifCount, error: nErr } = await supabaseClient_1.supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', uid);
        if (!nErr && notifCount === 0) {
            const rows = exports.DEMO_NOTIFICATIONS.map(n => ({
                user_id: uid,
                type: n.type,
                title: n.title,
                message: n.message,
                source: n.source,
                is_read: n.is_read,
                created_at: n.created_at,
            }));
            await supabaseClient_1.supabase.from('notifications').insert(rows);
        }
    }
    // 3. Seed opportunities (shared globally)
    const { count: oppCount, error: oErr } = await supabaseClient_1.supabase.from('opportunities').select('*', { count: 'exact', head: true });
    if (!oErr && oppCount === 0) {
        const rows = exports.DEMO_OPPORTUNITIES.map(o => ({
            title: o.title,
            company: o.company,
            location: o.location,
            type: o.type,
            salary: o.salary,
            match_score: o.match_score,
            skills: o.skills,
            posted_at: o.posted_at,
            description: o.description,
        }));
        await supabaseClient_1.supabase.from('opportunities').insert(rows);
    }
}
async function getTodayMissions(uid) {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabaseClient_1.supabase
        .from('missions')
        .select('*')
        .eq('user_id', uid)
        .gte('due_date', today)
        .order('due_date', { ascending: true });
    if (error)
        throw error;
    return data || [];
}
async function getMissionHistory(uid) {
    const { data, error } = await supabaseClient_1.supabase
        .from('missions')
        .select('*')
        .eq('user_id', uid)
        .order('due_date', { ascending: false });
    if (error)
        throw error;
    return data || [];
}
async function submitMission(uid, missionId, data) {
    const { error } = await supabaseClient_1.supabase
        .from('missions')
        .update({ status: 'submitted', proof: data, submitted_at: new Date().toISOString() })
        .eq('id', missionId)
        .eq('user_id', uid);
    if (error)
        throw error;
    const { data: mission } = await supabaseClient_1.supabase.from('missions').select('title').eq('id', missionId).maybeSingle();
    const title = mission?.title || 'Daily Mission';
    const profile = await getUserProfile(uid);
    if (profile) {
        await updateUserProfile(uid, {
            trust_score: Math.min(100, (profile.trust_score || 0) + 8),
            mission_streak: (profile.mission_streak || 0) + 1,
            missions_completed: (profile.missions_completed || 0) + 1,
        });
    }
    await supabaseClient_1.supabase.from('notifications').insert({
        user_id: uid,
        type: 'success',
        title: 'Mission Completed!',
        message: `You completed "${title}" and earned +8 trust points.`,
        source: 'mission',
        is_read: false,
    });
}
async function getVaultItems(uid) {
    const { data, error } = await supabaseClient_1.supabase
        .from('vault_items')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data || [];
}
async function addVaultItem(uid, item) {
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
            is_public: !!item.is_public,
            used_in_resume: !!item.used_in_resume,
            used_in_portfolio: !!item.used_in_portfolio,
        }])
        .select();
    if (error)
        throw error;
    return data?.[0]?.id || `supabase-${Date.now()}`;
}
async function generateResumeFromVault(uid, parsedResume, targetRole) {
    await updateUserProfile(uid, {
        structured_resume: parsedResume,
        ats_score: parsedResume.ats_score || 72,
        resumeGenerated: true,
        weak_areas: parsedResume.keyword_gaps || ["Docker", "CI/CD", "System Design"],
    });
    const activeGaps = parsedResume.keyword_gaps || [];
    const today = new Date().toISOString().slice(0, 10);
    const newMissions = [];
    if (activeGaps.includes('Docker')) {
        newMissions.push({
            user_id: uid,
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
        });
    }
    if (activeGaps.includes('CI/CD')) {
        newMissions.push({
            user_id: uid,
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
        });
    }
    if (activeGaps.includes('System Design')) {
        newMissions.push({
            user_id: uid,
            title: 'Star Story: Scale microservices',
            description: 'ML Resume Builder identified System Design as a gap. Practice presenting a STAR behavioral response detailing how you split a monolith into microservices.',
            type: 'communication',
            status: 'pending',
            proof_type: 'url',
            due_date: today,
            trust_reward: 12,
            source_weakness: 'System Design',
            estimated_minutes: 25,
        });
    }
    const role = (targetRole || '').toLowerCase();
    if (role.includes('front') || role.includes('full stack') || role.includes('web')) {
        newMissions.push({
            user_id: uid,
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
        });
    }
    else if (role.includes('data') || role.includes('ml') || role.includes('machine') || role.includes('ai')) {
        newMissions.push({
            user_id: uid,
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
        });
    }
    else if (role.includes('back') || role.includes('system') || role.includes('database')) {
        newMissions.push({
            user_id: uid,
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
        });
    }
    if (newMissions.length > 0) {
        await supabaseClient_1.supabase.from('missions').insert(newMissions);
    }
    const gapsList = activeGaps.length > 0 ? activeGaps.join(', ') : 'None';
    await supabaseClient_1.supabase.from('notifications').insert({
        user_id: uid,
        type: 'warning',
        title: 'Vault Resume Compiled',
        message: `ML Resume Builder processed your document. Gaps identified: ${gapsList}. Custom learning quests have been added for your target role: ${targetRole || 'SDE'}.`,
        source: 'mission',
        is_read: false,
    });
}
async function getNotifications(uid) {
    const { data, error } = await supabaseClient_1.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data || [];
}
async function markAllNotificationsRead(uid) {
    const { error } = await supabaseClient_1.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', uid);
    if (error)
        throw error;
}
async function getOpportunities() {
    const { data, error } = await supabaseClient_1.supabase.from('opportunities').select('*');
    if (error)
        throw error;
    return data || [];
}
async function applyToOpportunity(uid, oppId) {
    const { error } = await supabaseClient_1.supabase
        .from('applications')
        .upsert({
        id: `${uid}_${oppId}`,
        user_id: uid,
        opportunity_id: oppId,
        status: 'applied',
        applied_at: new Date().toISOString(),
    });
    if (error)
        throw error;
}
async function recalculateCareerDna(uid) {
    const profile = await getUserProfile(uid);
    if (!profile)
        return null;
    const { data: missions } = await supabaseClient_1.supabase.from('missions').select('status').eq('user_id', uid);
    const completed = (missions || []).filter((m) => m.status === 'submitted' || m.status === 'completed').length;
    const newDna = Math.min(100, (profile.career_dna_score || 68) + completed);
    await updateUserProfile(uid, { career_dna_score: newDna });
    return { ...profile, career_dna_score: newDna };
}
async function getDashboardAnalytics(uid) {
    const profile = await getUserProfile(uid);
    return { missions: { completed: profile?.missions_completed || 0 }, score_history: [] };
}
async function createInterviewSession(uid, data) {
    const { data: inserted, error } = await supabaseClient_1.supabase
        .from('interview_sessions')
        .insert([{
            user_id: uid,
            mode: data.mode || 'hr',
            domain: data.domain || null,
            pressure_mode: data.pressureMode || 'normal',
            persona: data.persona || 'professional',
            status: 'active',
            overall_score: 0,
            transcript: data.transcript || [],
        }])
        .select();
    if (error)
        throw error;
    return inserted?.[0]?.id;
}
async function getInterviewSession(uid, sessionId) {
    const { data, error } = await supabaseClient_1.supabase
        .from('interview_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', uid)
        .maybeSingle();
    if (error)
        throw error;
    return data;
}
async function appendInterviewTranscript(uid, sessionId, entries) {
    const session = await getInterviewSession(uid, sessionId);
    if (!session)
        return;
    const existing = Array.isArray(session.transcript) ? session.transcript : [];
    const { error } = await supabaseClient_1.supabase
        .from('interview_sessions')
        .update({ transcript: [...existing, ...entries] })
        .eq('id', sessionId)
        .eq('user_id', uid);
    if (error)
        throw error;
}
async function completeInterviewSession(uid, sessionId, evaluation) {
    const { error } = await supabaseClient_1.supabase
        .from('interview_sessions')
        .update({
        status: 'completed',
        overall_score: evaluation.overall_score || 0,
        evaluation,
        completed_at: new Date().toISOString(),
    })
        .eq('id', sessionId)
        .eq('user_id', uid);
    if (error)
        throw error;
    const profile = await getUserProfile(uid);
    if (profile) {
        const prev = profile.communication_score || 60;
        const next = Math.min(100, Math.round(prev * 0.6 + (evaluation.communication_score || prev) * 0.4));
        await updateUserProfile(uid, {
            communication_score: next,
            interviews_done: (profile.interviews_done || 0) + 1,
        });
    }
}
async function getInterviewHistory(uid) {
    const { data, error } = await supabaseClient_1.supabase
        .from('interview_sessions')
        .select('id, mode, status, overall_score, created_at')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(20);
    if (error)
        throw error;
    return (data || []).map(d => ({
        id: d.id,
        mode: d.mode,
        status: d.status,
        overall_score: d.overall_score || 0,
        started_at: d.created_at,
    }));
}
async function getAllUsers() {
    const { data, error } = await supabaseClient_1.supabase.from('users').select('*');
    if (error)
        throw error;
    return (data || []).map(d => mapRowToProfile(d));
}
async function addJob(recruiterId, jobData) {
    const { data, error } = await supabaseClient_1.supabase
        .from('jobs')
        .insert([{
            recruiter_id: recruiterId,
            title: jobData.title,
            company: jobData.company || '',
            location: jobData.location || '',
            type: jobData.type || 'Full-time',
            salary: jobData.salary || '',
            description: jobData.description || '',
            skills: jobData.skills || [],
            is_deleted: false,
        }])
        .select();
    if (error)
        throw error;
    return data?.[0]?.id;
}
async function updateJob(jobId, jobData) {
    const { error } = await supabaseClient_1.supabase.from('jobs').update(jobData).eq('id', jobId);
    if (error)
        throw error;
}
async function deleteJob(jobId) {
    const { error } = await supabaseClient_1.supabase.from('jobs').update({ is_deleted: true }).eq('id', jobId);
    if (error)
        throw error;
}
async function getJobs(recruiterId) {
    let query = supabaseClient_1.supabase.from('jobs').select('*').eq('is_deleted', false);
    if (recruiterId) {
        query = query.eq('recruiter_id', recruiterId);
    }
    const { data, error } = await query;
    if (error)
        throw error;
    return data || [];
}
async function getApplicationsForRecruiter(recruiterId) {
    const recruiterJobs = await getJobs(recruiterId);
    const jobIds = recruiterJobs.map(j => j.id);
    if (jobIds.length === 0)
        return [];
    const { data: apps, error } = await supabaseClient_1.supabase.from('applications').select('*');
    if (error)
        throw error;
    const filtered = (apps || []).filter((a) => jobIds.includes(a.opportunity_id));
    const resolved = [];
    for (const app of filtered) {
        const uProfile = await getUserProfile(app.user_id);
        const matchedJob = recruiterJobs.find(j => j.id === app.opportunity_id);
        resolved.push({
            id: app.id,
            uid: app.user_id,
            oppId: app.opportunity_id,
            status: app.status,
            appliedAt: app.applied_at,
            jobTitle: matchedJob ? matchedJob.title : 'Unknown Job',
            jobCompany: matchedJob ? matchedJob.company : 'Unknown Company',
            user: uProfile ? {
                full_name: uProfile.displayName || 'Student',
                email: uProfile.email || '',
                phone: uProfile.phone || '',
                ats_score: uProfile.ats_score || 50,
                trust_score: uProfile.trust_score || 50,
                career_dna_score: uProfile.career_dna_score || 50,
            } : null,
        });
    }
    return resolved;
}
async function updateApplicationStatus(appId, status) {
    const { error } = await supabaseClient_1.supabase
        .from('applications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', appId);
    if (error) {
        const parts = appId.split('_');
        const uid = parts[0] || 'unknown';
        const oppId = parts[1] || 'unknown';
        await supabaseClient_1.supabase.from('applications').upsert({
            id: appId,
            user_id: uid,
            opportunity_id: oppId,
            status,
            applied_at: new Date().toISOString(),
        });
    }
}
async function verifyVaultItem(studentId, itemId, status) {
    const { error } = await supabaseClient_1.supabase
        .from('vault_items')
        .update({ verified: status === 'verified' })
        .eq('id', itemId)
        .eq('user_id', studentId);
    if (error)
        throw error;
    const profile = await getUserProfile(studentId);
    if (profile && status === 'verified') {
        const current = profile.trust_score || 40;
        await updateUserProfile(studentId, { trust_score: Math.min(100, current + 5) });
    }
}
async function scheduleSession(sessionData) {
    const { data, error } = await supabaseClient_1.supabase
        .from('sessions')
        .insert([{
            consultant_id: sessionData.consultantId,
            student_id: sessionData.studentId,
            title: sessionData.title,
            date: sessionData.date,
            time: sessionData.time,
        }])
        .select();
    if (error)
        throw error;
    if (sessionData.studentId) {
        await supabaseClient_1.supabase.from('notifications').insert({
            user_id: sessionData.studentId,
            type: 'info',
            title: 'New 1:1 Session Scheduled',
            message: `Consultant scheduled a session: "${sessionData.title}" on ${sessionData.date} at ${sessionData.time}.`,
            is_read: false,
        });
    }
    return data?.[0]?.id;
}
async function getSessions(consultantId, studentId) {
    let query = supabaseClient_1.supabase.from('sessions').select('*');
    if (consultantId) {
        query = query.eq('consultant_id', consultantId);
    }
    else if (studentId) {
        query = query.eq('student_id', studentId);
    }
    const { data, error } = await query;
    if (error)
        throw error;
    return data || [];
}
async function addAuditEntry(adminId, action, targetId, meta) {
    const { error } = await supabaseClient_1.supabase.from('audit_logs').insert({
        admin_id: adminId,
        action,
        target_id: targetId,
        meta,
    });
    if (error)
        throw error;
}
async function getAuditLogs() {
    const { data, error } = await supabaseClient_1.supabase.from('audit_logs').select('*');
    if (error)
        return [];
    return data || [];
}
async function sendBroadcastNotification(senderId, title, message, type, targetRole) {
    const users = await getAllUsers();
    const targets = targetRole ? users.filter(u => u.role === targetRole) : users;
    const rows = targets.map(t => ({
        user_id: t.id,
        type: type || 'info',
        title: title || 'Broadcast Announcement',
        message: message || '',
        is_read: false,
    }));
    if (rows.length > 0) {
        await supabaseClient_1.supabase.from('notifications').insert(rows);
    }
    await addAuditEntry(senderId, 'broadcast', 'all', { title, message, type, targetRole });
    return targets.length;
}
async function generateCustomSkillQuests(uid, targetRole, skill) {
    const today = new Date().toISOString().slice(0, 10);
    const rows = [
        {
            user_id: uid,
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
        },
        {
            user_id: uid,
            title: `Build and Deploy ${skill} Sandbox`,
            description: `Targeting ${targetRole || 'Software Engineer'} role: Create a local sandbox repository using ${skill}, compile a working demo, and link your code repository.`,
            type: 'skill',
            status: 'pending',
            proof_type: 'url',
            due_date: today,
            trust_reward: 18,
            source_weakness: skill,
            estimated_minutes: 45,
        }
    ];
    await supabaseClient_1.supabase.from('missions').insert(rows);
    await supabaseClient_1.supabase.from('notifications').insert({
        user_id: uid,
        type: 'success',
        title: 'Training Modules Generated',
        message: `We generated custom learning quest modules for ${skill} to help you qualify for the ${targetRole || 'SDE'} benchmarks!`,
        source: 'mission',
        is_read: false,
    });
}
