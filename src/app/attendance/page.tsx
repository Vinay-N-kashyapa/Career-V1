'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { toast } from '@/lib/store/useAppStore';

export default function AttendancePage() {
  const qc = useQueryClient();
  const [scanning, setScanning]   = useState(false);
  const [tab, setTab]             = useState<'mark'|'logs'|'report'>('mark');
  const [orgId]                   = useState('default'); // institution's orgId

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['attendance', 'logs'],
    queryFn:  () => api.get<{ logs: AttendanceLog[] }>('/api/attendance/logs?limit=50').then(r => r.logs),
    enabled:  tab === 'logs',
  });

  const { data: report } = useQuery({
    queryKey: ['attendance', 'report'],
    queryFn:  () => api.get<{ report: AttendanceReport[] }>(`/api/attendance/report?orgId=${orgId}`).then(r => r.report),
    enabled:  tab === 'report',
  });

  const identifyMutation = useMutation({
    mutationFn: (imageData: string) =>
      api.post<{ ok: boolean; event: string; confidence: number; flagged: boolean }>
      ('/api/attendance/identify', { orgId, imageData, deviceId: navigator.userAgent }),
    onSuccess: (data) => {
      if (data.ok) {
        toast.success('✅ Attendance Marked', `Confidence: ${Math.round(data.confidence * 100)}%${data.flagged ? ' (flagged for review)' : ''}`);
        qc.invalidateQueries({ queryKey: ['attendance'] });
      }
    },
    onError: (err: any) => {
      toast.error('Face Not Recognized', err.message || 'Please try again or use OTP');
    },
  });

  async function startScan() {
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      const video  = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      // Capture frame
      const canvas = document.createElement('canvas');
      canvas.width  = video.videoWidth  || 640;
      canvas.height = video.videoHeight || 480;
      canvas.getContext('2d')!.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

      stream.getTracks().forEach(t => t.stop());
      await identifyMutation.mutateAsync(imageData);
    } catch (err: any) {
      toast.error('Camera Error', err.message || 'Could not access camera');
    } finally {
      setScanning(false);
    }
  }

  const TABS = [
    { id: 'mark',   label: 'Mark Attendance' },
    { id: 'logs',   label: 'Logs' },
    { id: 'report', label: 'Report' },
  ] as const;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>
          Secure Attendance
        </h1>
        <p style={{ color: 'var(--t2)', fontSize: 13 }}>
          AI face recognition attendance — liveness detection prevents proxy attendance
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
              background: tab === t.id ? 'var(--accent)' : 'var(--bg2)',
              color: tab === t.id ? '#fff' : 'var(--t2)',
              border: tab === t.id ? 'none' : '1px solid var(--border)',
            }}>{t.label}</button>
        ))}
      </div>

      {/* Mark attendance */}
      {tab === 'mark' && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📸</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Face Scan</h2>
          <p style={{ color: 'var(--t2)', fontSize: 13, marginBottom: 24 }}>
            Look directly at the camera. The system will verify your identity and mark attendance.
          </p>
          <button
            onClick={startScan}
            disabled={scanning || identifyMutation.isPending}
            style={{
              padding: '12px 32px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer',
              opacity: (scanning || identifyMutation.isPending) ? 0.6 : 1,
            }}
          >
            {scanning ? 'Scanning...' : identifyMutation.isPending ? 'Processing...' : 'Start Face Scan'}
          </button>
          <div style={{ marginTop: 16, fontSize: 12, color: 'var(--t3)' }}>
            Having trouble? <button onClick={() => toast.info('OTP Fallback', 'Check your registered email for OTP')}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 12 }}>
              Use OTP instead
            </button>
          </div>
        </div>
      )}

      {/* Logs */}
      {tab === 'logs' && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          {logsLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--t3)' }}>Loading logs...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg2)', fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {['User', 'Event', 'Confidence', 'Time', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(logs || []).map((log, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--border)', fontSize: 13 }}>
                    <td style={{ padding: '10px 14px' }}>{log.userId?.slice(0, 8)}...</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ background: log.event === 'present' ? 'var(--green-light)' : 'var(--amber-light)',
                        color: log.event === 'present' ? 'var(--green)' : 'var(--amber)',
                        padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>
                        {log.event}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>{Math.round((log.confidence || 0) * 100)}%</td>
                    <td style={{ padding: '10px 14px', color: 'var(--t3)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {log.flagged && <span style={{ color: 'var(--amber)', fontSize: 11 }}>⚠ Flagged</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Report */}
      {tab === 'report' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
          {(report || []).map((r, i) => (
            <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4 }}>Student</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.userId?.slice(0, 8)}...</div>
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: r.attendanceRate >= 75 ? 'var(--green)' : 'var(--coral)' }}>
                  {Math.round(r.attendanceRate || 0)}%
                </div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>
                  {r.presentDays}/{r.totalDays} days
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface AttendanceLog {
  userId: string; event: string; confidence: number;
  timestamp: string; flagged: boolean;
}
interface AttendanceReport {
  userId: string; presentDays: number; totalDays: number;
  attendanceRate: number; absenceDays: number;
}
