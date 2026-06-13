'use client';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/context/AuthContext';

const TeacherDashboard = dynamic(
  () => import('@/components/_legacy/dsai/TeacherPages').then(m => ({ default: m.TeacherDashboard })),
  { ssr: false, loading: () => <div style={{ padding:40, color:'var(--t3)', textAlign:'center' }}>Loading...</div> }
);

export default function TeacherPage() {
  const { user } = useAuth();
  if (!user || !['teacher','admin'].includes(user.role)) return <div style={{ padding:40, color:'var(--coral)' }}>Access denied</div>;
  return (
    <div>
      <div style={{ marginBottom:16 }}>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800 }}>Teacher Panel</h1>
        <p style={{ color:'var(--t2)', fontSize:13 }}>Create coding questions, manage exam schedules, view student results</p>
      </div>
      <TeacherDashboard teacher={user} onLogout={() => window.location.href = '/login'} />
    </div>
  );
}
