// components/ChatMessage.jsx
// Fix: wrapped in React.memo to prevent re-render on every parent state change
import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { getTeacher } from '../utils/teachers';

const ChatMessage = memo(function ChatMessage({ role, content, teacherId }) {
  const teacher   = getTeacher(teacherId);
  const isTeacher = role === 'assistant';

  return (
    <div style={{
      display: 'flex', gap: 8, alignItems: 'flex-start',
      flexDirection: isTeacher ? 'row' : 'row-reverse',
      animation: 'fadeUp .2s var(--ease) both',
    }}>
      {/* Avatar chip */}
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: isTeacher ? teacher.bg : 'rgba(62,207,120,.12)',
        border: `1px solid ${isTeacher ? teacher.border : 'rgba(62,207,120,.25)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13,
      }}>
        {isTeacher ? teacher.emoji : '👤'}
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: '74%',
        padding: '9px 13px',
        borderRadius: isTeacher ? '3px 12px 12px 12px' : '12px 3px 12px 12px',
        background: isTeacher ? 'var(--card)' : 'rgba(108,99,255,.1)',
        border: `1px solid ${isTeacher ? 'var(--line)' : 'rgba(108,99,255,.22)'}`,
        fontSize: 12.5, lineHeight: 1.6, color: 'var(--t1)',
      }}>
        {isTeacher && (
          <div style={{ fontSize: 9, fontWeight: 700, color: teacher.color, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.06em' }}>
            {teacher.name}
          </div>
        )}
        <ReactMarkdown
          components={{
            p:          ({ children }) => <p style={{ margin: '0 0 4px' }}>{children}</p>,
            strong:     ({ children }) => <strong style={{ color: isTeacher ? teacher.color : '#a5b4fc', fontWeight: 700 }}>{children}</strong>,
            ul:         ({ children }) => <ul style={{ paddingLeft: 15, margin: '4px 0' }}>{children}</ul>,
            ol:         ({ children }) => <ol style={{ paddingLeft: 15, margin: '4px 0' }}>{children}</ol>,
            li:         ({ children }) => <li style={{ marginBottom: 2 }}>{children}</li>,
            code:       ({ children }) => <code style={{ background: 'rgba(255,255,255,.07)', padding: '1px 5px', borderRadius: 4, fontFamily: 'monospace', fontSize: 11 }}>{children}</code>,
            h3:         ({ children }) => <h3 style={{ fontSize: 12, fontWeight: 700, color: teacher.color, margin: '8px 0 4px' }}>{children}</h3>,
            blockquote: ({ children }) => <blockquote style={{ borderLeft: `3px solid ${teacher.color}`, paddingLeft: 10, margin: '6px 0', color: 'var(--t2)', fontStyle: 'italic' }}>{children}</blockquote>,
            hr:         () =>             <div style={{ height: 1, background: 'var(--line)', margin: '8px 0' }} />,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
});

export default ChatMessage;
