"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { User, Workspace } from "@/lib/supabase/types";
import {
  MOCK_AUTH_ENABLED,
  MOCK_SUPABASE_USER,
  MOCK_PROFILE,
  MOCK_WORKSPACE,
} from "@/lib/auth/mock-auth";

interface AuthContextValue {
  user: SupabaseUser | null;
  profile: User | null;
  workspace: Workspace | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  workspace: null,
  isLoading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock auth bypass — skip Supabase entirely
    if (MOCK_AUTH_ENABLED) {
      setUser(MOCK_SUPABASE_USER);
      setProfile(MOCK_PROFILE);
      setWorkspace(MOCK_WORKSPACE);
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    async function loadUserData(authUser: SupabaseUser) {
      // Fetch profile from users table
      const { data: profileData } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      const userProfile = profileData as User | null;
      setProfile(userProfile);

      // Fetch workspace (or auto-create if none exists)
      const { data: workspaces } = await supabase
        .from("workspaces")
        .select("*")
        .eq("user_id", authUser.id)
        .limit(1);

      if (workspaces && workspaces.length > 0) {
        setWorkspace(workspaces[0]);
      } else {
        // Auto-create a default workspace for new users
        const name = userProfile?.full_name
          ? `${userProfile.full_name}'s Workspace`
          : "My Workspace";
        const { data: newWorkspace } = await supabase
          .from("workspaces")
          .insert({ user_id: authUser.id, name } as any)
          .select()
          .single();
        setWorkspace(newWorkspace as Workspace | null);
      }
    }

    // Initial session check
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      setUser(authUser);
      if (authUser) {
        loadUserData(authUser).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const authUser = session?.user ?? null;
      setUser(authUser);
      if (authUser) {
        loadUserData(authUser).finally(() => setIsLoading(false));
      } else {
        setProfile(null);
        setWorkspace(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, workspace, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
