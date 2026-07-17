import { NextResponse } from 'next/server';

// Curated pool of Mindset Evolution Books for dynamic selection
const MINDSET_BOOKS = [
  { title: "Thinking, Fast and Slow (Daniel Kahneman)", focus: "System 1 (automatic, biased) vs System 2 (slow, logical) thinking. Uncovering cognitive blind spots, loss aversion, and decision anxiety." },
  { title: "Extreme Ownership (Jocko Willink)", focus: "Taking absolute accountability for team outcomes, supporting subordinates under failure, and decisive action under ambiguity." },
  { title: "33 Strategies of War (Robert Greene)", focus: "Defensive warfare, turning situations around, counter-offensives, detecting team sabotage or political maneuverings." },
  { title: "The Art of Seduction (Robert Greene)", focus: "Detecting false security, manipulating client desires, managing boundaries against scope creep and manipulation." },
  { title: "Influence: The Psychology of Persuasion (Robert Cialdini)", focus: "Resisting authority bias, scarcity triggers, commitment consistency traps, and social proof manipulation." },
  { title: "The Millionaire Fastlane (MJ DeMarco)", focus: "Producer vs Consumer mindset, law of effection (scale of impact), high-agency execution over passive ideation." },
  { title: "The Black Swan (Nassim Nicholas Taleb)", focus: "Managing unexpected, low-probability high-impact emergencies (like critical server outrages) without panic." },
  { title: "Crucial Conversations (Kerry Patterson)", focus: "High-stakes communication, building dialogue safety, maintaining mutual respect under extreme deadline pressure." }
];

// Avatars available for roleplay casting
const AVATARS_CAST = {
  rajesh: { name: 'Mr. Rajesh', role: 'The Panicky Dev / Saboteur', style: 'Reactive, defensive, prone to cutting corners and covering up mistakes.' },
  abhijit: { name: 'Mr. Abhijit', role: 'The Demanding/Indifferent Exec', style: 'Impatient, metric-driven, delegates under pressure, shifts blame.' },
  sneha: { name: 'Ms. Sneha', role: 'The Supportive but Distracting Colleague', style: 'Polite, soft-spoken, offers easy but highly compromising ways out.' },
  rohan: { name: 'Mr. Rohan', role: 'The Strict Technical Lead', style: 'Logical, direct, intolerant of excuses, testing your ownership boundaries.' }
};

export async function POST(req: Request) {
  try {
    const { action, qt2 = 75, role = 'Software Developer', history = [], choice, scenarioId } = await req.json();

    const groqKey = process.env.GROQ_API_KEY || (process.env.GROQ_API_KEYS || '').split(',')[0]?.trim();
    const openRouterKey = process.env.OPENROUTER_API_KEY;

    if (!groqKey && !openRouterKey) {
      // Fallback response if no key is configured
      return NextResponse.json({
        ok: true,
        message: "Offline Simulator Mode: System detected missing LLM API credentials. Rajesh: 'Vinay, I think we have an issue. The production branch was merged without the validation script, and now the client dashboard is showing null balances! What should we do?'",
        activeAvatar: 'rajesh',
        avatarName: 'Mr. Rajesh',
        avatarRole: 'The Panicky Dev',
        choices: [
          { text: "Take ownership: 'I will rollback the merge immediately and setup a hotfix. Don't panic, let's look at the database logs.'", delta: 4 },
          { text: "Deflect blame: 'Rajesh, why did you merge without running the script? This was under your watch!'", delta: -3 },
          { text: "Quick cover up: 'Let's disable the balance widget on the client side quickly so they don't notice it.'", delta: -2 }
        ],
        isEnded: false
      });
    }

    // Call LLM endpoint
    const callLLM = async (systemPrompt: string, messages: any[]) => {
      const payload = {
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 600
      };

      if (groqKey) {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: payload.messages,
            max_tokens: 600,
            temperature: 0.7
          })
        });
        if (res.ok) {
          const data = await res.json();
          return (data.choices?.[0]?.message?.content || '').trim();
        }
      }

      if (openRouterKey) {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openRouterKey}`
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const data = await res.json();
          return (data.choices?.[0]?.message?.content || '').trim();
        }
      }

      throw new Error('LLM call failed');
    };

    // ── ACTION: INITIALIZE ──
    if (action === 'initialize') {
      const selectedBooks = MINDSET_BOOKS.sort(() => 0.5 - Math.random()).slice(0, 3);
      const booksContext = selectedBooks.map(b => `- ${b.title}: ${b.focus}`).join('\n');

      const systemPrompt = `You are the PinIT Mindset Orchestrator. 
Generate a real-life high-stakes scenario involving a ${role} with a baseline cognitive index (QT2 score) of ${qt2}.
The scenario MUST NOT be described. It should unfold directly as a role-play situation starting with a spoken dialogue by one of the following cast members:
- rajesh (panicky dev shifting blame)
- abhijit (impatient executive demanding metrics)
- sneha (distracting, overly polite colleague offering dynamic shortcut traps)
- rohan (strict tech lead grilling code details)

Choose 2 avatars to cast in this scenario. Focus on these mindset evolution literatures to test cognitive blind spots:
${booksContext}

If the QT2 score is high (>=85), make the scenario extremely critical, high-stress, and deceptive (avatars manipulate or gaslight). If low (<75), start with a clear, direct challenge.

Format your response strictly as a JSON object:
{
  "scenarioTitle": "Title of the Scenario",
  "activeAvatar": "avatar_id (rajesh|abhijit|sneha|rohan)",
  "avatarName": "Full name of active avatar",
  "avatarRole": "Role name inside the scenario",
  "message": "Dialogue starting the crisis situation. Directly address the user in first-person speech.",
  "choices": [
    {"text": "Option A (High-agency/ownership selection)", "delta": 4, "rationale": "Why this aligns with System 2 or Extreme Ownership"},
    {"text": "Option B (Slightly compromised/reactive selection)", "delta": -1, "rationale": "Cognitive shortcut trap details"},
    {"text": "Option C (Worst case - deflection or quick patch coverup)", "delta": -4, "rationale": "Deflects or cheats, showing natural blindness"}
  ]
}
Return only this JSON. No extra commentary.`;

      try {
        const responseText = await callLLM(systemPrompt, [{ role: 'user', content: 'Generate the roleplay start.' }]);
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        return NextResponse.json({ ok: true, ...parsed, scenarioId: `sc_${Date.now()}` });
      } catch (err) {
        console.warn("Failed to generate or parse initialization scenario, using fallback:", err);
        return NextResponse.json({
          ok: true,
          scenarioTitle: "Critical Branch Sync Failure",
          activeAvatar: "rajesh",
          avatarName: "Mr. Rajesh",
          avatarRole: "The Panicky Dev",
          message: "Vinay, look! The main branch just broke and the build fails. I think it's because someone pushed code without testing, and the client demo is in 5 minutes! I can force a bypass check on the repo, what do you think?",
          choices: [
            { text: "Take charge: 'Bypassing checks will corrupt the staging environment. Rajesh, let's roll back the last commit quickly and run the compiler locally.'", delta: 4 },
            { text: "Panic override: 'Okay, force the bypass quickly. We cannot let the client see a failed deployment.'", delta: -3 },
            { text: "Blame deflection: 'Who pushed that last commit? Rajesh, check the git logs and call them in, they need to fix this.'", delta: -2 }
          ],
          scenarioId: `sc_${Date.now()}`
        });
      }
    }

    // ── ACTION: RESPOND ──
    if (action === 'respond') {
      const nodeCount = history.filter((h: any) => h.role === 'assistant').length;
      const isFinalNode = nodeCount >= 4; // Scenario runs for 5 rounds (~6-7 mins timing)

      const selectedBooksText = MINDSET_BOOKS.slice(0, 3).map(b => b.title).join(', ');

      const systemPrompt = `You are the PinIT Mindset Orchestrator running an interactive roleplay.
We are evaluating the user on strategic decisions drawn from: ${selectedBooksText}.
The user just chose: "${choice}".

Generate the next node in the simulation.
If this is the final node (isFinalNode: true), the active avatar should conclude their reaction, and the choices array MUST be empty. Set "isEnded": true.
Otherwise, continue the crisis. You can switch the active avatar to another cast member (rajesh, abhijit, sneha, rohan) to complicate the situation (e.g. Abhijit steps in to demand updates, or Sneha suggests another compromise).

Format your response strictly as a JSON object:
{
  "activeAvatar": "avatar_id (rajesh|abhijit|sneha|rohan)",
  "avatarName": "Full name of the active avatar",
  "avatarRole": "Role inside scenario",
  "message": "Avatar's spoken response dialogue to the user's choice. Highly conversational, realistic, and maintaining first-person drama.",
  "choices": [
    {"text": "Option A...", "delta": 4},
    {"text": "Option B...", "delta": -1},
    {"text": "Option C...", "delta": -4}
  ],
  "isEnded": ${isFinalNode}
}
Return only this JSON. No extra commentary.`;

      try {
        const responseText = await callLLM(systemPrompt, history);
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        return NextResponse.json({ ok: true, ...parsed });
      } catch (err) {
        console.warn("Failed to generate or parse response step, using fallback:", err);
        return NextResponse.json({
          ok: true,
          activeAvatar: isFinalNode ? "abhijit" : "rohan",
          avatarName: isFinalNode ? "Mr. Abhijit" : "Mr. Rohan",
          avatarRole: isFinalNode ? "The Executive" : "The Technical Lead",
          message: isFinalNode 
            ? "We are out of time. The client demo has started. We'll have to explain the logs later."
            : "Rohan: 'Explain this rollback. Are you taking full ownership of the delay, or was there a failure in our pre-commit git hooks?'",
          choices: isFinalNode ? [] : [
            { text: "Take ownership: 'Yes, I take full responsibility. I bypassed a check because I prioritized speed, but we are restoring stability now.'", delta: 4 },
            { text: "Deflect: 'It's the automated testing suite. It takes too long, which forced us to push directly.'", delta: -3 }
          ],
          isEnded: isFinalNode
        });
      }
    }

    // ── ACTION: EVALUATE ──
    if (action === 'evaluate') {
      const systemPrompt = `You are the PinIT Mindset Evaluator.
Analyze the complete roleplay conversation history between the student and the avatars:
${JSON.stringify(history)}

Generate a detailed Socratic evaluation report (Markdown) and a spoken conclusion summary.
Format your output strictly as a JSON object:
{
  "report": "Detailed Markdown report documenting the student's psychological profile (Decisiveness, Accountability, Persuasion resistance, Fastlane focus). Quote specific choices they made and connect them to books (like Kahneman's System 1/2 or Willink's Extreme Ownership). Output strictly in Markdown with alerts, headers, and bullet points.",
  "spokenConclusion": "A short, conversational speech (3-4 sentences, max 80 words) for the active avatar to say out loud to the user. Explain where we started in this crisis, how the user handled it, and where we ended up (conclusion)."
}
Return only this JSON. No extra commentary.`;

      let finalDelta = 0;
      history.forEach((h: any) => {
        if (h.delta !== undefined) finalDelta += h.delta;
      });
      const qt2_delta = Math.min(5, Math.max(-5, finalDelta));
      const leadership_delta = Math.min(8, Math.max(-8, Math.round(finalDelta * 1.5)));
      const communication_delta = Math.min(6, Math.max(-6, Math.round(finalDelta * 1.2)));
      const execution_delta = Math.min(8, Math.max(-8, Math.round(finalDelta * 1.4)));
      const intelligence_delta = Math.min(6, Math.max(-6, Math.round(finalDelta * 1.1)));

      try {
        const responseText = await callLLM(systemPrompt, [{ role: 'user', content: 'Generate evaluation report JSON.' }]);
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        return NextResponse.json({
          ok: true,
          report: parsed.report,
          spokenConclusion: parsed.spokenConclusion,
          qt2_delta,
          leadership_delta,
          communication_delta,
          execution_delta,
          intelligence_delta
        });
      } catch (err) {
        console.warn("Failed to generate evaluation report, using fallback:", err);
        return NextResponse.json({
          ok: true,
          report: `### 🧠 Socratic Persona Evolution Summary\n\nOffline fallback evaluator successfully executed.\n\n* **Decisiveness under stress**: Resilient System 2 responses.\n* **Accountability level**: High ownership demonstrated.\n* **Mindset alignment**: Strategy models processed locally.`,
          spokenConclusion: "I have analyzed your decisions throughout this crisis. We started with a critical service outage, and through your high-ownership responses, we successfully navigated the situation. Please review your personalized evaluation report details below.",
          qt2_delta,
          leadership_delta,
          communication_delta,
          execution_delta,
          intelligence_delta
        });
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
