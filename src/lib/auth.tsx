"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ID } from "appwrite";
import { account } from "./appwrite/client";
import { isAppwriteConfigured, isDemoMode } from "./env";
import { getProfile } from "./client-data";
import {
  demoSignIn,
  demoSignOut,
  getDemoProfile,
  getDemoSessionUser,
  hasDemoSession,
  resetDemoState,
} from "./demo/store";
import type { Profile, SessionUser } from "./types";

type AuthContextValue = {
  user: SessionUser | null;
  profile: Profile | null;
  loading: boolean;
  demoMode: boolean;
  configured: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  demoLogin: () => Promise<void>;
  resetDemo: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toSessionUser(user: {
  $id: string;
  email: string;
  name: string;
}): SessionUser {
  return { $id: user.$id, email: user.email, name: user.name };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const hydrate = useCallback(async () => {
    setLoading(true);
    setAuthError(null);

    if (isDemoMode) {
      const session = getDemoSessionUser();
      setUser(session);
      setProfile(session ? getDemoProfile() : null);
      setLoading(false);
      return;
    }

    if (!isAppwriteConfigured) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const current = await account.get();
      const sessionUser = toSessionUser(current);
      setUser(sessionUser);
      setProfile(await getProfile(sessionUser.$id));
    } catch {
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setAuthError(null);
      if (isDemoMode) {
        demoSignIn();
        await hydrate();
        return;
      }
      try {
        await account.createEmailPasswordSession({ email, password });
        await hydrate();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not sign in.";
        setAuthError(message);
        throw error;
      }
    },
    [hydrate],
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      setAuthError(null);
      if (isDemoMode) {
        demoSignIn();
        await hydrate();
        return;
      }
      try {
        await account.create({
          userId: ID.unique(),
          email,
          password,
          name,
        });
        await account.createEmailPasswordSession({ email, password });
        await hydrate();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not create your account.";
        setAuthError(message);
        throw error;
      }
    },
    [hydrate],
  );

  const signOut = useCallback(async () => {
    if (isDemoMode) {
      demoSignOut();
      setUser(null);
      setProfile(null);
      return;
    }
    try {
      await account.deleteSession({ sessionId: "current" });
    } catch {
      // The local session may already be gone.
    }
    setUser(null);
    setProfile(null);
  }, []);

  const demoLogin = useCallback(async () => {
    demoSignIn();
    await hydrate();
  }, [hydrate]);

  const resetDemo = useCallback(() => {
    resetDemoState();
    setUser(null);
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      demoMode: isDemoMode,
      configured: isAppwriteConfigured,
      authError,
      signIn,
      signUp,
      signOut,
      refresh: hydrate,
      demoLogin,
      resetDemo,
    }),
    [
      user,
      profile,
      loading,
      authError,
      signIn,
      signUp,
      signOut,
      hydrate,
      demoLogin,
      resetDemo,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}

export function useHasDemoSession() {
  return hasDemoSession();
}
