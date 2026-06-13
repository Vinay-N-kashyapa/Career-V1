'use client';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/context/AuthContext';

const AdminDashboard = dynamic(
  () => import('@/components/_legacy/dsai/AdminPages').then((m: any) => ({ default: m.AdminDashboard })),
  { ssr: false, loading: () => <div style={{ padding:40, color:'var(--t3)', textAlign:'center' }}>Loading DSAI Admin...</div> }
) as any;

export default function AdminExamsPage() {
  const { user } = useAuth();
  if (!user || user.role !== 'admin') return <div style={{ padding:40, color:'var(--coral)' }}>Access denied</div>;
  return (
    <div>
      <div style={{ marginBottom:16 }}>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800 }}>Exam Engine Admin</h1>
        <p style={{ color:'var(--t2)', fontSize:13 }}>Manage exams, questions, schedules — full DSAI exam platform</p>
      </div>
      <AdminDashboard admin={user} onLogout={() => window.location.href = '/login'} />
    </div>
  );
}
