import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { MiniPlayer } from "./components/MiniPlayer";
import { NavBar } from "./components/NavBar";
import { AppProvider, useApp } from "./contexts/AppContext";
import { PlayerProvider } from "./contexts/PlayerContext";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { CirclesPage } from "./pages/CirclesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { FeedPage } from "./pages/FeedPage";
import { FriendsPage } from "./pages/FriendsPage";
import { LandingPage } from "./pages/LandingPage";
import { PlaylistPage } from "./pages/PlaylistPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SetupProfilePage } from "./pages/SetupProfilePage";

function AuthenticatedApp() {
  const { profile, isLoadingProfile } = useApp();

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-display">
            Loading your vibe...
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <SetupProfilePage />;
  }

  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/circles" element={<CirclesPage />} />
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="/playlist" element={<PlaylistPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <MiniPlayer />
    </>
  );
}

function AppRouter() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <AppProvider>
      <AuthenticatedApp />
    </AppProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <PlayerProvider>
        <AppRouter />
        <Toaster position="top-right" richColors />
      </PlayerProvider>
    </BrowserRouter>
  );
}
