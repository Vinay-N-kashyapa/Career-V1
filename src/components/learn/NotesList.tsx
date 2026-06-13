// apps/web/src/components/learn/NotesList.tsx
'use client';

import { useEffect, useState } from 'react';

interface Note { id: string; title: string; file_name: string; word_count: number; created_at: string; }
interface Props { selected: string[]; onSelect: (ids: string[]) => void; }

export default function NotesList({ selected, onSelect }: Props) {
  const [notes,    setNotes]    = useState<Note[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [uploading,setUploading]= useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    fetch('/api/notes', { credentials:'include' })
      .then(r => r.json())
      .then(({ notes: n }) => setNotes(n || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function toggle(id: string) {
    onSelect(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  }

  async function uploadFile(file: File) {
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/notes/upload', { method:'POST', body:form, credentials:'include' });
      const { note } = await res.json();
      if (note) { setNotes(prev => [note, ...prev]); onSelect([...selected, note.id]); }
    } catch {}
    finally { setUploading(false); }
  }

  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:10, letterSpacing:1.5, textTransform:'uppercase', color:'var(--t3)', fontFamily:'var(--font-mono)', marginBottom:10 }}>
        Study Notes {selected.length > 0 && `(${selected.length} selected)`}
      </div>

      {/* Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) uploadFile(f); }}
        onClick={() => document.getElementById('note-upload')?.click()}
        style={{
          border:`2px dashed ${dragOver ? 'var(--accent)' : 'var(--border2)'}`,
          borderRadius:8, padding:'14px', textAlign:'center',
          cursor:'pointer', background: dragOver ? 'rgba(91,91,214,0.05)' : 'transparent',
          marginBottom:12, transition:'all 0.2s', fontSize:12, color:'var(--t3)',
        }}
      >
        {uploading ? 'Uploading...' : '+ Drop PDF/DOCX/TXT to upload notes'}
        <input id="note-upload" type="file" accept=".pdf,.docx,.doc,.txt" style={{display:'none'}}
          onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])} />
      </div>

      {/* Notes list */}
      {loading ? (
        <div style={{ color:'var(--t3)', fontSize:12 }}>Loading notes...</div>
      ) : notes.length === 0 ? (
        <div style={{ color:'var(--t3)', fontSize:12 }}>No notes yet. Upload a PDF or DOCX to start.</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:200, overflowY:'auto' }}>
          {notes.map(n => (
            <div
              key={n.id}
              onClick={() => toggle(n.id)}
              style={{
                display:'flex', alignItems:'center', gap:10, padding:'8px 12px',
                borderRadius:8, cursor:'pointer',
                background: selected.includes(n.id) ? 'rgba(91,91,214,0.1)' : 'var(--card)',
                border:`1px solid ${selected.includes(n.id) ? 'rgba(91,91,214,0.3)' : 'var(--border)'}`,
                transition:'all 0.15s',
              }}
            >
              <span style={{ fontSize:16 }}>📄</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.title}</div>
                <div style={{ fontSize:10, color:'var(--t3)' }}>{n.word_count?.toLocaleString()} words</div>
              </div>
              {selected.includes(n.id) && <span style={{ color:'var(--accent)', fontSize:14 }}>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
