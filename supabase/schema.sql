-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Clean wipe: Drop all existing tables and data cascade-style (drops dependent constraints automatically)
drop table if exists public.qr_login_sessions cascade;
drop table if exists public.audit_logs cascade;
drop table if exists public.sessions cascade;
drop table if exists public.interview_sessions cascade;
drop table if exists public.notifications cascade;
drop table if exists public.applications cascade;
drop table if exists public.jobs cascade;
drop table if exists public.opportunities cascade;
drop table if exists public.missions cascade;
drop table if exists public.vault_items cascade;
drop table if exists public.users cascade;

-- 1. Create Profiles table (linked to auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  username text,
  email text,
  display_name text,
  role text default 'student',
  subscription_tier text default 'free',
  register_number text,
  selected_teacher_id text default 'priya',
  
  -- Scores and Competencies
  ats_score int default 0,
  trust_score int default 40,
  career_dna_score int default 0,
  career_readiness int default 0,
  intelligence_score int default 0,
  communication_score int default 60,
  execution_score int default 60,
  leadership_score int default 60,
  consistency_score int default 60,
  adaptability_score int default 60,
  confidence_score int default 60,
  innovation_score int default 60,
  
  -- Progression & Streaks
  mission_streak int default 0,
  missions_completed int default 0,
  interviews_done int default 0,
  vault_count int default 0,
  xp_total int default 0,
  xp_level int default 1,
  target_role text default '',
  career_goal text default '',
  career_dna_archetype text default 'explorer',
  
  -- Onboarding & Gaps
  onboarding_step int default 0,
  onboarding_answers jsonb default '{"role": "", "education": "", "skills": "", "experience": "", "hasCompleted": false}'::jsonb,
  jd_missing_skills text[] default '{}'::text[],
  weak_areas text[] default '{}'::text[],
  skill_tags text[] default '{}'::text[],
  certifications text[] default '{}'::text[],
  structured_resume jsonb default null,
  
  -- Pins Currency System
  pins int default 100,
  pin_history jsonb default '[]'::jsonb,
  
  -- UI & Bypass flags
  resume_generated boolean default false,
  roadmap_generated boolean default false,
  completed_quests text[] default '{}'::text[],
  java_test_passed boolean default false,
  recruiter_visible boolean default false,
  recruiter_visibility int default 0,
  force_show_career_builder boolean default false,
  demo_tabs_unlocked boolean default false,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Vault Items table
create table public.vault_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  title text not null,
  item_type text default 'resume',       -- e.g. 'resume', 'certification', 'project'
  organization_name text default '',
  description text default '',
  verified boolean default false,
  ai_confidence_score numeric default 0.0,
  skill_tags text[] default '{}'::text[],
  is_public boolean default false,
  used_in_resume boolean default false,
  used_in_portfolio boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Missions table
create table public.missions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  title text not null,
  description text,
  type text,
  status text default 'pending',
  proof_type text,
  due_date text,
  trust_reward int default 8,
  source_weakness text,
  estimated_minutes int default 20,
  learn_url text,
  ai_evaluation jsonb default null,
  proof jsonb default null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  submitted_at timestamp with time zone
);

-- 4. Create Opportunities table
create table public.opportunities (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  company text not null,
  location text,
  type text,
  salary text,
  match_score int,
  skills text[] default '{}'::text[],
  posted_at text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Create Jobs table (recruiter job postings)
create table public.jobs (
  id uuid default gen_random_uuid() primary key,
  recruiter_id uuid references public.users on delete cascade not null,
  title text not null,
  company text default '',
  location text default '',
  type text default 'Full-time',
  salary text default '',
  description text default '',
  skills text[] default '{}'::text[],
  is_deleted boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Create Applications table
create table public.applications (
  id text primary key, -- composite: user_id + opportunity_id
  user_id uuid references public.users on delete cascade not null,
  opportunity_id uuid references public.opportunities on delete cascade not null,
  status text default 'applied',
  applied_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone
);

-- 7. Create Notifications table
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  type text,
  title text,
  message text,
  source text,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Create Interview Sessions table
create table public.interview_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  mode text,
  domain text,
  pressure_mode text,
  persona text,
  status text default 'active',
  overall_score int default 0,
  transcript jsonb default '[]'::jsonb,
  evaluation jsonb default null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- 9. Create Sessions (CRM meetings) table
create table public.sessions (
  id uuid default gen_random_uuid() primary key,
  consultant_id uuid references public.users on delete cascade not null,
  student_id uuid references public.users on delete cascade not null,
  title text not null,
  date text,
  time text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. Create Audit Logs table
create table public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  admin_id uuid references public.users on delete cascade not null,
  action text not null,
  target_id text,
  meta jsonb default '{}'::jsonb,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. Create QR Login Sessions table (Realtime enabled)
create table public.qr_login_sessions (
  id uuid default gen_random_uuid() primary key,
  status text default 'ready',
  email text,
  password text,
  display_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone not null
);

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.vault_items enable row level security;
alter table public.missions enable row level security;
alter table public.opportunities enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.notifications enable row level security;
alter table public.interview_sessions enable row level security;
alter table public.sessions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.qr_login_sessions enable row level security;

-- Add RLS permissive policies
create policy "Allow all operations for users" on public.users for all using (true) with check (true);
create policy "Allow all operations for vault_items" on public.vault_items for all using (true) with check (true);
create policy "Allow all operations for missions" on public.missions for all using (true) with check (true);
create policy "Allow all operations for opportunities" on public.opportunities for all using (true) with check (true);
create policy "Allow all operations for jobs" on public.jobs for all using (true) with check (true);
create policy "Allow all operations for applications" on public.applications for all using (true) with check (true);
create policy "Allow all operations for notifications" on public.notifications for all using (true) with check (true);
create policy "Allow all operations for interview_sessions" on public.interview_sessions for all using (true) with check (true);
create policy "Allow all operations for sessions" on public.sessions for all using (true) with check (true);
create policy "Allow all operations for audit_logs" on public.audit_logs for all using (true) with check (true);
create policy "Allow all operations for qr_login_sessions" on public.qr_login_sessions for all using (true) with check (true);

-- Enable Supabase Realtime for QR Login
alter publication supabase_realtime add table public.qr_login_sessions;
