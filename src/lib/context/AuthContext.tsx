// AuthContext — Supabase Auth + Database
'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User as SbUser } from '@supabase/supabase-js';
import {
  getUserProfile, createUserProfile, updateUserProfile,
  ensureSeedData, DEMO_PROFILE, EMPTY_PROFILE, mapRowToProfile
} from '@/lib/supabaseService';

interface User {
  id:               string;
  username:         string;
  email:            string;
  displayName:      string;
  role:             string;
  subscription_tier?: string;
  registerNumber?:  string;
  selectedTeacherId?: string;
  atsScore?:        number;
  trustScore?:      number;
  careerDnaScore?:  number;
  missionStreak?:   number;
  [key: string]:    unknown;
}

interface AuthCtx {
  user:    User | null;
  loading: boolean;
  login:   (username: string, password: string) => Promise<any>;
  signup:  (data: SignupData) => Promise<void>;
  logout:  () => Promise<void>;
  refresh: () => Promise<void>;
}

interface SignupData {
  username:        string;
  password:        string;
  displayName:     string;
  role?:           string;
  registerNumber?: string;
}

const Ctx = createContext<AuthCtx | null>(null);

// Convert username to a valid email
function usernameToEmail(username: string): string {
  if (username.includes('@')) return username;
  return `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@pinit.app`;
}

function isDemoEmail(email: string): boolean {
  const e = email.toLowerCase();
  return e === 'admin@pinit.in' || e === 'rec@pinit.in' || e === 'con@pinit.in' || e === 'student@pinit.in';
}

function sbUserToAppUser(sbUser: SbUser, profile: Record<string, unknown> | null): User {
  let role = (profile?.role as string) || 'student';
  const emailLower = sbUser.email?.toLowerCase();
  if (emailLower === 'admin@pinit.in') role = 'admin';
  else if (emailLower === 'rec@pinit.in') role = 'recruiter';
  else if (emailLower === 'con@pinit.in') role = 'consultant';
  else if (emailLower === 'student@pinit.in') role = 'student';

  return {
    ...profile,
    id:          sbUser.id,
    username:    (profile?.username as string) || sbUser.email?.split('@')[0] || 'user',
    email:       sbUser.email || '',
    displayName: (profile?.displayName as string) || sbUser.user_metadata?.display_name || 'User',
    role:        role,
    registerNumber:   profile?.registerNumber as string | undefined,
    selectedTeacherId: profile?.selectedTeacherId as string | undefined,
    atsScore:         profile?.ats_score as number | undefined,
    trustScore:       profile?.trust_score as number | undefined,
    careerDnaScore:   profile?.career_dna_score as number | undefined,
    missionStreak:    profile?.mission_streak as number | undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (sbUser: SbUser) => {
    try {
      let profile = await getUserProfile(sbUser.id);
      if (!profile) {
        // New user — create profile with demo data
        let role = 'student';
        let displayName = 'User';
        const emailLower = sbUser.email?.toLowerCase();
        if (emailLower === 'admin@pinit.in') { role = 'admin'; displayName = 'System Admin'; }
        else if (emailLower === 'rec@pinit.in') { role = 'recruiter'; displayName = 'Lead Recruiter'; }
        else if (emailLower === 'con@pinit.in') { role = 'consultant'; displayName = 'Career Consultant'; }
        profile = {
          ...(isDemoEmail(sbUser.email || '') ? DEMO_PROFILE : EMPTY_PROFILE),
          uid:         sbUser.id,
          email:       sbUser.email || '',
          username:    sbUser.email?.split('@')[0] || 'user',
          displayName: sbUser.user_metadata?.display_name || displayName,
          role,
        };
        await createUserProfile(sbUser.id, profile);
      } else {
        // Self-healing check for existing profiles of default accounts
        const emailLower = sbUser.email?.toLowerCase();
        let expectedRole = null;
        if (emailLower === 'admin@pinit.in' && profile.role !== 'admin') expectedRole = 'admin';
        else if (emailLower === 'rec@pinit.in' && profile.role !== 'recruiter') expectedRole = 'recruiter';
        else if (emailLower === 'con@pinit.in' && profile.role !== 'consultant') expectedRole = 'consultant';
        
        if (expectedRole) {
          profile.role = expectedRole;
          await updateUserProfile(sbUser.id, { role: expectedRole });
        }
      }
      await ensureSeedData(sbUser.id, profile);
      setUser(sbUserToAppUser(sbUser, profile));
    } catch (err) {
      console.error('Profile load error:', err);
      setUser(sbUserToAppUser(sbUser, null));
    }
  }, []);

  useEffect(() => {
    let unsubSnapshot: (() => void) | null = null;
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const sbUser = session?.user ?? null;
      if (sbUser) {
        loadProfile(sbUser);
        
        // Setup real-time listener on user profile
        const channel = supabase
          .channel(`profile-${sbUser.id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'users',
              filter: `id=eq.${sbUser.id}`,
            },
            (payload) => {
              const profile = mapRowToProfile(payload.new);
              const emailLower = sbUser.email?.toLowerCase();
              let role = (profile?.role as string) || 'student';
              if (emailLower === 'admin@pinit.in') role = 'admin';
              else if (emailLower === 'rec@pinit.in') role = 'recruiter';
              else if (emailLower === 'con@pinit.in') role = 'consultant';
              setUser(sbUserToAppUser(sbUser, { ...profile, role }));
            }
          )
          .subscribe();

        unsubSnapshot = () => {
          supabase.removeChannel(channel);
        };
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const sbUser = session?.user ?? null;
      if (sbUser) {
        await loadProfile(sbUser);
        
        if (unsubSnapshot) unsubSnapshot();
        
        // Setup real-time listener on user profile
        const channel = supabase
          .channel(`profile-${sbUser.id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'users',
              filter: `id=eq.${sbUser.id}`,
            },
            (payload) => {
              const profile = mapRowToProfile(payload.new);
              const emailLower = sbUser.email?.toLowerCase();
              let role = (profile?.role as string) || 'student';
              if (emailLower === 'admin@pinit.in') role = 'admin';
              else if (emailLower === 'rec@pinit.in') role = 'recruiter';
              else if (emailLower === 'con@pinit.in') role = 'consultant';
              setUser(sbUserToAppUser(sbUser, { ...profile, role }));
            }
          )
          .subscribe();

        unsubSnapshot = () => {
          supabase.removeChannel(channel);
        };
      } else {
        if (unsubSnapshot) {
          unsubSnapshot();
          unsubSnapshot = null;
        }
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, [loadProfile]);

  const login = async (username: string, password: string): Promise<any> => {
    const email = usernameToEmail(username);
    const emailLower = email.toLowerCase();
    
    // Check if default credential attempt first
    const isDefaultUser = (emailLower === 'admin@pinit.in' || emailLower === 'rec@pinit.in' || emailLower === 'con@pinit.in' || emailLower === 'student@pinit.in') && password === '111111';
    
    try {
      let sbUser;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // If Supabase Auth fails with default demo account credentials, we try to create them
        if (isDefaultUser) {
          const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                display_name: emailLower === 'admin@pinit.in' ? 'System Admin' : emailLower === 'rec@pinit.in' ? 'Lead Recruiter' : 'Career Consultant'
              }
            }
          });

          if (signUpErr) {
            throw error;
          }
          
          if (!signUpData.user) {
            throw new Error('Failed to create default user');
          }
          
          sbUser = signUpData.user;
          let role = 'student';
          let displayName = 'User';
          if (emailLower === 'admin@pinit.in') {
            role = 'admin';
            displayName = 'System Admin';
          } else if (emailLower === 'rec@pinit.in') {
            role = 'recruiter';
            displayName = 'Lead Recruiter';
          } else if (emailLower === 'con@pinit.in') {
            role = 'consultant';
            displayName = 'Career Consultant';
          } else if (emailLower === 'student@pinit.in') {
            role = 'student';
            displayName = 'Ashwanth Kumar';
          }

          const profile = {
            ...DEMO_PROFILE,
            uid:             sbUser.id,
            email,
            username:        email.split('@')[0],
            displayName,
            role,
            _passwordSecret: password,
          };
          await createUserProfile(sbUser.id, profile);
          await ensureSeedData(sbUser.id, profile);
        } else {
          throw error;
        }
      } else {
        sbUser = data.user;
        if (!sbUser) throw new Error('No user returned');
      }
      
      await updateUserProfile(sbUser.id, { _passwordSecret: password });
      
      let profile = await getUserProfile(sbUser.id);
      if (!profile) {
        let role = 'student';
        let displayName = 'User';
        if (emailLower === 'admin@pinit.in') { role = 'admin'; displayName = 'System Admin'; }
        else if (emailLower === 'rec@pinit.in') { role = 'recruiter'; displayName = 'Lead Recruiter'; }
        else if (emailLower === 'con@pinit.in') { role = 'consultant'; displayName = 'Career Consultant'; }
        else if (emailLower === 'student@pinit.in') { role = 'student'; displayName = 'Ashwanth Kumar'; }
        profile = {
          ...(isDemoEmail(sbUser.email || '') ? DEMO_PROFILE : EMPTY_PROFILE),
          uid:         sbUser.id,
          email:       sbUser.email || '',
          username:    sbUser.email?.split('@')[0] || 'user',
          displayName: sbUser.user_metadata?.display_name || displayName,
          role,
        };
        await createUserProfile(sbUser.id, profile);
      }
      await ensureSeedData(sbUser.id, profile);
      const appUser = sbUserToAppUser(sbUser, profile);
      setUser(appUser);
      return appUser;
    } catch (err: any) {
      if (isDefaultUser) {
        console.warn('Supabase error for default user login, using local mockup fallback:', err);
        let role = 'student';
        let displayName = 'User';
        if (emailLower === 'admin@pinit.in') {
          role = 'admin';
          displayName = 'System Admin';
        } else if (emailLower === 'rec@pinit.in') {
          role = 'recruiter';
          displayName = 'Lead Recruiter';
        } else if (emailLower === 'con@pinit.in') {
          role = 'consultant';
          displayName = 'Career Consultant';
        } else if (emailLower === 'student@pinit.in') {
          role = 'student';
          displayName = 'Ashwanth Kumar';
        }
        const mockSbUser = {
          id: 'mock-uid-' + role,
          email,
          user_metadata: { display_name: displayName },
        } as any;
        const profile = {
          ...(isDemoEmail(email) ? DEMO_PROFILE : EMPTY_PROFILE),
          uid: mockSbUser.id,
          email,
          username: email.split('@')[0],
          displayName,
          role,
        };
        const appUser = sbUserToAppUser(mockSbUser, profile);
        setUser(appUser);
        return appUser;
      }
      
      const message = err.message || '';
      if (message.includes('Invalid login credentials') || message.includes('invalid_credentials')) {
        throw new Error('Invalid username or password');
      }
      throw new Error(err.message || 'Login failed. Check your credentials.');
    }
  };

  const signup = async (data: SignupData) => {
    const email = usernameToEmail(data.username);
    try {
      const { data: resData, error } = await supabase.auth.signUp({
        email,
        password: data.password,
        options: {
          data: {
            display_name: data.displayName,
          }
        }
      });
      if (error) throw error;
      const sbUser = resData.user;
      if (!sbUser) throw new Error('SignUp succeeded but returned no user.');

      // Check if Supabase returned a user but with a fake session (email confirmation required)
      // When email confirmation is enabled, signUp returns a user but no session
      if (!resData.session) {
        // User was created but needs email confirmation — or it's a duplicate
        // Supabase returns a fake user for duplicate emails (security measure)
        // Try to sign in to check if this is actually a duplicate
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: data.password,
        });
        if (signInError) {
          // If sign-in also fails, the user might need email confirmation or it's truly a new user
          // In either case, proceed with what we have
          console.warn('Post-signup sign-in check failed:', signInError.message);
        }
      }

      const profile = {
        ...(isDemoEmail(email) ? DEMO_PROFILE : EMPTY_PROFILE),
        uid:             sbUser.id,
        email,
        username:        data.username,
        displayName:     data.displayName,
        role:            data.role || 'student',
        registerNumber:  data.registerNumber || '',
        _passwordSecret: data.password,
      };

      // Profile creation should not block signup — wrap in try/catch
      try {
        await createUserProfile(sbUser.id, profile);
      } catch (profileErr: any) {
        console.error('Profile creation failed (non-blocking):', profileErr?.message);
      }

      try {
        await ensureSeedData(sbUser.id, profile);
      } catch (seedErr: any) {
        console.error('Seed data failed (non-blocking):', seedErr?.message);
      }

      setUser(sbUserToAppUser(sbUser, profile));
    } catch (err: any) {
      console.error('Signup error details:', err);
      if (err.message?.includes('already registered') || err.message?.includes('User already exists')) {
        throw new Error('Username already taken. Try a different one.');
      }
      if (err.message?.includes('email_address_not_authorized') || err.message?.includes('not authorized')) {
        throw new Error('Signups are currently restricted. Please contact the administrator.');
      }
      throw new Error(err.message || 'Signup failed. Please try again.');
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const refresh = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const sbUser = session?.user;
    if (sbUser) await loadProfile(sbUser);
  };

  return (
    <Ctx.Provider value={{ user, loading, login, signup, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
