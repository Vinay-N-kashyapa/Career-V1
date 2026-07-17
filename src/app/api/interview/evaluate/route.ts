import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { history, codingScore, telemetry } = await req.json();

    const formatted = history
      .map((t: any) => `${t.role === 'assistant' ? 'INTERVIEWER' : 'CANDIDATE'}: ${t.content}`)
      .join('\n\n');
    const candidateText = history.filter((t: any) => t.role === 'user').map((t: any) => t.content).join(' ');
    const totalWords = candidateText.split(/\s+/).filter(Boolean).length;
    const fillerMatch = candidateText.match(/\b(um|uh|like|you know|basically|actually|literally|i mean)\b/gi) || [];

    const systemPrompt = `You are an expert interview coach. Evaluate the transcript and return ONLY valid JSON:\n{"overall_score":<0-100>,"confidence_score":<0-100>,"communication_score":<0-100>,"technical_depth":<0-100>,"leadership_score":<0-100>,"energy_level":<0-100>,"strengths":["<s>","<s>"],"weaknesses":["<s>"],"improvement_tips":["<s>","<s>","<s>"],"readiness":"not_ready"|"developing"|"ready"|"strong","summary":"<2-3 sentences>"}`;

    const groqKey = process.env.GROQ_API_KEY || (process.env.GROQ_API_KEYS || '').split(',')[0]?.trim();
    const openRouterKey = process.env.OPENROUTER_API_KEY;

    let evaluation: any = null;

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
            { role: 'user', content: `Evaluate this transcript:\n\n${formatted.slice(0, 7000)}` }
          ],
          max_tokens: 800,
          temperature: 0.2
        })
      });
      if (res.ok) {
        const data = await res.json();
        const raw = (data.choices?.[0]?.message?.content || '').trim();
        try {
          evaluation = JSON.parse(raw.replace(/```json|```/g, '').trim());
        } catch (e) {
          console.warn('Failed to parse Groq json response', raw);
        }
      }
    }

    if (!evaluation && openRouterKey) {
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
            { role: 'user', content: `Evaluate this transcript:\n\n${formatted.slice(0, 7000)}` }
          ]
        })
      });
      if (res.ok) {
        const data = await res.json();
        const raw = (data.choices?.[0]?.message?.content || '').trim();
        try {
          evaluation = JSON.parse(raw.replace(/```json|```/g, '').trim());
        } catch (e) {
          console.warn('Failed to parse OpenRouter json response', raw);
        }
      }
    }

    if (!evaluation) {
      // Fallback
      evaluation = {
        overall_score: Math.min(100, Math.max(40, 60 + Math.round(codingScore / 3))),
        confidence_score: 70,
        communication_score: 65,
        technical_depth: codingScore,
        leadership_score: 60,
        energy_level: 70,
        strengths: ['Completed all stages', 'Delivered compiler-passed Java algorithms'],
        weaknesses: ['Vague elaboration on cache systems design eviction patterns'],
        improvement_tips: ['Implement STAR responses for behavioral questions', 'Structure cache eviction answers with concrete math metrics'],
        readiness: codingScore >= 80 ? 'ready' : 'developing',
        summary: 'Candidate demonstrates stable foundational programming proficiency but requires practice on systems design cache sharding properties.'
      };
    }

    const finalEvaluation = {
      verdict: evaluation.verdict || (evaluation.overall_score >= 60 || evaluation.readiness === 'ready' || evaluation.readiness === 'strong' ? 'Hire' : 'No Hire'),
      score: evaluation.score || evaluation.overall_score || 60,
      summary: evaluation.summary || 'Attempted all onsite questions.',
      improvements: evaluation.improvements || (evaluation.improvement_tips ? evaluation.improvement_tips.join(', ') : 'Distributed systems coding practices.')
    };

    return NextResponse.json({
      evaluation: finalEvaluation,
      ...evaluation,
      filler_rate: fillerMatch.length / Math.max(totalWords, 1)
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
