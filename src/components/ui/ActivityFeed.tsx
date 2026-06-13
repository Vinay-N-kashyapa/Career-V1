'use client';
import { useNotifications } from '@/lib/api/hooks';
import Link from 'next/link';
interface Notif { id:string; title:string; message:string; type:string; source:string; is_read:boolean; read?:boolean; created_at?:string; createdAt?:string; }
const TYPE_META: Record<string,{icon:string;color:string;bg:string}> = { success:{icon:'✓',color:'#22c55e',bg:'rgba(34,197,94,0.1)'}, warning:{icon:'!',color:'#f59e0b',bg:'rgba(245,158,11,0.1)'}, danger:{icon:'✗',color:'#ef4444',bg:'rgba(239,68,68,0.1)'}, info:{icon:'i',color:'#6366f1',bg:'rgba(99,102,241,0.1)'} };
const SOURCE_ICONS: Record<string,string> = { 'mission-engine':'⚡','resume-engine':'📄','interview-engine':'🎙','recruiter-engine':'📡','exam-engine':'📝','trust-engine':'🛡', recruiter:'👁', exam:'📝', attendance:'📸', payment:'💳', mission:'⚡', opportunities:'🎯', parent:'👨‍👩‍👧' };
function timeAgo(ts?:string){ if(!ts) return 'recently'; const m=Math.floor((Date.now()-new Date(ts).getTime())/60000); if(m<1) return 'just now'; if(m<60) return `${m}m ago`; const h=Math.floor(m/60); if(h<24) return `${h}h ago`; return `${Math.floor(h/24)}d ago`; }
export default function ActivityFeed({ userId }: { userId?:string }) {
  const { data, isLoading } = useNotifications();
  const raw = Array.isArray(data) ? data : [];
  const items: Notif[] = raw.map((n:any) => ({ ...n, is_read:n.is_read??n.read??false, created_at:n.created_at||n.createdAt }));
  if(isLoading) return <div style={{display:'flex',flexDirection:'column',gap:8}}>{[...Array(3)].map((_,i)=><div key={i} className="skeleton" style={{height:56,borderRadius:10}}/>)}</div>;
  if(!items.length) return <div style={{padding:'28px 20px',textAlign:'center'}}><div style={{fontSize:28,marginBottom:8}}>◎</div><div style={{fontSize:13,fontWeight:600,color:'var(--t2)',marginBottom:4}}>No activity yet</div><div style={{fontSize:12,color:'var(--t4)'}}>Complete missions and upload your resume to see activity here.</div></div>;
  return (
    <div style={{display:'flex',flexDirection:'column',gap:7}}>
      {items.slice(0,8).map(item=>{
        const meta=TYPE_META[item.type]||TYPE_META.info;
        const srcIcon=SOURCE_ICONS[item.source]||'◉';
        const unread=!item.is_read;
        return (
          <div key={item.id} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'10px 12px',background:unread?'rgba(99,102,241,0.06)':'var(--bg3)',border:`1px solid ${unread?'rgba(99,102,241,0.2)':'var(--border)'}`,borderRadius:10,transition:'all 0.15s',position:'relative'}}>
            {unread&&<span style={{position:'absolute',top:10,right:10,width:6,height:6,borderRadius:'50%',background:'#6366f1'}}/>}
            <span style={{width:32,height:32,borderRadius:8,background:meta.bg,border:`1px solid ${meta.color}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:meta.color,flexShrink:0}}>{meta.icon}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12.5,fontWeight:unread?700:500,color:'var(--t1)',marginBottom:2,display:'flex',alignItems:'center',gap:5}}><span style={{fontSize:11}}>{srcIcon}</span><span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.title}</span></div>
              {item.message&&<div style={{fontSize:11.5,color:'var(--t3)',lineHeight:1.4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.message}</div>}
            </div>
            <span style={{fontSize:10,color:'var(--t4)',fontFamily:'var(--font-mono)',whiteSpace:'nowrap',flexShrink:0,marginTop:1}}>{timeAgo(item.created_at)}</span>
          </div>
        );
      })}
      {items.length>8&&<Link href="/notifications" style={{textAlign:'center',fontSize:12,color:'var(--accent)',fontWeight:600,textDecoration:'none',padding:'4px 0',fontFamily:'var(--font-mono)'}}>View all {items.length} notifications →</Link>}
    </div>
  );
}
