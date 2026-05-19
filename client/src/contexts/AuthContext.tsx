/* ============================================================
   AuthContext.tsx — Supabase Auth provider
   Exposes: user, session, loading, isApproved,
            signIn(), signUp(), signOut()
   Checks user_access table for approval status
   ============================================================ */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isApproved: boolean | null; // null = not checked yet
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);

  // Check user_access table for approval
  const checkApproval = useCallback(async (email: string) => {
    try {
      const { data, error } = await supabase
        .from("user_access")
        .select("approved")
        .eq("email", email)
        .single();

      if (error || !data) {
        setIsApproved(false);
        return;
      }
      setIsApproved(data.approved === true);
    } catch {
      setIsApproved(false);
    }
  }, []);

  // Initialize auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user?.email) {
        checkApproval(s.user.email);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user?.email) {
        checkApproval(s.user.email);
      } else {
        setIsApproved(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkApproval]);

  // Sign in with email + password
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  // Sign up with email + password
  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsApproved(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, isApproved, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
