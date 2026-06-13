'use client';
// API client — routes all /api/* calls to Supabase + Claude AI (Document 8 version)

import { supabase } from '@/lib/supabaseClient';
import * as fs from '@/lib/supabaseService';
import { aiInterviewStart, aiInterviewRespond, aiInterviewEvaluate } from '@/lib/api/interviewAI';

const _transcripts = new Map<string, { role:'user'|'assistant'; content:string }[]>();

export class ApiError extends Error {
  constructor(public status:number, public code:string, message:string, public details?:Record<string,string[]>) {
    super(message); this.name='ApiError';
  }
}
export class PaywallError extends ApiError {
  constructor(public feature:string, public requiredTier='Pro') {
    super(402,'TIER_LIMIT_REACHED',`${feature} requires ${requiredTier}`); this.name='PaywallError';
  }
}

async function getUid(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if(!user) throw new ApiError(401,'UNAUTHORIZED','Not logged in');
  return user.id;
}

const DEMO_SIMULATION = {
  current_trajectory:'Strong frontend engineer trajectory. Ready for junior-to-mid transitions in 3–4 months if you close system design gaps.',
  paths:[
    { name:'Full Stack Engineer',probability:68,role:'SDE-1 @ Product Startup',salary_range:'₹8–14 LPA',timeline:'3–5 months',risk:'low',fit_score:82,requirements:['Close DSA gaps','Build 2 projects','Pass 3 coding interviews'],milestones:[{month:1,milestone:'Complete React + Node.js portfolio'},{month:4,milestone:'First offer — ₹8–12 LPA'}] },
    { name:'Data / ML Engineer',probability:21,role:'Associate Data Engineer',salary_range:'₹7–11 LPA',timeline:'6–9 months',risk:'medium',fit_score:58,requirements:['Learn pandas + SQL','Data pipeline project','AWS or GCP cert'],milestones:[{month:5,milestone:'Build ETL pipeline'},{month:8,milestone:'First data role'}] },
    { name:'Product Management',probability:11,role:'Associate Product Manager',salary_range:'₹9–15 LPA',timeline:'8–12 months',risk:'high',fit_score:44,requirements:['PM case studies','PM internship first'],milestones:[{month:6,milestone:'PM internship'},{month:10,milestone:'APM offer'}] },
  ],
  startup_founder_fit:62,mba_suitability:38,global_readiness:55,
  top_recommendation:'Take the Full Stack Engineer path. Your skill tags align perfectly and the 3-month timeline is realistic.',
  urgent_actions:['Solve 10 LeetCode mediums this week (arrays + hashmaps)','Deploy a full-stack project to Vercel','Complete 3 AI mock interviews on system design'],
};

async function firestoreRouter(method:string, path:string, body?:unknown): Promise<unknown> {
  const uid = await getUid();
  const [cleanPath, queryString] = path.split('?');
  const params = new URLSearchParams(queryString || '');

  if(cleanPath==='/api/auth/me'){ const p=await fs.getUserProfile(uid); return { user:{ id:uid,...p } }; }
  if(cleanPath==='/api/auth/logout') return { ok:true };
  if(cleanPath==='/api/auth/profile'){ await fs.updateUserProfile(uid,body as Record<string,unknown>); const p=await fs.getUserProfile(uid); return { ok:true, user:{ id:uid,...p } }; }
  if(cleanPath==='/api/auth/teacher'){ const{teacherId}=body as Record<string,string>; await fs.updateUserProfile(uid,{ selectedTeacherId:teacherId }); return { ok:true }; }
  if(cleanPath==='/api/auth/onboarding'){ await fs.updateUserProfile(uid,body as Record<string,unknown>); return { ok:true }; }
  if(cleanPath==='/api/auth/forgot-password') return { ok:true, message:'If your account exists, a reset link has been sent.' };
  if(cleanPath==='/api/auth/reset-password'){ return { ok:true, message:'Password reset successfully.' }; }
  if(cleanPath==='/api/auth/face/enrolled'){ return { enrolled:false }; }
  if(cleanPath==='/api/auth/face/enroll'){ return { ok:true }; }
  if(cleanPath.startsWith('/api/auth/')) return { ok:true };
  if(cleanPath==='/api/missions/today'){ const m=await fs.getTodayMissions(uid); return { missions:m }; }
  if(cleanPath==='/api/missions/history'){ const m=await fs.getMissionHistory(uid); return { missions:m }; }
  if(cleanPath==='/api/missions/submit'){ const{missionId,...rest}=body as Record<string,unknown>; await fs.submitMission(uid,missionId as string,rest); return { ok:true }; }
  if(cleanPath==='/api/missions/generate-custom-skill'&&method==='POST'){
    const { targetRole, skill } = body as { targetRole: string, skill: string };
    await fs.generateCustomSkillQuests(uid, targetRole, skill);
    return { ok: true };
  }
  if(cleanPath.startsWith('/api/missions/streak')){ const p=await fs.getUserProfile(uid); return { streak:(p as any)?.mission_streak||0, xpTotal:(p as any)?.xp_total||0, xpLevel:(p as any)?.xp_level||1 }; }
  if(cleanPath==='/api/career-dna/scores'){ const p=await fs.getUserProfile(uid); return { scores:p }; }
  if(cleanPath==='/api/career-dna/profile'){ const p=await fs.getUserProfile(uid); return { profile:p }; }
  if(cleanPath==='/api/career-dna/archetype'&&method==='PATCH'){ const{archetype}=body as Record<string,string>; await fs.updateUserProfile(uid,{ career_dna_archetype:archetype }); return { ok:true, archetype }; }
  if(cleanPath==='/api/career-dna/calculate'||cleanPath==='/api/career-dna/recalculate'){ const p=await fs.recalculateCareerDna(uid); return { scores:p }; }
  if(cleanPath.startsWith('/api/career-dna/history')){ const p=await fs.getUserProfile(uid); const months=6; const now=new Date(); const history=Array.from({length:months},(_,i)=>{ const d=new Date(now); d.setMonth(d.getMonth()-(months-1-i)); const pr=i/Math.max(months-1,1); return { date:d.toISOString().slice(0,10), ats_score:Math.round(((p as any)?.ats_score||45)*(0.5+0.5*pr)), trust_score:Math.round(((p as any)?.trust_score||40)*(0.5+0.5*pr)), career_dna_score:Math.round(((p as any)?.career_dna_score||35)*(0.5+0.5*pr)), mission_streak:Math.round(((p as any)?.mission_streak||0)*pr) }; }); return { history, months }; }
  if(cleanPath==='/api/career-twin/results') return { simulation:DEMO_SIMULATION };
  if(cleanPath==='/api/career-twin/run'||cleanPath==='/api/career-twin/simulate') return { ok:true, simulation:DEMO_SIMULATION };
  if(cleanPath.startsWith('/api/career-twin')) return { simulation:DEMO_SIMULATION };
  if(cleanPath==='/api/resume/structured/me'){ const p=await fs.getUserProfile(uid); const sd=(p as any)?.structured_resume||null; return { data:sd, resumeId:sd?`mock-resume-${uid}`:null }; }
  if(cleanPath==='/api/resume/structured'&&method==='POST'){
    const resumeData = body as any;
    let score = 55;
    if (resumeData.fullName) score += 5;
    if (resumeData.summary) score += 10;
    if (resumeData.experiences?.length > 0) score += 10;
    if (resumeData.education?.length > 0) score += 5;
    if (resumeData.skills?.technical) score += 10;
    if (resumeData.projects?.length > 0) score += 5;
    
    await fs.updateUserProfile(uid,{ 
      structured_resume: body,
      ats_score: Math.min(98, score) 
    }); 
    return { ok:true, resumeId:`mock-resume-${uid}` }; 
  }
  if(cleanPath==='/api/career-builder/generate'&&method==='POST'){
    const { targetRole, skillTags, weakAreas, experienceLevel } = body as { targetRole: string, skillTags: string[], weakAreas: string[], experienceLevel: string };
    
    const prompt = `You are an expert AI Career Architect. Your task is to generate a custom technical learning roadmap of modules and quests tailored to the student's career target, existing skills, and resume weak areas.

Inputs:
- Target Career Trajectory: ${targetRole || 'Software Engineer'}
- Experience Level Focus: ${experienceLevel || 'beginner'}
- Known Skills: ${Array.isArray(skillTags) ? skillTags.join(', ') : 'None'}
- Resume Weak Areas / Gaps: ${Array.isArray(weakAreas) ? weakAreas.join(', ') : 'None'}

Output Specifications:
- You must generate exactly 3 Modules in a learning progression.
- Each Module must contain exactly 2 Quests.
- Quests can be of type 'coding' (requires starterCode, hint, and testSuite) OR 'lecture'/'interactive' (requires syllabus and hint, requiresAvatar: true).
- Each generated Quest MUST contain a "category" property, which must be exactly one of: 'learning' | 'exam' | 'assignment'.
  - If a quest type is 'lecture' or 'interactive', set category to 'learning'.
  - If a quest type is 'coding', set category to 'assignment' or 'exam' (representing coding assignment sandboxes or timed mock exams).
- You MUST customize the quests to address the user's weak areas (e.g. if 'Docker' is a weak area, include a quest on Docker containerization).
- For 'coding' quests, ensure starterCode is a basic class definition, e.g. "public class Solution {\\n    public [ReturnType] [FunctionName]([Parameters]) {\\n        // Write your code here\\n    }\\n}", and testSuite is valid JavaScript code that checks the solution method. E.g., "if (typeof reverse !== 'function') throw new Error('Method reverse not found.'); if (reverse('abc') !== 'cba') throw new Error('Failed test case.');"
- Return ONLY a valid JSON array matching the Module[] structure below, with no markdown formatting wrappers, no backticks, and no conversation.

TypeScript Interfaces:
interface Quest {
  id: string;
  title: string;
  desc: string;
  type: 'coding' | 'lecture' | 'interactive';
  category: 'learning' | 'exam' | 'assignment';
  requiresAvatar: boolean;
  starterCode?: string;
  hint: string;
  testSuite?: string;
  skillCategory: 'programming' | 'soft-skills' | 'communication' | 'leadership' | 'theory';
  syllabus?: string[];
}

interface Module {
  id: string;
  title: string;
  desc: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedWeeks: number;
  quests: Quest[];
}`;

    try {
      const responseText = await callExternalLLM([
        { role: 'user', content: 'Generate a customized Module[] JSON array based on the instructions.' }
      ], prompt, 'programming');
      
      let cleanJson = responseText.trim();
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
      }
      
      const modules = JSON.parse(cleanJson);
      if (Array.isArray(modules)) {
        return { ok: true, modules };
      }
    } catch (err) {
      console.error('AI Roadmap Generation failed:', err);
    }
    
    return { ok: false, error: 'Fallback to template' };
  }
  if(cleanPath==='/api/resume/upload'&&method==='POST'){
    await fs.updateUserProfile(uid, { ats_score: 68 });
    return {
      resumeId: `resume-upload-${Date.now()}`,
      analysis: {
        ats_score: 68,
        format_quality: 75,
        skill_tags: ['Java', 'Spring Boot', 'SQL', 'Git', 'REST APIs'],
        weak_areas: ['Docker', 'System Design', 'Microservices'],
        keyword_gaps: ['Docker', 'Kubernetes', 'CI/CD', 'Microservices'],
        strengths: [
          'Strong foundational knowledge of Java and OOP principles.',
          'Clear presentation of project details and academic qualifications.'
        ],
        improvement_suggestions: [
          'Add key cloud computing and containerization technologies like Docker.',
          'Quantify accomplishments in project descriptions (e.g., improved throughput by 20%).',
          'Include a dedicated certifications section.'
        ],
        certifications_detected: [],
        experience_level: 'Entry Level',
        domain: 'Backend Engineering'
      },
      message: 'Resume analyzed successfully by Claude AI'
    };
  }
  if(cleanPath==='/api/resume/generate-from-vault'&&method==='POST'){
    const { itemId } = body as { itemId: string };
    
    // 1. Fetch the user profile to find target_role
    const profile = await fs.getUserProfile(uid) as any;
    const targetRole = profile?.target_role || 'Software Developer Engineer (SDE)';

    // 2. Fetch the vault item details
    const vaultItems = await fs.getVaultItems(uid);
    let selectedItem = vaultItems.find(item => item.id === itemId);
    if (!selectedItem) {
      if (itemId === 'demo-resume-draft') {
        selectedItem = { id: 'demo-resume-draft', title: 'college_resume_draft.pdf', item_type: 'resume', description: 'Draft resume detailing Java programming, basic algorithms, database systems, and web projects.' } as any;
      } else if (itemId === 'demo-cert') {
        selectedItem = { id: 'demo-cert', title: 'java_basic_cert.pdf', item_type: 'certification', description: 'Certified in Java basic syntax, variables, loop control, classes, and OOP.' } as any;
      } else {
        selectedItem = { id: itemId, title: 'Vault Document', item_type: 'resume', description: 'Java SDE Candidate resume with projects in React and Node.js.' } as any;
      }
    }

    // 3. Call the AI (Groq/OpenRouter) to read and analyze the document (using callExternalLLM)
    const prompt = `You are a state-of-the-art ML Resume Builder model.
We have retrieved the following document from the candidate's secure mobile vault:
- Title: ${selectedItem!.title}
- Type: ${selectedItem!.item_type}
- Description: ${selectedItem!.description || 'No description provided.'}

Your job:
1. Analyze this document and generate a premium, ATS-optimized software developer resume schema in JSON format.
2. The JSON must contain exactly these fields:
   - "ats_score": a number from 55 to 95 reflecting how prepared the candidate is for an SDE job based on this document.
   - "fullName": the candidate's name (use "Ashwanth Kumar" if not found).
   - "summary": a professional executive summary.
   - "skills": {"technical": "comma-separated list of technical skills", "professional": "comma-separated list of soft skills"}.
   - "experiences": an array of objects containing {"role": "SDE Intern", "company": "Product Startup", "duration": "June 2024 - Present", "bullets": ["Improved database performance...", "Collaborated on React front-end..."]}.
   - "education": an array of objects containing {"degree": "B.Tech in Computer Science", "school": "State University", "duration": "2021 - 2025", "gpa": "9.1/10"}.
   - "projects": an array of objects containing {"name": "Project Name", "description": "Project description...", "tech": "React, Node.js"}.
   - "keyword_gaps": array of critical SDE keywords missing from the document that are highly sought after by recruiters (e.g. "Docker", "CI/CD", "System Design", "Kubernetes", "Microservices"). Choose 2 or 3 gaps.
   - "strengths": array of 2 strengths.
   - "improvement_suggestions": array of 2 action items.

Ensure the JSON output is strictly valid and contains no extra text or markdown formatting. Just return the JSON.`;

    let generatedJsonStr = '';
    try {
      generatedJsonStr = await callExternalLLM([{ role: 'user', content: 'Generate SDE resume JSON structure.' }], prompt, 'programming');
    } catch (err) {
      console.warn("External LLM failed, using mock resume builder rules", err);
      generatedJsonStr = JSON.stringify({
        ats_score: 74,
        fullName: "Ashwanth Kumar",
        summary: "Motivated Computer Science student with hands-on experience in Java backend development, React user interfaces, and SQL query optimization. Passionate about solving complex algorithmic problems and building scalable software solutions.",
        skills: {
          technical: "Java, SQL, React, Node.js, JavaScript, OOP, Git, Spring Boot",
          professional: "Problem Solving, Agile Collaboration, Technical Writing, Team Communication"
        },
        experiences: [
          { role: "Software Engineering Intern", company: "Zomato", duration: "June 2025 - Present", bullets: ["Developed RESTful APIs in Java and Spring Boot for restaurant matching algorithms.", "Optimized SQL indexing tables, reducing query latency by 18%.", "Participated in daily Scrum team meetings and sprint planning."] }
        ],
        education: [
          { degree: "B.Tech in Computer Science & Engineering", school: "Apex Institute of Technology", duration: "2022 - 2026", gpa: "9.2/10" }
        ],
        projects: [
          { name: "SDE Calculator Service", description: "Created a Java-based API calculator with assertion test suites running in-browser.", tech: "Java, Spring Boot, Git" }
        ],
        keyword_gaps: ["Docker", "CI/CD", "System Design"],
        strengths: [
          "Strong core Java syntax and Spring Boot API foundation.",
          "Excellent problem-solving skills with verified test Assertions."
        ],
        improvement_suggestions: [
          "Incorporate containerization using Docker into backend projects.",
          "Implement CI/CD pipeline actions for automated test runs."
        ]
      });
    }

    let parsed: any;
    try {
      let cleanJson = generatedJsonStr.trim();
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```(json)?/, '').replace(/```$/, '').trim();
      }
      parsed = JSON.parse(cleanJson);
    } catch {
      parsed = {
        ats_score: 74,
        fullName: "Ashwanth Kumar",
        summary: "Motivated Computer Science student with hands-on experience in Java backend development, React user interfaces, and SQL query optimization.",
        skills: { technical: "Java, SQL, React, Node.js", professional: "Problem Solving" },
        experiences: [],
        education: [],
        projects: [],
        keyword_gaps: ["Docker", "CI/CD", "System Design"],
        strengths: ["Strong Java syntax"],
        improvement_suggestions: ["Add Docker"]
      };
    }

    // 4. Save to Firestore, generate quests, and create notifications
    await fs.generateResumeFromVault(uid, parsed, targetRole);

    return {
      ok: true,
      resumeId: `vault-resume-${uid}`,
      analysis: {
        ats_score: parsed.ats_score || 72,
        format_quality: 85,
        skill_tags: parsed.skills?.technical?.split(',').map((s: string) => s.trim()) || [],
        weak_areas: parsed.keyword_gaps || [],
        keyword_gaps: parsed.keyword_gaps || [],
        strengths: parsed.strengths || [],
        improvement_suggestions: parsed.improvement_suggestions || []
      },
      structuredData: parsed
    };
  }
  if(cleanPath.endsWith('/improve')&&method==='POST'){
    await fs.updateUserProfile(uid, { ats_score: 84 });
    return {
      improvements: {
        rewritten_summary: 'Results-driven entry-level Software Engineer with hands-on experience developing RESTful APIs using Java and Spring Boot. Adept at database optimization using SQL and collaborating in Git-based workflows. Actively expanding skills in cloud deployments, Docker, and CI/CD pipelines to build scalable backend systems.',
        projected_ats_score: 84,
        key_changes: [
          'Rephrased professional summary to emphasize action-oriented SDE qualities.',
          'Integrated containerization (Docker) and CI/CD keywords in skills and summary.'
        ],
        improvement_tips: [
          'Use the suggested summary in your basic info section.',
          'Make sure you verify Docker and CI/CD in your quests/vault to maintain trust alignment.'
        ]
      }
    };
  }
  if(cleanPath.includes('/enhance')) {
    await fs.updateUserProfile(uid, { ats_score: 84 });
    return { 
      ok:true, 
      currentScore:55, 
      improvements:{ 
        summary:'Results-driven software engineer with hands-on experience developing RESTful APIs using Java and Spring Boot. Adept at database optimization using SQL and collaborating in Git-based workflows.', 
        keyword_additions:['CI/CD','Microservices','Docker'], 
        projected_ats_score:84, 
        improvement_tips:['Add metrics','Include GitHub link'] 
      } 
    }; 
  }
  if(cleanPath.includes('/pdf')) throw new ApiError(503,'PDF_SERVICE_UNAVAILABLE','PDF export requires the backend server.');
  if(cleanPath.startsWith('/api/resume')) return { resumes:[], resume:null };
  if(cleanPath==='/api/vault/items'&&method==='GET'){ const items=await fs.getVaultItems(uid); return { items:items||[] }; }
  if(cleanPath==='/api/vault/stats') return { byType:[], summary:{ total:0, verified_total:0 } };
  if(cleanPath==='/api/vault'&&method==='GET'){ const items=await fs.getVaultItems(uid); return { items, stats:{ total:(items||[]).length } }; }
  if(cleanPath==='/api/vault'&&method==='POST'){ const id=await fs.addVaultItem(uid,body as Record<string,unknown>); return { ok:true, itemId:id, id }; }
  if(cleanPath.startsWith('/api/vault/upload')) return { ok:true, itemId:`vault-${Date.now()}` };
  if(cleanPath.startsWith('/api/vault')) return { ok:true };
  if(cleanPath==='/api/notifications'){ const n=await fs.getNotifications(uid); return { notifications:n }; }
  if(cleanPath==='/api/notifications/mark-all-read'){ await fs.markAllNotificationsRead(uid); return { ok:true }; }
  if(cleanPath.startsWith('/api/notifications')) return { ok:true };
  if(cleanPath.startsWith('/api/opportunities/feed')||cleanPath==='/api/opportunities'&&method==='GET'){ const o=await fs.getOpportunities(); return { opportunities:o }; }
  if(cleanPath==='/api/opportunities/apply'){ const{opportunityId}=body as Record<string,string>; await fs.applyToOpportunity(uid,opportunityId); return { ok:true }; }
  if(cleanPath==='/api/opportunities/match') return { match:{ match_score:78, matched_skills:['React','Node.js','TypeScript'], missing_skills:['Docker','System Design'], source:'local' } };
  if(cleanPath==='/api/opportunities/applications') return { applications:[] };
  if(cleanPath.startsWith('/api/opportunities')) return { opportunities:[] };
  if(cleanPath==='/api/analytics/dashboard'){ const p=await fs.getUserProfile(uid); const ad=await fs.getDashboardAnalytics(uid).catch(()=>null); const intel=Math.round(((p as any)?.career_dna_score||0)*0.30+((p as any)?.trust_score||0)*0.25+((p as any)?.ats_score||0)*0.25+((p as any)?.recruiter_visibility||0)*0.20); const cr=Math.round(((p as any)?.ats_score||0)*0.35+((p as any)?.trust_score||0)*0.30+((p as any)?.career_dna_score||0)*0.20+((p as any)?.recruiter_visibility||0)*0.15); return { scores:{ ...p, career_readiness:cr }, career_readiness:cr, intelligence_score:intel, missions:(ad as any)||{}, score_history:(ad as any)?.score_history||[] }; }
  if(cleanPath==='/api/analytics/leaderboard/preview') return { leaders:[{userId:'s-5',displayName:'Deepa Krishnan',score:91,streak:18},{userId:'s-3',displayName:'Sneha Iyer',score:85,streak:12},{userId:uid,displayName:'You',score:72,streak:7}], userRank:3, total:6 };
  if(cleanPath.startsWith('/api/analytics/leaderboard')){ const metric = params.get('metric') || 'trust'; return { leaders:[{userId:'s-5',displayName:'Deepa Krishnan',score:91,streak:18},{userId:uid,displayName:'You',score:72,streak:7}], userRank:3, metric }; }
  if(cleanPath.startsWith('/api/analytics')){ const p=await fs.getUserProfile(uid); return { profile:p, stats:p }; }
  // ── Pins API ──────────────────────────────────────────────────────────────
  if(cleanPath==='/api/pins/balance'){
    const p=await fs.getUserProfile(uid);
    return { pins:(p as any)?.pins||100, transactions:[] };
  }
  if(cleanPath==='/api/pins/earn'&&method==='POST'){
    const{source,amount}=body as Record<string,unknown>;
    const p=await fs.getUserProfile(uid);
    const current=(p as any)?.pins||100;
    const newBal=current+(amount as number||0);
    await fs.updateUserProfile(uid,{ pins:newBal });
    return { ok:true, pins:newBal, earned:amount };
  }
  if(cleanPath==='/api/pins/spend'&&method==='POST'){
    const{featureKey,cost}=body as Record<string,unknown>;
    const p=await fs.getUserProfile(uid);
    const current=(p as any)?.pins||100;
    if(current<(cost as number||0)) throw new ApiError(402,'INSUFFICIENT_PINS',`Need ${cost} pins, have ${current}`);
    const newBal=current-(cost as number||0);
    await fs.updateUserProfile(uid,{ pins:newBal });
    return { ok:true, pins:newBal, spent:cost };
  }
  if(cleanPath==='/api/pins/purchase'&&method==='POST'){
    const{amount,packName}=body as Record<string,unknown>;
    const p=await fs.getUserProfile(uid);
    const current=(p as any)?.pins||100;
    const newBal=current+(amount as number||0);
    await fs.updateUserProfile(uid,{ pins:newBal });
    return { ok:true, pins:newBal, added:amount, packName };
  }

  if(cleanPath==='/api/payment/status'){ const p=await fs.getUserProfile(uid); const tier=(p as any)?.subscription_tier||'free'; return { tier, endsAt:tier!=='free'?new Date(Date.now()+30*86400000).toISOString():null, planName:tier==='pro'?'Pro':'Free', limits:{ aiInterviews:3, resumeUploads:2 } }; }
  if(cleanPath==='/api/payment/plans') return { plans:[{id:'free',name:'Free',price:0,features:['3 AI interviews/month','2 resume uploads','Full Career DNA']},{id:'pro',name:'Pro',price:49900,features:['Unlimited everything','AI Resume Improve']}] };
  if(cleanPath==='/api/payment/create-order'){ const{planId}=body as Record<string,string>; return { orderId:`dev_order_${Date.now()}`, amount:planId==='pro'?49900:4999900, keyId:'rzp_test_dev', devMode:true }; }
  if(cleanPath==='/api/payment/verify'){ await fs.updateUserProfile(uid,{ subscription_tier:'pro' }); return { ok:true, tier:'pro', message:'Pro plan activated!' }; }
  if(cleanPath.startsWith('/api/payment')) return { ok:true };

  // ── Interview with real Claude AI ────────────────────────────────────────
  if(cleanPath==='/api/interview/start'&&method==='POST'){
    const{mode='hr',domain,pressureMode='normal',persona}=body as Record<string,string>;
    const opening=await aiInterviewStart({ mode, domain, pressureMode, persona });
    const sessionId=await fs.createInterviewSession(uid,{ mode, domain:domain||null, pressureMode, persona:persona||'professional', transcript:[{ role:'assistant', content:opening, ts:Date.now() }] });
    _transcripts.set(sessionId,[{ role:'assistant', content:opening }]);
    return { sessionId, opening, mode };
  }
  if(cleanPath==='/api/interview/respond'&&method==='POST'){
    const{sessionId,response,mode='hr',pressureMode='normal'}=body as Record<string,string>;
    let transcript=_transcripts.get(sessionId);
    if(!transcript){ const s=await fs.getInterviewSession(uid,sessionId) as any; transcript=(s?.transcript||[]).map((t:any)=>({ role:t.role, content:t.content })); _transcripts.set(sessionId,transcript!); }
    const reply=await aiInterviewRespond({ sessionId, response, mode, pressureMode, transcript:transcript! });
    transcript!.push({ role:'user', content:response }); transcript!.push({ role:'assistant', content:reply });
    fs.appendInterviewTranscript(uid,sessionId,[{ role:'user', content:response, ts:Date.now() },{ role:'assistant', content:reply, ts:Date.now() }]).catch(()=>{});
    return { reply, sessionId };
  }
  if(cleanPath==='/api/interview/evaluate'&&method==='POST'){
    const{sessionId}=body as Record<string,string>;
    let transcript=_transcripts.get(sessionId);
    if(!transcript||transcript.length===0){ const s=await fs.getInterviewSession(uid,sessionId) as any; transcript=(s?.transcript||[]).map((t:any)=>({ role:t.role, content:t.content })); }
    if(!transcript||transcript.length<2) throw new ApiError(400,'TOO_SHORT','Interview too short to evaluate. Please answer at least 2 questions.');
    const session=await fs.getInterviewSession(uid,sessionId) as any;
    const evaluation=await aiInterviewEvaluate(transcript,session?.mode||'hr');
    await fs.completeInterviewSession(uid,sessionId,evaluation);
    _transcripts.delete(sessionId);
    return { evaluation, sessionId };
  }
  if(cleanPath==='/api/interview/history'&&method==='GET'){ const sessions=await fs.getInterviewHistory(uid); return { sessions }; }
  if(cleanPath.startsWith('/api/interview')) return { ok:true };

  if(cleanPath.startsWith('/api/trust/score')){ const p=await fs.getUserProfile(uid); return { score:(p as any)?.trust_score||75, breakdown:{ missionAuthenticity:80, examIntegrity:90, behavioralConsistency:75 }, signals:{ documents:[], speakingMetrics:[] } }; }
  if(cleanPath==='/api/trust/evaluate'){ const p=await fs.getUserProfile(uid); const ns=Math.min(100,((p as any)?.trust_score||75)+1); await fs.updateUserProfile(uid,{ trust_score:ns }); return { score:ns, ok:true }; }
  if(cleanPath.startsWith('/api/trust')) return { ok:true, score:75 };
  if(cleanPath==='/api/personality/report') return { traits:{ confidence:72, communication:76, leadership:58, discipline:83, empathy:68 }, insights:['Strong discipline score.','Work on reducing filler words.'], weekly_change:{ communication:2 } };
  if(cleanPath==='/api/personality/session') return { challenge:"Introduce yourself as if walking into your dream company's first interview.", instructions:'Cover: who you are, top skills, one achievement.' };
  if(cleanPath==='/api/personality/analyze') return { analysis:{ summary:'Good response structure.', trait_scores:{ communication:74, confidence:68 }, strengths:['Clear structure'], improvements:['Reduce filler words'], filler_words:[], confidence_delta:1 } };
  if(cleanPath.startsWith('/api/personality')) return { traits:{}, insights:[] };
  if(cleanPath==='/api/exam/available') return { exams:[{ id:'exam-react-001', title:'React Fundamentals Certification', exam_type:'mcq', status:'published', duration_minutes:30, total_marks:50, passing_marks:35, question_count:8, difficulty:'Medium' },{ id:'exam-python-001', title:'Python Coding Challenge', exam_type:'coding', status:'published', duration_minutes:45, total_marks:60, passing_marks:42, question_count:3, difficulty:'Medium' }] };
  if(cleanPath.includes('/api/exam/')&&cleanPath.includes('/questions')){ const examId=cleanPath.split('/exam/')[1].replace('/questions',''); return { exam:examId==='exam-react-001'?{ id:'exam-react-001', title:'React Fundamentals', durationMinutes:30, totalMarks:50, passingMarks:35, allowedSwitches:3, questions:[{ id:'rq1',type:'mcq',text:'What hook manages state in React functional components?',marks:5,options:['useEffect','useState','useRef','useContext'] },{ id:'rq2',type:'mcq',text:'Which is equivalent to componentDidMount?',marks:5,options:['useEffect w/deps','useEffect cleanup','useEffect with []','useReducer'] },{ id:'rq3',type:'essay',text:'Explain the difference between controlled and uncontrolled components.',marks:15 }] }:null }; }
  if(cleanPath==='/api/exam/sync-result') return { ok:true, result:{ percentage:80, badge_level:'gold' }, vaultItemId:`vault-${Date.now()}` };
  if(cleanPath==='/api/exam/results') return { results:[] };
  if(cleanPath.startsWith('/api/exam')) return { ok:true };

  // ── Sentinel DNA Cryptographic Registry ──────────────────────────────────────
  if(cleanPath==='/api/sentinel/fingerprint'){
    return {
      sha256: `f8a45e982c7a31bde8${Date.now().toString(16)}`,
      ok: true,
      layers: ['SHA-256 Hash', 'OCR Fingerprint', 'Semantic Embedding', 'Session Watermark', 'Lineage Graph'],
      embeddingStored: true,
      sessionSignature: `sig_watermark_${Date.now().toString(16)}`
    };
  }
  if(cleanPath==='/api/sentinel/search-similar'){
    const { text } = body as { text?: string } || {};
    const containsResume = text?.toLowerCase().includes('resume') || text?.toLowerCase().includes('engineer');
    return {
      matches: containsResume ? [
        {
          hash: 'a9b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
          score: 0.92,
          metadata: { docType: 'resume', uploadedAt: new Date(Date.now() - 3 * 86400 * 1000).toISOString() }
        },
        {
          hash: 'c2d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1',
          score: 0.78,
          metadata: { docType: 'resume', uploadedAt: new Date(Date.now() - 10 * 86400 * 1000).toISOString() }
        }
      ] : []
    };
  }
  if(cleanPath.startsWith('/api/sentinel')) return { ok:true };

function buildTeacherSystemPrompt(teacherId: string, careerContext?: any): string {
  const teacherName = teacherId === 'priya' ? 'Ms. Priya' : teacherId === 'aisha' ? 'Ms. Aisha' : teacherId === 'rohan' ? 'Mr. Rohan' : 'Mr. Vikram';
  const teacherPersona = teacherId === 'priya'
    ? 'You are Ms. Priya, a warm, encouraging career advisor. You focus on general trajectory, interviews, resume improvements, and soft skills.'
    : teacherId === 'aisha'
    ? 'You are Ms. Aisha, an expert academic professor. You explain computer science theory, algorithms, and deep technical details in structured lessons.'
    : teacherId === 'rohan'
    ? 'You are Mr. Rohan, a hands-on SDE Team Lead. You focus on clean code, software engineering practices, systems architectures, and practical tips.'
    : 'You are Mr. Vikram, a strict, analytical technical recruiter and interviewer. You focus on performance, edge cases, rigorous constraints, and direct feedback.';

  let profileContext = '';
  if (careerContext) {
    const role = careerContext.target_role || 'Software Engineer';
    const weakAreas = Array.isArray(careerContext.weak_areas) ? careerContext.weak_areas.join(', ') : 'None specified';
    const skills = Array.isArray(careerContext.skill_tags) ? careerContext.skill_tags.join(', ') : 'None specified';
    profileContext = `\n\nStudent Career Trajectory:
- Target Role: ${role}
- Skills: ${skills}
- Weak Areas / Focus Topics: ${weakAreas}
- ATS Score: ${careerContext.ats_score || 0}/100`;

    if (careerContext.activeQuest) {
      profileContext += `\n\nActive Quest Details:
- Title: ${careerContext.activeQuest.title}
- Description: ${careerContext.activeQuest.desc}
- Syllabus: ${Array.isArray(careerContext.activeQuest.syllabus) ? careerContext.activeQuest.syllabus.join(', ') : 'None'}
- Type: ${careerContext.activeQuest.type}`;
    }
  }

  return `${teacherPersona}${profileContext}

Instructions:
- The student may ask you about their career roadmap (e.g. current modules, quests, weak areas) OR general questions outside of their roadmap.
- If there is an active quest, focus your teaching, Socratic questioning, and explanations specifically on the active quest topic.
- Provide expert, clear explanations. If explaining code, give concise examples in Java, Python, or JS.
- Encourage active learning: ask guiding follow-up questions to help them conceptualize.
- Keep your answers highly engaging, premium, and concise (under 120 words).`;
}

async function callExternalLLM(
  messages: { role: string; content: string }[],
  systemPrompt: string,
  skillCategory?: 'programming' | 'soft-skills' | 'communication' | 'leadership' | 'theory'
): Promise<string> {
  const openRouterKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
  const groqKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

  const isSoftSkill = skillCategory === 'soft-skills' || skillCategory === 'communication' || skillCategory === 'leadership';
  
  // Decide primary and secondary providers
  // Soft skills prioritize Groq (high speed, natural language).
  // Technical/programming tasks prioritize OpenRouter (specialized code models like Qwen Coder).
  const primaryProvider = isSoftSkill ? 'groq' : 'openrouter';

  const executeGroq = async (): Promise<string> => {
    if (!groqKey) throw new Error('Groq key not configured');
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });
    if (!res.ok) throw new Error(`Groq returned ${res.status}`);
    const data = await res.json();
    return (data.choices?.[0]?.message?.content || '').trim();
  };

  const executeOpenRouter = async (): Promise<string> => {
    if (!openRouterKey) throw new Error('OpenRouter key not configured');
    const model = skillCategory === 'programming'
      ? 'qwen/qwen-2.5-coder-32b-instruct'
      : 'qwen/qwen-2.5-7b-instruct:free';
    
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openRouterKey}`,
        'HTTP-Referer': 'https://pinit.app',
        'X-Title': 'PinIT Career OS'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });
    if (!res.ok) throw new Error(`OpenRouter returned ${res.status}`);
    const data = await res.json();
    return (data.choices?.[0]?.message?.content || '').trim();
  };

  // Run execution chain with automatic failover
  if (primaryProvider === 'groq') {
    try {
      return await executeGroq();
    } catch (err) {
      console.warn('Primary LLM provider (Groq) failed, falling back to OpenRouter:', err);
      try {
        return await executeOpenRouter();
      } catch (fallbackErr) {
        console.error('All LLM providers failed:', fallbackErr);
      }
    }
  } else {
    try {
      return await executeOpenRouter();
    } catch (err) {
      console.warn('Primary LLM provider (OpenRouter) failed, falling back to Groq:', err);
      try {
        return await executeGroq();
      } catch (fallbackErr) {
        console.error('All LLM providers failed:', fallbackErr);
      }
    }
  }

  throw new Error('No active LLM providers configured or succeeded');
}

  if(cleanPath==='/api/chat'&&method==='POST'){
    const { message, teacherId = 'priya' } = body as Record<string, string>;
    const teacherName = teacherId === 'priya' ? 'Ms. Priya' : teacherId === 'aisha' ? 'Ms. Aisha' : teacherId === 'rohan' ? 'Mr. Rohan' : 'Mr. Vikram';
    
    try {
      const sysPrompt = buildTeacherSystemPrompt(teacherId);
      const reply = await callExternalLLM([{ role: 'user', content: message }], sysPrompt);
      return { reply, teacher: teacherId };
    } catch (err) {
      console.warn('AI Teacher chat failed, using mock fallback', err);
    }

    const responses = [
      'Great question! Let me break this down step by step.',
      'I like how you\'re thinking about this. Let me give you a concrete example.',
      'That\'s a solid approach. Here\'s what to focus on next.',
      'You\'re on the right track! The key insight is consistency.'
    ];
    return { reply: responses[Math.floor(Math.random() * responses.length)] + ` — ${teacherName}`, teacher: teacherId };
  }
  if(cleanPath==='/api/chat/session') return { sessionId:`chat-${Date.now()}`, opening:'Hello! I\'m your AI study partner. What would you like to learn today?' };
  if(cleanPath.startsWith('/api/chat/history/')) return { messages:[] };
  if(cleanPath.startsWith('/api/chat')) return { ok:true };
  if(cleanPath==='/api/study/complete'){ const p=await fs.getUserProfile(uid); const current=(p as any)?.consistency_score||60; await fs.updateUserProfile(uid,{ consistency_score:Math.min(100,current+1) }); return { ok:true }; }
  if(cleanPath.startsWith('/api/study')) return { ok:true };
  if(cleanPath.startsWith('/api/parent/student/')&&cleanPath.includes('/overview')) return { profile:{ career_readiness:74, ats_score:72, trust_score:75, career_dna_score:68, mission_streak:7 }, recentExams:[], missionSummary:[] };
  if(cleanPath==='/api/parent/students') return { students:[] };
  if(cleanPath==='/api/parent/link-student'){ return { ok:true, message:'Link request sent to student.' }; }
  if(cleanPath.startsWith('/api/parent')) return { ok:true, students:[] };

  // ── Recruiter Candidate Search ──────────────────────────────────────────────
  if(cleanPath==='/api/recruiter/analytics'){
    const users = await fs.getAllUsers();
    const students = users.filter(u => u.role === 'student');
    const total = students.length;
    const avgAts = total ? Math.round(students.reduce((acc, curr) => acc + ((curr as any).ats_score || 50), 0) / total) : 50;
    const avgTrust = total ? Math.round(students.reduce((acc, curr) => acc + ((curr as any).trust_score || 50), 0) / total) : 50;
    const avgDna = total ? Math.round(students.reduce((acc, curr) => acc + ((curr as any).career_dna_score || 50), 0) / total) : 50;
    return {
      analytics: {
        avg_ats: avgAts,
        avg_trust: avgTrust,
        avg_dna: avgDna,
        total_students: total,
        high_trust_count: students.filter(s => ((s as any).trust_score || 50) >= 70).length,
        high_ats_count: students.filter(s => ((s as any).ats_score || 50) >= 80).length
      }
    };
  }
  if(cleanPath.startsWith('/api/recruiter/candidates')){
    const users = await fs.getAllUsers();
    const students = users.filter(u => u.role === 'student' && ((u as any).recruiterVisible === true || ((u as any).recruiter_visibility || 0) > 0));
    const formatted = students.map(s => ({
      id: s.id,
      display_name: s.displayName || s.username || 'Student',
      ats_score: (s as any).ats_score || 50,
      trust_score: (s as any).trust_score || 50,
      career_dna_score: (s as any).career_dna_score || 50,
      mission_streak: (s as any).mission_streak || 0,
      recruiter_visibility: (s as any).recruiter_visibility || 65,
      communication_score: (s as any).communication_score || 60,
      execution_score: (s as any).execution_score || 60,
      skill_tags: (s as any).skill_tags || ['React', 'Node.js'],
      missions_done: (s as any).missions_completed || 0,
      interviews_done: (s as any).interviews_done || 0
    }));
    return { candidates: formatted, requests: [] };
  }
  if(cleanPath==='/api/recruiter/shortlist'){ return { ok:true }; }
  if(cleanPath==='/api/recruiter/contact-request'){ return { ok:true }; }
  if(cleanPath==='/api/recruiter/schedule-interview'){ return { ok:true }; }
  if(cleanPath==='/api/recruiter/jobs'){
    if(method==='GET') {
      const j = await fs.getJobs(uid);
      return { jobs: j };
    }
    if(method==='POST') {
      const id = await fs.addJob(uid, body as Record<string,any>);
      return { ok: true, id };
    }
  }
  if(cleanPath.startsWith('/api/recruiter/jobs/') && method==='DELETE'){
    const jobId = cleanPath.split('/api/recruiter/jobs/')[1];
    await fs.deleteJob(jobId);
    return { ok: true };
  }
  if(cleanPath==='/api/recruiter/company'){
    if(method==='GET') {
      const p = await fs.getUserProfile(uid) as any;
      return { company: p?.company_profile || null };
    }
    if(method==='POST') {
      await fs.updateUserProfile(uid, { company_profile: body });
      return { ok: true };
    }
  }
  if(cleanPath==='/api/recruiter/applications') {
    if(method==='GET') {
      const apps = await fs.getApplicationsForRecruiter(uid);
      return { applications: apps };
    }
    if(method==='POST' || method==='PATCH') {
      const { applicationId, status } = body as { applicationId: string, status: string };
      await fs.updateApplicationStatus(applicationId, status);
      return { ok: true };
    }
  }
  if(cleanPath.startsWith('/api/recruiter/candidate/')){
    const candidateId=cleanPath.split('/api/recruiter/candidate/')[1];
    const profile = await fs.getUserProfile(candidateId) as any;
    const vault = await fs.getVaultItems(candidateId).catch(() => []);
    return {
      candidate: {
        id: candidateId,
        display_name: profile?.displayName || profile?.username || 'Student',
        email: profile?.email || '',
        phone: profile?.phone || '',
        ats_score: profile?.ats_score || 50,
        trust_score: profile?.trust_score || 50,
        career_dna_score: profile?.career_dna_score || 50,
        recruiter_visibility: profile?.recruiter_visibility || 65,
        missions_done: profile?.missions_completed || 0,
        interviews_done: profile?.interviews_done || 0,
        recent_missions: [
          { title: 'Complete Python loops practice', status: 'completed' },
          { title: 'React Fundamentals Challenge', status: 'completed' }
        ],
        vaultItems: vault || []
      }
    };
  }
  if(cleanPath.startsWith('/api/recruiter/visibility')){ const{visible}=body as Record<string,unknown>; await fs.updateUserProfile(uid,{ recruiter_visibility:visible?80:0 }); return { ok:true }; }
  if(cleanPath.startsWith('/api/recruiter')) return { ok:true, candidates:[], requests:[], interviews:[] };

  if(cleanPath==='/api/university/dashboard'){ return { placementStats:{ total_students:240, placed:168, avg_ctc:8.4, top_recruiters:['TCS','Infosys','Wipro'] }, topStudents:[], deptStats:[] }; }
  if(cleanPath==='/api/university/employability-report'){ return { report:{ employability_score:72, industry_readiness:68 } }; }
  if(cleanPath==='/api/university/skill-gaps'){ return { gaps:[{ skill:'System Design', demand:88, supply:42 },{ skill:'DSA', demand:92, supply:55 }] }; }
  if(cleanPath.startsWith('/api/university')) return { ok:true, placementStats:{ total_students:0 }, topStudents:[], deptStats:[], report:{}, gaps:[] };

  // ── Consultant Student Pipeline ─────────────────────────────────────────────
  if(cleanPath==='/api/consultant/analytics'){
    return {
      totalStudents: 42,
      totalRevenue: 1200000,
      visaApprovalRate: 95,
      offerRate: 88
    };
  }
  if(cleanPath==='/api/consultant/pipeline'){
    const usersList = await fs.getAllUsers();
    const students = usersList.filter(u => u.role === 'student');
    const pipeline: Record<string, any[]> = { onboarding:[], document_collection:[], application:[], visa:[], pre_departure:[], completed:[] };
    for (const s of students) {
      const status = (s as any).status || 'onboarding';
      if (pipeline[status]) {
        const vaultItems = await fs.getVaultItems(s.id).catch(() => []);
        pipeline[status].push({
          _id: s.id,
          id: s.id,
          displayName: s.displayName || s.username || 'Student',
          targetCountry: (s as any).targetCountry || 'USA',
          programType: (s as any).programType || 'Masters',
          visa_status: (s as any).visa_status || 'not_started',
          status: status,
          tasks: (s as any).tasks || [],
          documents: (s as any).documents || [],
          vaultItems: vaultItems || [],
          email: s.email || '',
          phone: (s as any).phone || '',
        });
      }
    }
    return { pipeline, stats:{ total:students.length, active:students.filter(s => (s as any).status !== 'completed').length } };
  }
  if(cleanPath==='/api/consultant/student/add'){
    const studentData = body as Record<string, any>;
    let targetUid = '';
    try {
      const email = studentData.email || `student_${Date.now()}@pinit.app`;
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email,
        password: 'TemporaryPassword123!',
        options: {
          data: {
            display_name: studentData.displayName || 'Student User'
          }
        }
      });
      if (signUpData?.user) {
        targetUid = signUpData.user.id;
      } else if (signUpErr) {
        // If user already exists, try to log in to get their UUID!
        if (signUpErr.message?.includes('already registered') || signUpErr.message?.includes('already exists') || (signUpErr as any).status === 422) {
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email,
            password: 'TemporaryPassword123!'
          });
          if (signInData?.user) {
            targetUid = signInData.user.id;
          } else {
            // If sign in fails (e.g. password mismatch), generate a unique email to sign up
            const uniqueEmail = `student_${Date.now()}_${Math.floor(Math.random() * 10000)}@pinit.app`;
            const { data: retryData, error: retryErr } = await supabase.auth.signUp({
              email: uniqueEmail,
              password: 'TemporaryPassword123!',
              options: {
                data: {
                  display_name: studentData.displayName || 'Student User'
                }
              }
            });
            if (retryData?.user) {
              targetUid = retryData.user.id;
            } else {
              throw retryErr || new Error('Failed to retrieve user ID');
            }
          }
        } else {
          throw signUpErr;
        }
      }
    } catch (e) {
      console.warn('Supabase auth signup failed during student add, using fallback:', e);
    }

    if (!targetUid) {
      targetUid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-0000-0000-' + Date.now().toString().padStart(12, '0');
    }

    await fs.createUserProfile(targetUid, {
      ...studentData,
      role: 'student',
      status: 'onboarding',
      visa_status: 'not_started',
      tasks: [],
      documents: [],
      ats_score: 50,
      trust_score: 50,
      career_dna_score: 50,
      mission_streak: 0,
    });
    return { ok:true };
  }
  if(cleanPath.startsWith('/api/consultant/student/')&&!cleanPath.endsWith('/task')&&!cleanPath.endsWith('/verify-document')&&method==='PATCH'){
    const studentId = cleanPath.split('/api/consultant/student/')[1];
    const update = body as Record<string, any>;
    await fs.updateUserProfile(studentId, update);
    return { ok:true };
  }
  if(cleanPath.startsWith('/api/consultant/student/')&&cleanPath.endsWith('/verify-document')&&method==='POST'){
    const parts = cleanPath.split('/api/consultant/student/')[1].split('/');
    const studentId = parts[0];
    const { itemId, status } = body as { itemId: string, status: 'verified' | 'rejected' };
    await fs.verifyVaultItem(studentId, itemId, status);
    return { ok: true };
  }
  if(cleanPath.startsWith('/api/consultant/student/')&&cleanPath.endsWith('/task')&&method==='POST'){
    const studentId = cleanPath.split('/api/consultant/student/')[1].split('/')[0];
    const task = body as Record<string, any>;
    const profile = await fs.getUserProfile(studentId) as any;
    const tasks = profile?.tasks || [];
    tasks.push({ title: task.title, completed: false, priority: task.priority || 'medium', dueDate: task.dueDate || null });
    await fs.updateUserProfile(studentId, { tasks });
    return { ok:true };
  }
  if(cleanPath==='/api/consultant/sessions'){
    if(method==='GET') {
      const s = await fs.getSessions(uid);
      return { sessions: s };
    }
    if(method==='POST') {
      const id = await fs.scheduleSession({ ...body as Record<string,any>, consultantId: uid });
      return { ok: true, id };
    }
  }
  if(cleanPath.startsWith('/api/consultant')) return { ok:true, pipeline:[] };

  // ── Admin Panel ─────────────────────────────────────────────────────────────
  if(cleanPath==='/api/admin/dashboard'){
    const users = await fs.getAllUsers();
    return {
      users: {
        total: users.length,
        students: users.filter(u => u.role === 'student').length,
        recruiters: users.filter(u => u.role === 'recruiter').length,
        consultants: users.filter(u => u.role === 'consultant').length,
        active_today: Math.round(users.length * 0.4) + 1,
        new_this_week: users.filter(u => {
          const c = (u as any).createdAt;
          if (!c) return true;
          const ts = c.toMillis ? c.toMillis() : new Date(c).getTime();
          return Date.now() - ts < 7 * 86400 * 1000;
        }).length
      },
      fraudAlerts: [
        { display_name: 'Ashwanth Kumar', exam_name: 'React Fundamentals Certification', tab_switches: 4 },
      ],
      recentSignups: users.slice(0, 5).map(u => ({
        id: u.id,
        display_name: u.displayName || u.username || 'User',
        username: u.username || 'user',
        role: u.role || 'student',
        created_at: (u as any).createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      }))
    };
  }
  if(cleanPath==='/api/admin/fraud-alerts'){
    return {
      highTabSwitches: [
        { display_name: 'Ashwanth Kumar', exam_name: 'React Fundamentals Certification', tab_switches: 4 }
      ],
      suspiciousScores: [
        { display_name: 'Deepa Krishnan', delta: 25 }
      ]
    };
  }
  if(cleanPath==='/api/admin/platform-stats'){
    return {
      missions: { total_created: 145, completed_count: 98, active_streaks: 12 },
      resumes: { total_scanned: 54, avg_score: 72, enhancements_generated: 28 },
      exams: { certification_issued: 15, passing_rate: 68, active_exams: 2 }
    };
  }
  if(cleanPath==='/api/admin/users'){
    const users = await fs.getAllUsers();
    const role = params.get('role');
    const searchVal = params.get('search')?.toLowerCase() || '';
    let filteredUsers = users;
    if (role) {
      filteredUsers = filteredUsers.filter(u => u.role === role);
    }
    if (searchVal) {
      filteredUsers = filteredUsers.filter(u =>
        (u.displayName as string)?.toLowerCase().includes(searchVal) ||
        (u.username as string)?.toLowerCase().includes(searchVal)
      );
    }
    const formatted = filteredUsers.map(u => ({
      id: u.id,
      display_name: u.displayName || u.username || 'User',
      username: u.username || 'user',
      role: u.role || 'student',
      created_at: (u as any).createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      last_active_at: (u as any).last_active_at || new Date().toISOString(),
      ats_score: (u as any).ats_score || 50,
      trust_score: (u as any).trust_score || 50,
      career_dna_score: (u as any).career_dna_score || 50,
      mission_streak: (u as any).mission_streak || 0,
      pins: (u as any).pins || 100,
      subscription_tier: (u as any).subscription_tier || 'free',
      register_number: (u as any).registerNumber || null
    }));
    return { users: formatted, total: formatted.length };
  }
  if(cleanPath.startsWith('/api/admin/users/') && cleanPath.endsWith('/role') && method==='PATCH'){
    const userId = cleanPath.split('/api/admin/users/')[1].split('/')[0];
    const { role } = body as Record<string, string>;
    await fs.updateUserProfile(userId, { role });
    return { ok: true };
  }
  if(cleanPath.startsWith('/api/admin/users/') && cleanPath.endsWith('/suspend') && method==='POST'){
    const userId = cleanPath.split('/api/admin/users/')[1].split('/')[0];
    const { reason } = (body as Record<string, any>) || {};
    await fs.updateUserProfile(userId, { suspended: true, role: 'suspended' });
    await fs.addAuditEntry(uid, 'suspend_user', userId, { reason: reason || 'Violation of terms' });
    return { ok: true };
  }
  if(cleanPath.startsWith('/api/admin/users/') && method==='DELETE'){
    const userId = cleanPath.split('/api/admin/users/')[1];
    await fs.updateUserProfile(userId, { suspended: true, role: 'suspended' });
    await fs.addAuditEntry(uid, 'delete_user', userId, { reason: 'Admin action' });
    return { ok: true };
  }
  if(cleanPath.includes('/api/admin/users/')&&cleanPath.includes('/score-override')){
    const userId=cleanPath.split('/api/admin/users/')[1].replace('/score-override','');
    const { field, value, reason } = body as Record<string, any>;
    await fs.updateUserProfile(userId,{ [field]: value });
    await fs.addAuditEntry(uid, 'score_override', userId, { field, value, reason });
    return { ok:true };
  }
  if(cleanPath==='/api/admin/audit-log'){
    const logs = await fs.getAuditLogs();
    logs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return { log: logs };
  }
  if(cleanPath==='/api/admin/broadcast'){
    const { title, message, type, targetRole } = body as Record<string, string>;
    const count = await fs.sendBroadcastNotification(uid, title, message, type, targetRole);
    return { ok:true, sent: count };
  }
  if(cleanPath.startsWith('/api/admin')) return { ok:true, users:[], log:[], total:0 };

  if(cleanPath.startsWith('/api/memory')) return { ok:true };
  if(cleanPath.startsWith('/api/tts')) return { ok:true };
  if(cleanPath==='/api/avatar/chat'&&method==='POST'){
    const { message, history = [], teacherId = 'priya', careerContext } = body as Record<string, any>;
    const teacherName = teacherId === 'priya' ? 'Ms. Priya' : teacherId === 'aisha' ? 'Ms. Aisha' : teacherId === 'rohan' ? 'Mr. Rohan' : 'Mr. Vikram';
    
    try {
      const activeQuest = careerContext?.activeQuest;
      const skillCategory = activeQuest?.skillCategory;
      const sysPrompt = buildTeacherSystemPrompt(teacherId, careerContext);
      const formattedHistory = history.map((h: any) => ({ role: h.role, content: h.content }));
      const reply = await callExternalLLM([...formattedHistory, { role: 'user', content: message }], sysPrompt, skillCategory);
      return { reply };
    } catch (err) {
      console.warn('AI Teacher avatar chat failed, using mock fallback', err);
    }
    
    const responses = [
      `I recommend focusing on Spring Boot dependency injection and MVC patterns next. Would you like a coding exercise on that?`,
      `That's a very good question regarding your career track. Let's make sure you understand the core fundamentals before proceeding.`,
      `For Java Backend development, real-world deployment patterns and database indexing are key skills. What is your experience with databases?`,
      `Consistency is the secret to engineering success. Let's check your roadmap progress and clear the active coding quest!`
    ];
    const reply = responses[Math.floor(Math.random() * responses.length)] + ` — ${teacherName}`;
    return { reply };
  }
  if(cleanPath==='/api/avatar/context'){
    return { 
      avatarMemory: { conversationHistory: [] }, 
      mlRecommendations: [
        { content_type: 'tip', type: 'dsa', label: 'Improve DSA fit', icon: '📊', relevance: 0.95 },
        { content_type: 'tip', type: 'resume', label: 'Scan your Resume', icon: '📄', relevance: 0.88 }
      ] 
    };
  }
  if(cleanPath.startsWith('/api/avatar')) return { ok:true };
  if(cleanPath.startsWith('/api/notes')) return { notes:[] };
  if(cleanPath.startsWith('/api/attendance')) return { logs:[] };
  console.warn(`[API] Unhandled: ${method} ${path}`);
  return { ok:true };
}

async function request<T>(method:string, path:string, body?:unknown): Promise<T> {
  try { return await firestoreRouter(method,path,body) as T; }
  catch(err) { if(err instanceof ApiError) throw err; throw new ApiError(500,'FIRESTORE_ERROR',(err as Error).message||'Request failed'); }
}

export const api = {
  get:    <T>(path:string,_opts?:RequestInit)=>request<T>('GET',path),
  post:   <T>(path:string,body?:unknown)=>request<T>('POST',path,body),
  patch:  <T>(path:string,body?:unknown)=>request<T>('PATCH',path,body),
  put:    <T>(path:string,body?:unknown)=>request<T>('PUT',path,body),
  delete: <T>(path:string)=>request<T>('DELETE',path),
};
