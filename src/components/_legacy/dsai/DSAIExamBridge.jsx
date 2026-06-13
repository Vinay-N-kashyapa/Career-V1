// apps/web/src/components/_legacy/dsai/DSAIExamBridge.jsx
// ── DSAI Exam Bridge ──
// Renders the real DSAI App (LandingPage + StudentLogin + ExamEngine)
// Intercepts exam completion to sync results to PinIT career system
// Uses exact DSAI code from legacy/DSAI-REACT/src/

'use client';

import React, { useEffect } from 'react';

// ── Import DSAI source components directly from legacy ──
// These are the EXACT original files, unchanged
import { ToastProvider } from '@/lib/context/ToastContext';
import LandingPage from './LandingPage';
import { StudentLogin, StudentDashboard, clearStudentCache } from './StudentPages';
import { ExamEngine, ExamStartModal } from './ExamEngine';

// PinIT sync
async function syncExamToPinIT(result, userId) {
  try {
    await fetch('/api/exam/sync-result', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        firebaseResultId: result.id || result.answerSheetId,
        registerNumber:   result.registerNumber,
        examScheduleId:   result.examScheduleId,
        examName:         result.examTitle,
        examType:         'mcq',
        score:            parseFloat(result.score?.split('/')[0] || 0),
        totalMarks:       parseFloat(result.score?.split('/')[1] || 100),
        tabSwitches:      result.tabSwitches || 0,
        userId,
      }),
    });
    // Trigger DNA recalculation
    if (parseFloat(result.percentage) >= 70) {
      await fetch('/api/career-dna/calculate', { method: 'POST', credentials: 'include' });
    }
  } catch (e) {
    console.warn('[ExamBridge] PinIT sync failed:', e.message);
  }
}

export default function DSAIExamBridge({ userId, registerNumber, examId }) {
  const [screen,          setScreen]          = React.useState('landing');
  const [student,         setStudent]         = React.useState(null);
  const [pendingExam,     setPendingExam]     = React.useState(null);
  const [examCheckLoading,setExamCheckLoading]= React.useState(false);

  // Pre-fill student register number if available from PinIT auth
  useEffect(() => {
    if (registerNumber && screen === 'landing') {
      setScreen('student-login');
    }
  }, [registerNumber]);

  function handleStudentLogin(studentData) {
    setStudent(studentData);
    setScreen('student-dashboard');
  }

  function handleStudentLogout() {
    clearStudentCache();
    setStudent(null);
    setScreen('landing');
  }

  async function handleStartExamRequest(examSchedule) {
    setExamCheckLoading(true);
    const { DB } = await import('@/lib/firebase');
    try {
      const results    = await DB.getAll('exam_results');
      const alreadyDone = results.find(
        r => r.registerNumber === student.registerNumber && r.examScheduleId === examSchedule.id
      );
      if (alreadyDone) { alert('You have already attempted this exam.'); return; }
      setPendingExam(examSchedule);
      setScreen('exam-start');
    } finally {
      setExamCheckLoading(false);
    }
  }

  async function handleExamFinished(result) {
    // Sync to PinIT PostgreSQL
    if (result && userId) {
      await syncExamToPinIT(result, userId);
    }
    setPendingExam(null);
    setScreen('student-dashboard');
  }

  switch (screen) {
    case 'landing':
      return (
        <ToastProvider>
          <LandingPage
            onStudentLogin={() => setScreen('student-login')}
            onAdminLogin={() => window.location.href = '/admin'}
            onTeacherLogin={() => window.location.href = '/admin/teacher'}
          />
        </ToastProvider>
      );
    case 'student-login':
      return (
        <ToastProvider>
          <StudentLogin onBack={() => setScreen('landing')} onSuccess={handleStudentLogin} />
        </ToastProvider>
      );
    case 'student-dashboard':
    case 'exam-start':
      return (
        <ToastProvider>
          <StudentDashboard
            student={student}
            onLogout={handleStudentLogout}
            onStartExam={handleStartExamRequest}
            examCheckLoading={examCheckLoading}
          />
          {pendingExam && screen === 'exam-start' && (
            <ExamStartModal
              exam={pendingExam}
              student={student}
              onConfirm={() => setScreen('exam')}
              onCancel={() => { setPendingExam(null); setScreen('student-dashboard'); }}
            />
          )}
        </ToastProvider>
      );
    case 'exam':
      return (
        <ToastProvider>
          <ExamEngine
            exam={pendingExam}
            student={student}
            onFinish={handleExamFinished}
          />
        </ToastProvider>
      );
    default:
      return null;
  }
}
