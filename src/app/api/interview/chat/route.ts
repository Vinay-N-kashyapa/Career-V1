import { NextResponse } from 'next/server';

const INTERVIEWERS_MAP: Record<string, { name: string; role: string; nature: string }> = {
  vikram: {
    name: 'Mr. Vikram',
    role: 'The Strict Recruiter',
    nature: 'You have a professional, direct, and impatient recruiting style. You demand numeric metrics and often interrupt to say "Let\'s make it brief—can you summarize in 10 seconds?" to simulate extreme time pressure.'
  },
  shalini: {
    name: 'Ms. Shalini',
    role: 'The Silent Observer',
    nature: 'You are stoic, silent, and meticulous. You keep your tone formal and give zero verbal verification or visual confirmation. You never say "Good job" or "Correct"—you simply nod or say "Understood, proceed." to test candidate anxiety.'
  },
  aditya: {
    name: 'Mr. Aditya',
    role: 'The System Design Purist',
    nature: 'You are a brilliant cloud systems architect. You focus microscopic attention on coding conventions, naming styles, and tiny configuration setups, frequently asking candidates to justify why they chose a particular variable naming or library.'
  },
  neha: {
    name: 'Ms. Neha',
    role: 'The High-Stress Driller',
    nature: 'You prepare candidates for high-stress setups. You ask rapid-fire questions, interrupting logic with scenarios: "What if the DB fails? What if the disk is full? What if you are paged at 3 AM? Solve it now."'
  }
};

export async function POST(req: Request) {
  try {
    const { message, interviewerId, stage, history, telemetry, difficulty, customTopic } = await req.json();
    const selectedInterviewer = INTERVIEWERS_MAP[interviewerId] || INTERVIEWERS_MAP.vikram;

    let difficultyPrompt = '';
    if (difficulty === 'easy') {
      difficultyPrompt = 'Scale difficulty to EASY. Maintain a highly supportive, encouraging tone, ask basic conceptual questions, and guide the candidate gently.';
    } else if (difficulty === 'hard') {
      difficultyPrompt = 'Scale difficulty to HARD. Be extremely demanding, ask deep edge cases, query precise performance metrics, and challenge the candidate\'s claims aggressively.';
    } else {
      difficultyPrompt = 'Scale difficulty to NORMAL. Act as a typical tech recruiter or lead interviewer with standard expectations.';
    }

    let topicPrompt = '';
    if (customTopic && customTopic.trim()) {
      topicPrompt = `The candidate has selected a custom practice topic: "${customTopic.trim()}". Align all your questions, evaluation criteria, and follow-ups strictly around this topic.`;
    } else {
      topicPrompt = 'Focus on the standard engineering career roadmap curriculum (core algorithms, standard systems architecture, and general team scenarios).';
    }

    let stageContext = '';
    if (stage === 'round1_behavioral') {
      const topicLabel = customTopic && customTopic.trim() ? customTopic.trim() : 'software engineering';
      stageContext = `Ask the candidate about their background, experience, and key accomplishments related to "${topicLabel}". Invite them to introduce themselves. Keep it to 2-3 sentences.`;
    } else if (stage === 'round3_systems') {
      if (customTopic && customTopic.trim()) {
        stageContext = `This is the Systems Design round. Ask the candidate to explain the high-level architecture, scalability pattern, and data flow for a large-scale system focused on "${customTopic.trim()}".`;
      } else {
        stageContext = `Ask the candidate how they would design a multi-region distributed cache eviction policy (LRU vs LFU) with strong transactional consistency metrics.`;
      }
    } else if (stage === 'round4_star') {
      if (customTopic && customTopic.trim()) {
        stageContext = `Conduct a structured STAR behavioral interview. Ask the candidate about a challenging technical failure or critical block they faced when working with "${customTopic.trim()}". Guide them progressively through Situation, Task, Action, Result. Only ask about ONE phase at a time.`;
      } else {
        stageContext = `Conduct a structured STAR behavioral interview. Ask about a specific deadline conflict or challenging product team incident. Guide the candidate progressively through: Situation, Task, Action, and Result. Only ask about ONE phase at a time based on their progress.`;
      }
    }

    let telemetryContext = '';
    if (telemetry) {
      telemetryContext = `[Candidate Current Performance Telemetry: Eye Contact: ${telemetry.eyeContact}%, Smile Frequency: ${telemetry.smileFreq}%, Posture Stability: ${telemetry.posture}%, Speaking Speed: ${telemetry.wpm} WPM, Filler Words: ${telemetry.fillerWords}]. Adapt your feedback or recruiter urgency subtly based on this.`;
    }

    const systemPrompt = `You are ${selectedInterviewer.name}, ${selectedInterviewer.role}. ${selectedInterviewer.nature}. ${difficultyPrompt} ${topicPrompt} ${stageContext} ${telemetryContext} Max 3 sentences.`;

    // Execute LLM securely using server-side keys
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const groqKey = process.env.GROQ_API_KEY || (process.env.GROQ_API_KEYS || '').split(',')[0]?.trim();

    let reply = '';
    if (groqKey) {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            ...history.map((h: any) => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content }))
          ],
          max_tokens: 300,
          temperature: 0.7
        })
      });
      if (res.ok) {
        const data = await res.json();
        reply = (data.choices?.[0]?.message?.content || '').trim();
      }
    }

    if (!reply && openRouterKey) {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openRouterKey}`
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct:free',
          messages: [
            { role: 'system', content: systemPrompt },
            ...history.map((h: any) => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content }))
          ]
        })
      });
      if (res.ok) {
        const data = await res.json();
        reply = (data.choices?.[0]?.message?.content || '').trim();
      }
    }

    if (!reply) {
      reply = `Let's proceed with the interview. Tell me more about your experience. — ${selectedInterviewer.name}`;
    }

    return NextResponse.json({ reply });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
