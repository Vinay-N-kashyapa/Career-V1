"use strict";
// lib/career-archetypes.ts
// Shared archetype definitions and personality scoring.
// Used by: app/onboarding/page.tsx + app/career-dna/page.tsx
//
// The 6 archetypes from Image 7 (CareerDNA Identity System mockup).
// Archetype is derived from a 6-question personality scan. Scores stored
// in career_profiles.career_dna_archetype (schema migration v5).
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_SALARY = exports.PERSONALITY_QUESTIONS = exports.ARCHETYPES = void 0;
exports.computeArchetype = computeArchetype;
exports.getArchetype = getArchetype;
exports.ARCHETYPES = [
    {
        id: 'strategist',
        label: 'The Strategist',
        icon: '♟',
        color: 'var(--purple)',
        gradient: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
        tagline: 'You turn ideas into impact through strategy and insight.',
        description: 'You see the big picture and plan the winning moves. Natural at connecting dots others miss.',
        traits: ['Strategic', 'Analytical', 'Vision-Driven'],
        bestFit: ['Product Manager', 'Management Consultant', 'Business Analyst'],
    },
    {
        id: 'builder',
        label: 'The Builder',
        icon: '🔨',
        color: 'var(--teal)',
        gradient: 'linear-gradient(135deg, #0d9488, #0891b2)',
        tagline: 'You build, iterate and turn ideas into real solutions.',
        description: 'You thrive building things from scratch. Give you a problem, you\'ll ship a solution.',
        traits: ['Hands-on', 'Problem-Solver', 'Iterative'],
        bestFit: ['Software Engineer', 'Full Stack Developer', 'DevOps Engineer'],
    },
    {
        id: 'visionary',
        label: 'The Visionary',
        icon: '🔭',
        color: 'var(--amber)',
        gradient: 'linear-gradient(135deg, #d97706, #ea580c)',
        tagline: 'You dream big and inspire others with your possibilities.',
        description: 'Bold, creative, future-oriented. You see where things are going before anyone else.',
        traits: ['Creative', 'Inspiring', 'Future-Focused'],
        bestFit: ['Startup Founder', 'Design Lead', 'Innovation Manager'],
    },
    {
        id: 'operator',
        label: 'The Operator',
        icon: '⚙',
        color: 'var(--green)',
        gradient: 'linear-gradient(135deg, #059669, #0d9488)',
        tagline: 'You execute with precision and get things done.',
        description: 'You\'re the engine. Reliable, consistent, process-oriented. Things just happen around you.',
        traits: ['Reliable', 'Process-Driven', 'Consistent'],
        bestFit: ['Operations Manager', 'Data Engineer', 'Project Manager'],
    },
    {
        id: 'analyst',
        label: 'The Analyst',
        icon: '📊',
        color: 'var(--accent)',
        gradient: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
        tagline: 'You analyze deeply and make data drive decisions.',
        description: 'Evidence over instinct. You find signals in noise and turn numbers into clarity.',
        traits: ['Data-Driven', 'Methodical', 'Curious'],
        bestFit: ['Data Scientist', 'Data Analyst', 'Research Engineer'],
    },
    {
        id: 'creator',
        label: 'The Creator',
        icon: '✏️',
        color: 'var(--pink, #ec4899)',
        gradient: 'linear-gradient(135deg, #db2777, #9333ea)',
        tagline: 'You create content that educates and inspires.',
        description: 'Expression is your strength. You communicate complex ideas in compelling, beautiful ways.',
        traits: ['Expressive', 'Communicative', 'Design-Minded'],
        bestFit: ['UI/UX Designer', 'Technical Writer', 'Developer Advocate'],
    },
];
exports.PERSONALITY_QUESTIONS = [
    {
        id: 'problem',
        text: 'Do you enjoy solving complex problems?',
        options: [
            { label: 'Absolutely! I love complex challenges', emoji: '😄', weights: { analyst: 3, builder: 2, strategist: 1 } },
            { label: 'Yes, I enjoy it most of the time', emoji: '🙂', weights: { analyst: 2, builder: 2, operator: 1 } },
            { label: 'Sometimes, it depends', emoji: '😐', weights: { operator: 2, creator: 2 } },
            { label: 'I prefer simpler, clear tasks', emoji: '😕', weights: { operator: 3, creator: 1 } },
        ],
    },
    {
        id: 'work_style',
        text: 'When starting a new project, you first...',
        options: [
            { label: 'Map out the full strategy and milestones', emoji: '🗺', weights: { strategist: 3, analyst: 2 } },
            { label: 'Dive in and build a prototype fast', emoji: '⚒', weights: { builder: 3, operator: 1 } },
            { label: 'Imagine the ideal end state', emoji: '✨', weights: { visionary: 3, creator: 2 } },
            { label: 'Collect data and analyse the problem', emoji: '🔬', weights: { analyst: 3, strategist: 1 } },
        ],
    },
    {
        id: 'motivation',
        text: 'What motivates you most at work?',
        options: [
            { label: 'Seeing something I built being used', emoji: '🚀', weights: { builder: 3, operator: 2 } },
            { label: 'Making a lasting impact on people', emoji: '💫', weights: { visionary: 3, creator: 2 } },
            { label: 'Solving a puzzle no one else could', emoji: '🧩', weights: { analyst: 3, strategist: 2 } },
            { label: 'Running a smooth, well-oiled process', emoji: '⚙', weights: { operator: 3, strategist: 1 } },
        ],
    },
    {
        id: 'decision',
        text: 'How do you make important decisions?',
        options: [
            { label: 'Through data and evidence', emoji: '📊', weights: { analyst: 3, operator: 1 } },
            { label: 'By mapping pros, cons and strategy', emoji: '⚖', weights: { strategist: 3, analyst: 1 } },
            { label: 'By gut feeling and intuition', emoji: '💡', weights: { visionary: 2, creator: 2, builder: 1 } },
            { label: 'By what works in practice', emoji: '🔧', weights: { builder: 2, operator: 3 } },
        ],
    },
    {
        id: 'strength',
        text: 'Others see you as...',
        options: [
            { label: 'The planner — always thinking ahead', emoji: '🗓', weights: { strategist: 3, operator: 1 } },
            { label: 'The maker — gets things done', emoji: '🛠', weights: { builder: 3, operator: 2 } },
            { label: 'The creative — brings fresh ideas', emoji: '🎨', weights: { creator: 3, visionary: 2 } },
            { label: 'The analyst — finds the insight', emoji: '🔭', weights: { analyst: 3, strategist: 1 } },
        ],
    },
    {
        id: 'growth',
        text: 'In 5 years, you want to be known for...',
        options: [
            { label: 'Building products millions use', emoji: '📱', weights: { builder: 3, visionary: 2 } },
            { label: 'Driving strategy at a top company', emoji: '🏢', weights: { strategist: 3, analyst: 1 } },
            { label: 'Creating work that inspires people', emoji: '🌟', weights: { creator: 3, visionary: 2 } },
            { label: 'Being the expert others turn to for data', emoji: '🏆', weights: { analyst: 3, operator: 1 } },
        ],
    },
];
// ── Score computation ────────────────────────────────────────────────
function computeArchetype(answers) {
    const scores = {
        strategist: 0, builder: 0, visionary: 0, operator: 0, analyst: 0, creator: 0,
    };
    exports.PERSONALITY_QUESTIONS.forEach((q) => {
        const idx = answers[q.id];
        if (idx === undefined)
            return;
        const option = q.options[idx];
        if (!option)
            return;
        Object.entries(option.weights).forEach(([arch, w]) => {
            scores[arch] += w;
        });
    });
    return Object.entries(scores)
        .sort((a, b) => b[1] - a[1])[0][0];
}
function getArchetype(id) {
    return exports.ARCHETYPES.find((a) => a.id === id) ?? exports.ARCHETYPES[0];
}
// ── Salary data (used in onboarding Step 3) ────────────────────────
exports.ROLE_SALARY = {
    'Software Engineer': { min: '₹8L', max: '₹40L', growth: '+22%' },
    'Data Scientist': { min: '₹7L', max: '₹35L', growth: '+18%' },
    'Product Manager': { min: '₹10L', max: '₹45L', growth: '+15%' },
    'Data Analyst': { min: '₹5L', max: '₹20L', growth: '+12%' },
    'UI/UX Designer': { min: '₹6L', max: '₹28L', growth: '+20%' },
    'DevOps Engineer': { min: '₹9L', max: '₹38L', growth: '+25%' },
    'Machine Learning Engineer': { min: '₹10L', max: '₹50L', growth: '+30%' },
    'Business Analyst': { min: '₹6L', max: '₹25L', growth: '+10%' },
    'Full Stack Developer': { min: '₹8L', max: '₹35L', growth: '+22%' },
    'Cloud Engineer': { min: '₹9L', max: '₹40L', growth: '+28%' },
    'Cybersecurity Analyst': { min: '₹7L', max: '₹32L', growth: '+26%' },
    'Consultant': { min: '₹8L', max: '₹30L', growth: '+14%' },
};
