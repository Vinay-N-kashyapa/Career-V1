// Firestore service — complete implementation (from Document 9)
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, addDoc, serverTimestamp, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { supabase } from './supabaseClient';

export const DEMO_PROFILE = {
  displayName:'Ashwanth Kumar', role:'student', registerNumber:'REG2024001',
  ats_score:72, career_dna_score:68, trust_score:81, mission_streak:7,
  recruiter_visibility:65, career_readiness:74, communication_score:76,
  execution_score:71, leadership_score:58, consistency_score:83, adaptability_score:69,
  confidence_score:72, innovation_score:65,
  weak_areas:['System Design','DSA - Trees','Behavioral STAR'],
  skill_tags:['React','Node.js','Python','Machine Learning','TypeScript'],
  certifications:['AWS Cloud Practitioner','Google Data Analytics'],
  target_role:'Full Stack Engineer', career_goal:'Land at a top product company',
  intelligence_score:78, career_dna_archetype:'builder',
  xp_total:2500, xp_level:2, missions_completed:18, interviews_done:6, vault_count:3,
};

export const DEMO_MISSIONS = [
  { title:'LinkedIn Post: Tech Insight', description:'Write a 200-word LinkedIn post sharing a technical insight. Use STAR format and include one specific metric.', type:'communication', status:'pending', proof_type:'url', due_date:new Date().toISOString().slice(0,10), trust_reward:8, source_weakness:'Communication', estimated_minutes:20, learn_url:'https://linkedin.com', ai_evaluation:null },
  { title:'LeetCode: Binary Tree Problem', description:'Solve any medium-difficulty binary tree problem. Share your solution with time/space complexity analysis.', type:'skill', status:'pending', proof_type:'url', due_date:new Date().toISOString().slice(0,10), trust_reward:12, source_weakness:'DSA - Trees', estimated_minutes:45, learn_url:'https://leetcode.com', ai_evaluation:null },
  { title:'STAR Story Practice', description:'Record a 90-second video answering "Tell me about a time you solved a complex problem under pressure."', type:'personality', status:'pending', proof_type:'url', due_date:new Date().toISOString().slice(0,10), trust_reward:10, source_weakness:'Behavioral STAR', estimated_minutes:30, learn_url:null, ai_evaluation:null },
];

export const DEMO_OPPORTUNITIES = [
  { title:'Software Engineer II', company:'Zomato', location:'Bangalore', type:'Full-time', salary:'₹25-35 LPA', match_score:88, skills:['React','Node.js','PostgreSQL'], posted_at:'2 days ago', description:'Join our platform team building high-scale food delivery infrastructure.' },
  { title:'Full Stack Developer', company:'PhonePe', location:'Bangalore (Hybrid)', type:'Full-time', salary:'₹20-30 LPA', match_score:84, skills:['TypeScript','React','Python'], posted_at:'1 day ago', description:"Work on India's leading fintech platform, serving 500M+ users." },
  { title:'ML Engineer', company:'Swiggy', location:'Bangalore', type:'Full-time', salary:'₹22-32 LPA', match_score:79, skills:['Python','TensorFlow','SQL'], posted_at:'3 days ago', description:'Build recommendation systems powering food and grocery delivery.' },
  { title:'React Developer', company:'Razorpay', location:'Bangalore', type:'Full-time', salary:'₹15-25 LPA', match_score:91, skills:['React','TypeScript','GraphQL'], posted_at:'1 hour ago', description:"Build beautiful payment UIs for India's leading payment gateway." },
  { title:'SDE Intern', company:'Meesho', location:'Bangalore', type:'Internship', salary:'₹80K/month', match_score:95, skills:['React','Node.js'], posted_at:'12 hours ago', description:'Summer internship with pre-placement offer potential.' },
];

export const DEMO_NOTIFICATIONS = [
  { type:'success', title:'Mission Completed!', message:'You completed "LinkedIn Post" and earned +8 trust points.', source:'mission', read:false, is_read:false, createdAt:new Date(Date.now()-2*3600000).toISOString() },
  { type:'info', title:'New Opportunity Match', message:'Razorpay React Developer — 91% match for your profile.', source:'opportunities', read:false, is_read:false, createdAt:new Date(Date.now()-5*3600000).toISOString() },
  { type:'warning', title:'Career DNA Update', message:'Your DSA score dropped. Complete 2 algorithm missions to recover.', source:'exam', read:true, is_read:true, createdAt:new Date(Date.now()-86400000).toISOString() },
];

export const EMPTY_PROFILE = {
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

export async function getUserProfile(uid: string) {
  const snap = await getDoc(doc(db,'users',uid));
  return snap.exists() ? snap.data() : null;
}
export async function createUserProfile(uid: string, data: Record<string,unknown>) {
  await setDoc(doc(db,'users',uid), { ...EMPTY_PROFILE, ...data, createdAt:serverTimestamp() });
}
export async function updateUserProfile(uid: string, data: Record<string,unknown>) {
  try { await updateDoc(doc(db,'users',uid), data); } catch { await setDoc(doc(db,'users',uid), { ...EMPTY_PROFILE, ...data, createdAt:serverTimestamp() }); }
}
export async function ensureSeedData(uid: string, profile: Record<string,unknown>) {
  const missCol=collection(db,'users',uid,'missions');
  const ex=await getDocs(query(missCol,limit(1)));
  if(ex.empty){ for(const m of DEMO_MISSIONS) await addDoc(missCol,{ ...m, uid, createdAt:serverTimestamp() }); }
  const notifCol=collection(db,'users',uid,'notifications');
  const exN=await getDocs(query(notifCol,limit(1)));
  if(exN.empty){ for(const n of DEMO_NOTIFICATIONS) await addDoc(notifCol,{ ...n, uid, createdAt:serverTimestamp() }); }
  const oppCol=collection(db,'opportunities');
  const exO=await getDocs(query(oppCol,limit(1)));
  if(exO.empty){ for(const o of DEMO_OPPORTUNITIES) await addDoc(oppCol,{ ...o, createdAt:serverTimestamp() }); }
}
export async function getTodayMissions(uid: string) {
  const today=new Date().toISOString().slice(0,10);
  const col=collection(db,'users',uid,'missions');
  const snap=await getDocs(query(col,where('due_date','>=',today),orderBy('due_date')));
  return snap.docs.map(d=>({ id:d.id, ...d.data() }));
}
export async function getMissionHistory(uid: string) {
  const snap=await getDocs(query(collection(db,'users',uid,'missions'),orderBy('due_date','desc')));
  return snap.docs.map(d=>({ id:d.id, ...d.data() }));
}
export async function submitMission(uid: string, missionId: string, data: Record<string,unknown>) {
  await updateDoc(doc(db,'users',uid,'missions',missionId), { status:'submitted', proof:data, submittedAt:serverTimestamp() });
  const missionSnap = await getDoc(doc(db,'users',uid,'missions',missionId));
  const missionData = missionSnap.exists() ? missionSnap.data() : null;
  const missionTitle = missionData?.title || 'Daily Mission';
  
  const profile=await getUserProfile(uid);
  if(profile) {
    await updateDoc(doc(db,'users',uid), { trust_score:Math.min(100,(profile.trust_score as number||0)+8), mission_streak:(profile.mission_streak as number||0)+1, missions_completed:(profile.missions_completed as number||0)+1 });
  }
  
  try {
    await addDoc(collection(db,'users',uid,'notifications'), {
      type: 'success',
      title: 'Mission Completed!',
      message: `You completed "${missionTitle}" and earned +8 trust points.`,
      source: 'mission',
      read: false,
      is_read: false,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to create mission notification:', err);
  }
}
export async function getVaultItems(uid: string) {
  try {
    const { data, error } = await supabase
      .from('vault_items')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
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
  } catch (err) {
    console.warn('Failed to fetch vault from Supabase, falling back to local storage:', err);
    const snap=await getDocs(query(collection(db,'users',uid,'vault'),orderBy('createdAt','desc')));
    return snap.docs.map(d=>({ id:d.id, ...d.data() } as any));
  }
}
export async function addVaultItem(uid: string, item: Record<string,unknown>) {
  try {
    const { data, error } = await supabase
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
    
    if (error) throw error;
    return data?.[0]?.id || `supabase-${Date.now()}`;
  } catch (err) {
    console.warn('Failed to write vault to Supabase, falling back to local:', err);
    const ref=await addDoc(collection(db,'users',uid,'vault'), { ...item, uid, createdAt:serverTimestamp() });
    return ref.id;
  }
}

export async function generateResumeFromVault(uid: string, parsedResume: any, targetRole?: string) {
  // 1. Update user profile with structured resume and ATS score
  await updateUserProfile(uid, {
    structured_resume: parsedResume,
    ats_score: parsedResume.ats_score || 72,
    resumeGenerated: true,
    weak_areas: parsedResume.keyword_gaps || ["Docker", "CI/CD", "System Design"]
  });

  // 2. Add targeted missions for the gaps
  const missionCol = collection(db, 'users', uid, 'missions');
  const serverTime = serverTimestamp();
  const today = new Date().toISOString().slice(0, 10);

  const activeGaps = parsedResume.keyword_gaps || [];

  if (activeGaps.includes('Docker')) {
    await addDoc(missionCol, {
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
    await addDoc(missionCol, {
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
    await addDoc(missionCol, {
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
    await addDoc(missionCol, {
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
  } else if (role.includes('data') || role.includes('ml') || role.includes('machine') || role.includes('ai')) {
    await addDoc(missionCol, {
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
  } else if (role.includes('back') || role.includes('system') || role.includes('database')) {
    await addDoc(missionCol, {
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
  await addDoc(collection(db, 'users', uid, 'notifications'), {
    type: 'warning',
    title: 'Vault Resume Compiled',
    message: `ML Resume Builder processed your document. Gaps identified: ${gapsList}. Custom learning quests have been added for your target role: ${targetRole || 'SDE'}.`,
    source: 'mission',
    read: false,
    is_read: false,
    createdAt: new Date().toISOString()
  });
}
export async function getNotifications(uid: string) {
  const snap=await getDocs(query(collection(db,'users',uid,'notifications'),orderBy('createdAt','desc')));
  return snap.docs.map(d=>({ id:d.id, ...d.data() }));
}
export async function markAllNotificationsRead(uid: string) {
  const snap=await getDocs(collection(db,'users',uid,'notifications'));
  for(const d of snap.docs) await updateDoc(doc(db,'users',uid,'notifications',d.id),{ read:true, is_read:true });
}
export async function getOpportunities() {
  const snap=await getDocs(collection(db,'opportunities'));
  return snap.docs.map(d=>({ id:d.id, ...d.data() }));
}
export async function applyToOpportunity(uid: string, oppId: string) {
  await setDoc(doc(db,'applications',`${uid}_${oppId}`), { uid, oppId, status:'applied', appliedAt:serverTimestamp() });
}
export async function recalculateCareerDna(uid: string) {
  const profile=await getUserProfile(uid);
  if(!profile) return null;
  const missions=await getMissionHistory(uid);
  const completed=missions.filter((m:any)=>m.status==='submitted'||m.status==='completed').length;
  const newDna=Math.min(100,(profile.career_dna_score as number||68)+completed);
  await updateDoc(doc(db,'users',uid),{ career_dna_score:newDna });
  return { ...profile, career_dna_score:newDna };
}
export async function getDashboardAnalytics(uid: string) {
  const profile=await getUserProfile(uid);
  return { missions:{ completed:profile?.missions_completed||0 }, score_history:[] };
}
export async function createInterviewSession(uid: string, data: Record<string,unknown>) {
  const ref=await addDoc(collection(db,'users',uid,'interview_sessions'), { ...data, uid, status:'active', createdAt:serverTimestamp() });
  return ref.id;
}
export async function getInterviewSession(uid: string, sessionId: string) {
  const snap=await getDoc(doc(db,'users',uid,'interview_sessions',sessionId));
  if(!snap.exists()) return null;
  return { id:snap.id, ...snap.data() };
}
export async function appendInterviewTranscript(uid: string, sessionId: string, entries: {role:string;content:string;ts:number}[]) {
  const ref=doc(db,'users',uid,'interview_sessions',sessionId);
  const snap=await getDoc(ref);
  if(!snap.exists()) return;
  const existing=(snap.data().transcript as unknown[])||[];
  await updateDoc(ref,{ transcript:[...existing,...entries] });
}
export async function completeInterviewSession(uid: string, sessionId: string, evaluation: Record<string,unknown>) {
  await updateDoc(doc(db,'users',uid,'interview_sessions',sessionId), { status:'completed', overall_score:evaluation.overall_score, evaluation, completedAt:serverTimestamp() });
  const profile=await getUserProfile(uid);
  if(profile) {
    const prev=(profile.communication_score as number)||60;
    const next=Math.min(100,Math.round(prev*0.6+((evaluation.communication_score as number)||prev)*0.4));
    await updateDoc(doc(db,'users',uid),{ communication_score:next, interviews_done:(profile.interviews_done as number||0)+1 });
  }
}
export async function getInterviewHistory(uid: string) {
  const snap=await getDocs(query(collection(db,'users',uid,'interview_sessions'),orderBy('createdAt','desc'),limit(20)));
  return snap.docs.map(d=>{ const data=d.data(); return { id:d.id, mode:data.mode, status:data.status, overall_score:data.overall_score||0, started_at:data.createdAt?.toDate?.()?.toISOString()||new Date().toISOString() }; });
}

export async function getAllUsers(): Promise<any[]> {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Recruiter Job Posting helper functions ──
export async function addJob(recruiterId: string, jobData: Record<string, any>) {
  const ref = await addDoc(collection(db, 'jobs'), {
    ...jobData,
    recruiter_id: recruiterId,
    is_deleted: false,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateJob(jobId: string, jobData: Record<string, any>) {
  await updateDoc(doc(db, 'jobs', jobId), jobData);
}

export async function deleteJob(jobId: string) {
  await updateDoc(doc(db, 'jobs', jobId), { is_deleted: true });
}

export async function getJobs(recruiterId?: string) {
  const q = recruiterId 
    ? query(collection(db, 'jobs'), where('recruiter_id', '==', recruiterId), where('is_deleted', '==', false))
    : query(collection(db, 'jobs'), where('is_deleted', '==', false));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Recruiter Job Applications helpers ──
export async function getApplicationsForRecruiter(recruiterId: string) {
  const recruiterJobs = await getJobs(recruiterId);
  const jobIds = recruiterJobs.map(j => j.id);
  if (jobIds.length === 0) return [];
  
  const snap = await getDocs(collection(db, 'applications'));
  const allApps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const filtered = allApps.filter((a: any) => jobIds.includes(a.oppId));
  
  const resolved = [];
  for (const app of filtered as any[]) {
    const uProfile = await getUserProfile(app.uid);
    const matchedJob = recruiterJobs.find(j => j.id === app.oppId) as any;
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

export async function updateApplicationStatus(appId: string, status: string) {
  // Check if document exists first, if not create it
  const ref = doc(db, 'applications', appId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, { status, updatedAt: serverTimestamp() });
  } else {
    // If it was a mock ID or composite key, create it
    const parts = appId.split('_');
    const uid = parts[0] || 'unknown';
    const oppId = parts[1] || 'unknown';
    await setDoc(ref, { uid, oppId, status, appliedAt: serverTimestamp() });
  }
}

// ── Consultant Document/Vault Verification helpers ──
export async function verifyVaultItem(studentId: string, itemId: string, status: 'verified' | 'rejected') {
  await updateDoc(doc(db, 'users', studentId, 'vault', itemId), {
    status,
    verified: status === 'verified',
    verifiedAt: serverTimestamp(),
  });
  
  // Increment student trust score on verification
  const profile = await getUserProfile(studentId);
  if (profile && status === 'verified') {
    const current = (profile as any).trust_score || 40;
    await updateUserProfile(studentId, { trust_score: Math.min(100, current + 5) });
  }
}

// ── Consultant 1:1 Sessions helpers ──
export async function scheduleSession(sessionData: Record<string, any>) {
  const ref = await addDoc(collection(db, 'sessions'), {
    ...sessionData,
    createdAt: serverTimestamp(),
  });
  
  // Send notification to the student
  if (sessionData.studentId) {
    await addDoc(collection(db, 'users', sessionData.studentId, 'notifications'), {
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

export async function getSessions(consultantId?: string, studentId?: string) {
  let q = query(collection(db, 'sessions'));
  const snap = await getDocs(q);
  const allSessions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  if (consultantId) {
    return allSessions.filter((s: any) => s.consultantId === consultantId);
  } else if (studentId) {
    return allSessions.filter((s: any) => s.studentId === studentId);
  }
  return allSessions;
}

// ── Admin Audit Log helpers ──
export async function addAuditEntry(adminId: string, action: string, targetId: string, meta: Record<string, any>) {
  await addDoc(collection(db, 'audit_logs'), {
    adminId,
    action,
    targetId,
    meta,
    timestamp: new Date().toISOString()
  });
}

export async function getAuditLogs() {
  try {
    const snap = await getDocs(collection(db, 'audit_logs'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch {
    return [];
  }
}

export async function sendBroadcastNotification(senderId: string, title: string, message: string, type: string, targetRole: string) {
  const users = await getAllUsers();
  const targets = targetRole ? users.filter(u => u.role === targetRole) : users;
  
  for (const target of targets) {
    await addDoc(collection(db, 'users', target.id, 'notifications'), {
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

export async function generateCustomSkillQuests(uid: string, targetRole: string, skill: string) {
  const missionCol = collection(db, 'users', uid, 'missions');
  const serverTime = serverTimestamp();
  const today = new Date().toISOString().slice(0, 10);

  // Generate 2 structured learning missions/quests for the selected skill
  await addDoc(missionCol, {
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

  await addDoc(missionCol, {
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
  await addDoc(collection(db, 'users', uid, 'notifications'), {
    type: 'success',
    title: 'Training Modules Generated',
    message: `We generated custom learning quest modules for ${skill} to help you qualify for the ${targetRole || 'SDE'} benchmarks!`,
    source: 'mission',
    read: false,
    is_read: false,
    createdAt: new Date().toISOString()
  });
}




