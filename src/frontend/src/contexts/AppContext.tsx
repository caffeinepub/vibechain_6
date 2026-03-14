import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Mood, UserProfile } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface AppContextType {
  profile: UserProfile | null;
  isLoadingProfile: boolean;
  selectedMood: Mood | null;
  setSelectedMood: (mood: Mood | null) => void;
  refreshProfile: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!actor || !identity) return;
    const principal = identity.getPrincipal();
    if (principal.isAnonymous()) return;
    setIsLoadingProfile(true);
    try {
      const p = await actor.getCallerUserProfile();
      setProfile(p);
    } catch {
      setProfile(null);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [actor, identity]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  return (
    <AppContext.Provider
      value={{
        profile,
        isLoadingProfile,
        selectedMood,
        setSelectedMood,
        refreshProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
