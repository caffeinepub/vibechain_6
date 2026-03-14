import { Button } from "@/components/ui/button";
import { Home, Music, Radio, User, Users } from "lucide-react";
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const navItems = [
  { path: "/", icon: Home, label: "Home", ocid: "nav.home_link" },
  { path: "/feed", icon: Radio, label: "Feed", ocid: "nav.feed_link" },
  { path: "/circles", icon: Music, label: "Circles", ocid: "nav.circles_link" },
  { path: "/friends", icon: Users, label: "Friends", ocid: "nav.friends_link" },
  { path: "/profile", icon: User, label: "Profile", ocid: "nav.profile_link" },
];

export function NavBar() {
  const location = useLocation();
  const { clear } = useInternetIdentity();

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
            {navItems.map(({ path, icon: Icon, label, ocid }) => {
              const active = location.pathname === path;
              return (
                <Link key={path} to={path} data-ocid={ocid}>
                  <Button
                    variant={active ? "secondary" : "ghost"}
                    size="sm"
                    className={`gap-2 ${active ? "text-primary" : "text-muted-foreground"}`}
                  >
                    <Icon className="h-4 w-4" />
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
        {navItems.map(({ path, icon: Icon, label, ocid }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              data-ocid={ocid}
              className="flex flex-col items-center gap-1 px-3 py-1"
            >
              <Icon
                className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`}
              />
              <span
                className={`text-[10px] ${active ? "text-primary" : "text-muted-foreground"}`}
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
