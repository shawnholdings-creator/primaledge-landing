/* ============================================================
   AuthContext.tsx — Supabase Auth provider
   Exposes: user, session, loading, productAccess,
            signIn(), signUp(), signOut()
   Checks user_access table for per-product approval status
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

/**
 * Per-product access map.
 * Each key is a product identifier; value is whether the user is approved.
 * `null` means "not checked yet".
 */
export interface ProductAccess {
  cockpit: boolean | null;
  income: boolean | null;
  sentiment: boolean | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** @deprecated — kept for backward compat; true when ANY product is approved */
  isApproved: boolean | null;
  /** Per-product access map */
  productAccess: ProductAccess;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const INITIAL_ACCESS: ProductAccess = { cockpit: null, income: null, sentiment: null };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [productAccess, setProductAccess] = useState<ProductAccess>(INITIAL_ACCESS);

  // Check user_access table for per-product approval
  const checkApproval = useCallback(async (email: string) => {
    try {
      const { data, error } = await supabase
        .from("user_access")
        .select("approved, cockpit_access, income_access, sentiment_access")
        .eq("email", email)
        .single();

      if (error || !data) {
        setProductAccess({ cockpit: false, income: false, sentiment: false });
        return;
      }

      // Product-specific columns with fallback to legacy `approved` column
      const legacy = data.approved === true;
      setProductAccess({
        cockpit: data.cockpit_access != null ? data.cockpit_access === true : legacy,
        income: data.income_access != null ? data.income_access === true : legacy,
        sentiment: data.sentiment_access != null ? data.sentiment_access === true : legacy,
      });
    } catch {
      setProductAccess({ cockpit: false, income: false, sentiment: false });
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
        setProductAccess(INITIAL_ACCESS);
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
    setProductAccess(INITIAL_ACCESS);
  };

  // Legacy compat: isApproved = true if ANY product is approved
  const isApproved =
    productAccess.cockpit === null && productAccess.income === null && productAccess.sentiment === null
      ? null
      : (productAccess.cockpit === true || productAccess.income === true || productAccess.sentiment === true);

  return (
    <AuthContext.Provider
      value={{ user, session, loading, isApproved, productAccess, signIn, signUp, signOut }}
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
