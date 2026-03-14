import { Toaster } from "@/components/ui/sonner";
import {
  Navigate,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { MiniPlayer } from "./components/MiniPlayer";
import { NavBar } from "./components/NavBar";
import { AppProvider, useApp } from "./contexts/AppContext";
import { PlayerProvider } from "./contexts/PlayerContext";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { ChatPage } from "./pages/ChatPage";
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
      <Outlet />
      <MiniPlayer />
    </>
  );
}

function AppRoot() {
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

// Route definitions
const rootRoute = createRootRoute({ component: AppRoot });

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});

const feedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/feed",
  component: FeedPage,
});

const circlesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/circles",
  component: CirclesPage,
});

const friendsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/friends",
  component: FriendsPage,
});

const playlistRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/playlist",
  component: PlaylistPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/chat",
  component: ChatPage,
  validateSearch: (search: Record<string, unknown>) => ({
    with: typeof search.with === "string" ? search.with : undefined,
  }),
});

const catchAllRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "*",
  component: () => <Navigate to="/" />,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  feedRoute,
  circlesRoute,
  friendsRoute,
  playlistRoute,
  profileRoute,
  chatRoute,
  catchAllRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <PlayerProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </PlayerProvider>
  );
}
