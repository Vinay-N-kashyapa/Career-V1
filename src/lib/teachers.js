// utils/teachers.js
export const TEACHERS = [
  {
    id:     'priya',
    name:   'Ms. Priya',
    emoji:  '👩‍🏫',
    gender: 'female',
    type:   'Friendly & Patient',
    desc:   'Warm, encouraging tone. Uses simple analogies. Perfect for building confidence.',
    color:  '#f472b6',
    bg:     'rgba(244,114,182,.12)',
    border: 'rgba(244,114,182,.28)',
    tags:   ['Beginner-friendly', 'Encouraging', 'Female'],
  },
  {
    id:     'aisha',
    name:   'Ms. Aisha',
    emoji:  '👩‍💼',
    gender: 'female',
    type:   'Calm & Structured',
    desc:   'Organised, exam-focused, methodical. Breaks everything into clear steps.',
    color:  '#818cf8',
    bg:     'rgba(129,140,248,.12)',
    border: 'rgba(129,140,248,.28)',
    tags:   ['Exam-focused', 'Structured', 'Female'],
  },
  {
    id:     'rohan',
    name:   'Mr. Rohan',
    emoji:  '👨‍🏫',
    gender: 'male',
    type:   'Energetic & Fun',
    desc:   'Enthusiastic, gamified style. Makes even dry topics exciting.',
    color:  '#fb923c',
    bg:     'rgba(251,146,60,.12)',
    border: 'rgba(251,146,60,.28)',
    tags:   ['Energetic', 'Fun', 'Male'],
  },
  {
    id:     'vikram',
    name:   'Mr. Vikram',
    emoji:  '👨‍💼',
    gender: 'male',
    type:   'Strict & Thorough',
    desc:   'Rigorous, high standards. Pushes you to think deeper and score higher.',
    color:  '#34d399',
    bg:     'rgba(52,211,153,.12)',
    border: 'rgba(52,211,153,.28)',
    tags:   ['Advanced', 'Rigorous', 'Male'],
  },
];

export const MODES = [
  { id:'explain',   icon:'🎓', label:'Explain',       desc:'Teach me this topic',         color:'#818cf8' },
  { id:'oral',      icon:'🎤', label:'Oral Test',     desc:'Quiz me verbally',            color:'#f472b6' },
  { id:'written',   icon:'✍️', label:'Written Test',  desc:'Generate a written quiz',     color:'#fb923c' },
  { id:'flashcard', icon:'🃏', label:'Flashcards',    desc:'Key term flashcards to review', color:'#a78bfa' },
  { id:'summary',   icon:'📋', label:'Summary',       desc:'Compact revision summary',    color:'#34d399' },
];

export function getTeacher(id) {
  return TEACHERS.find(t => t.id === id) || TEACHERS[0];
}
