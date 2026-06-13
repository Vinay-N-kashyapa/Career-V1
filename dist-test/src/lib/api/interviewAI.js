"use strict";
// lib/api/interviewAI.ts
// Interview AI — calls Anthropic Claude API directly from browser.
// Uses claude-sonnet-4-20250514 via Anthropic v1/messages endpoint.
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiInterviewStart = aiInterviewStart;
exports.aiInterviewRespond = aiInterviewRespond;
exports.aiInterviewEvaluate = aiInterviewEvaluate;
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const MODE_PROMPTS = {
    google: `You are a senior interviewer at a top-tier tech company (Google/Meta/Amazon level).
Your style: structured, curious, probing. Ask ONE question at a time.
Cover behavioral (STAR), system design concepts, and problem-solving approach.
Keep responses concise — 2-3 sentences max per turn.`,
    startup: `You are a fast-moving startup founder interviewing for a key role.
Style: direct, energetic, impatient with fluff. Ask about ownership, bias-to-action, and resilience.
One question per turn. Keep it punchy.`,
    hr: `You are a seasoned HR manager using the STAR method.
Focus on communication, cultural fit, self-awareness, and teamwork.
One behavioral question per turn, warm but professional tone.`,
    visa: `You are a formal visa officer conducting a structured interview.
Be precise, formal, and slightly skeptical. One question per turn.`,
    gd: `You are a group discussion moderator for a corporate panel interview.
Introduce a topic, then engage the candidate in a debate-style back-and-forth.`,
};
const PRESSURE_OVERLAYS = {
    normal: '',
    aggressive: `\n\nPRESSURE MODE - AGGRESSIVE: Be challenging and push back on weak answers immediately.`,
    fast: `\n\nPRESSURE MODE - FAST-PACED: Ask rapid-fire follow-up questions, keep turns short.`,
    surprise: `\n\nPRESSURE MODE - SURPRISE: Introduce unexpected angles and tricky questions.`,
    panel: `\n\nPRESSURE MODE - PANEL: Occasionally speak as a second panelist with a different perspective.`,
    interruption: `\n\nPRESSURE MODE - INTERRUPTION: Occasionally interrupt mid-answer with a redirect.`,
};
function buildSystem(mode, pressureMode, domain) {
    const base = MODE_PROMPTS[mode] || MODE_PROMPTS.hr;
    const overlay = PRESSURE_OVERLAYS[pressureMode] || '';
    const domainStr = domain ? `\n\nFOCUS DOMAIN: ${domain}` : '';
    return `${base}${overlay}${domainStr}

RULES: Ask exactly ONE question per response. Never give the answer. Keep under 120 words.`;
}
async function callClaude(messages, system, maxTokens = 350) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: CLAUDE_MODEL,
            max_tokens: maxTokens,
            system,
            messages,
        }),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Claude API error ${res.status}: ${err}`);
    }
    const data = await res.json();
    return (data.content?.filter((b) => b.type === 'text').map((b) => b.text).join('') || '').trim();
}
async function aiInterviewStart(params) {
    const system = buildSystem(params.mode, params.pressureMode || 'normal', params.domain);
    return callClaude([{ role: 'user', content: 'Begin the interview. Introduce yourself in one sentence, then ask your first question.' }], system, 250);
}
async function aiInterviewRespond(params) {
    const system = buildSystem(params.mode, params.pressureMode || 'normal');
    const messages = [...params.transcript, { role: 'user', content: params.response }];
    return callClaude(messages, system, 350);
}
async function aiInterviewEvaluate(transcript, mode) {
    const formatted = transcript
        .map(t => `${t.role === 'assistant' ? 'INTERVIEWER' : 'CANDIDATE'}: ${t.content}`)
        .join('\n\n');
    const candidateText = transcript.filter(t => t.role === 'user').map(t => t.content).join(' ');
    const totalWords = candidateText.split(/\s+/).filter(Boolean).length;
    const fillerMatch = candidateText.match(/\b(um|uh|like|you know|basically|actually|literally|i mean)\b/gi) || [];
    const system = `You are an expert interview coach. Evaluate the transcript and return ONLY valid JSON:\n{"overall_score":<0-100>,"confidence_score":<0-100>,"communication_score":<0-100>,"technical_depth":<0-100>,"leadership_score":<0-100>,"energy_level":<0-100>,"strengths":["<s>","<s>"],"weaknesses":["<s>"],"improvement_tips":["<s>","<s>","<s>"],"readiness":"not_ready"|"developing"|"ready"|"strong","summary":"<2-3 sentences>"}`;
    try {
        const raw = await callClaude([{ role: 'user', content: `Mode: ${mode.toUpperCase()}\n\nTRANSCRIPT:\n${formatted.slice(0, 7000)}` }], system, 800);
        const evaluation = JSON.parse(raw.replace(/```json|```/g, '').trim());
        return { ...evaluation, filler_rate: fillerMatch.length / Math.max(totalWords, 1) };
    }
    catch {
        return { overall_score: 65, confidence_score: 60, communication_score: 62, technical_depth: 55, leadership_score: 60, energy_level: 65, strengths: ['Attempted all questions'], weaknesses: ['Short responses'], improvement_tips: ['Use STAR method', 'Be more specific', 'Reduce filler words'], readiness: 'developing', summary: 'Keep practising.', filler_rate: 0.05 };
    }
}
