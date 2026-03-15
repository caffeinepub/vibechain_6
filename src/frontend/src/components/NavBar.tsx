import { Button } from "@/components/ui/button";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  ListMusic,
  MessageCircle,
  Music,
  Radio,
  User,
  Users,
} from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const navItems = [
  {
    path: "/",
    icon: Home,
    label: "Home",
    ocid: "nav.home_link",
    isChat: false,
  },
  {
    path: "/feed",
    icon: Radio,
    label: "Feed",
    ocid: "nav.feed_link",
    isChat: false,
  },
  {
    path: "/circles",
    icon: Music,
    label: "Circles",
    ocid: "nav.circles_link",
    isChat: false,
  },
  {
    path: "/friends",
    icon: Users,
    label: "Friends",
    ocid: "nav.friends_link",
    isChat: false,
  },
  {
    path: "/chat",
    icon: MessageCircle,
    label: "Chat",
    ocid: "nav.chat_link",
    isChat: true,
  },
  {
    path: "/playlist",
    icon: ListMusic,
    label: "Playlists",
    ocid: "nav.playlist_link",
    isChat: false,
  },
  {
    path: "/profile",
    icon: User,
    label: "Profile",
    ocid: "nav.profile_link",
    isChat: false,
  },
] as const;

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white font-bold leading-none"
      style={{ fontSize: "9px", padding: "0 3px" }}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function NavBar() {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const { clear } = useInternetIdentity();
  const { unreadCount } = useApp();

  return (
    <>
      {/* Top header */}
      <header className="fixed top-0 left-0 right-0 z-40 glass border-b border-border/30">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
          <Link
            to="/"
            className="flex items-center gap-2"
            data-ocid="nav.home_link"
          >
            <span className="font-display font-bold text-lg text-gradient">
              VIBECHAIN
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ path, icon: Icon, label, ocid, isChat }) => {
              const active = pathname === path;
              return (
                <Link key={path} to={path} data-ocid={ocid}>
                  <Button
                    variant={active ? "secondary" : "ghost"}
                    size="sm"
                    className={`gap-2 relative ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <span className="relative">
                      <Icon className="h-4 w-4" />
                      {isChat && <UnreadBadge count={unreadCount} />}
                    </span>
                    {label}
                  </Button>
                </Link>
              );
            })}
          </nav>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={clear}
          >
            Sign out
          </Button>
        </div>
      </header>

      {/* Mobile bottom nav — separate fixed element */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/30 flex md:hidden justify-around py-2"
        data-ocid="nav.mobile_bar"
      >
        {navItems.map(({ path, icon: Icon, label, ocid, isChat }) => {
          const active = pathname === path;
          return (
            <Link
              key={path}
              to={path}
              data-ocid={ocid}
              className="flex flex-col items-center gap-1 px-2 py-1"
            >
              <span className="relative">
                <Icon
                  className={`h-5 w-5 ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                {isChat && <UnreadBadge count={unreadCount} />}
              </span>
              <span
                className={`text-[9px] ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
