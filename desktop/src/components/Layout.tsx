import { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  Calendar, BookOpen, CheckSquare, DollarSign, FolderKanban,
  LogOut, Volume2, VolumeX, Sun, Moon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/store";
import { sound } from "@/lib/sound";
import { clsx } from "clsx";
import { ClarityLogo } from "./ClarityLogo";

export default function Layout() {
  const { username, avatarUrl, logout } = useAuth();
  const location = useLocation();
  const [muted, setMuted] = useState(sound.isMuted());
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (document.documentElement.getAttribute("data-theme") as "light" | "dark") || "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("clarity_theme", theme);
  }, [theme]);

  const handleToggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("clarity_theme", next);
    sound.pop();
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const links = [
    { to: "/calendar", icon: Calendar, label: "Calendar" },
    { to: "/diary", icon: BookOpen, label: "Diary" },
    { to: "/tasks", icon: CheckSquare, label: "Tasks" },
    { to: "/expenses", icon: DollarSign, label: "Expenses" },
    { to: "/projects", icon: FolderKanban, label: "Projects" },
  ];

  const handleToggleMute = () => {
    const next = sound.toggleMute();
    setMuted(next);
    if (!next) sound.pop();
  };

  const userInitial = (username || "U").charAt(0).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-ground text-ink select-none">
      {/* ── Minimalist Stationery Sidebar ───────────────────────────── */}
      <aside className="w-64 flex-shrink-0 bg-surface/90 backdrop-blur-xl border-r border-rule flex flex-col justify-between z-20 relative transition-colors duration-200">
        <div>
          {/* Brand Monogram Header */}
          <div className="px-5 pt-7 pb-4">
            <div className="flex items-center justify-between mb-4">
              <ClarityLogo size="md" theme={theme === "dark" ? "dark" : "outline"} shape="squircle" />
              <div className="flex items-center gap-1">
                <button
                  onClick={handleToggleTheme}
                  title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  className="p-1.5 rounded-lg text-ink-faint hover:text-ink hover:bg-raised transition-colors cursor-pointer"
                >
                  {theme === "dark" ? (
                    <Sun className="w-4 h-4 text-warn" />
                  ) : (
                    <Moon className="w-4 h-4 text-ink" />
                  )}
                </button>
                <button
                  onClick={handleToggleMute}
                  title={muted ? "Unmute tactile audio" : "Mute tactile audio"}
                  className="p-1.5 rounded-lg text-ink-faint hover:text-ink hover:bg-raised transition-colors cursor-pointer"
                >
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-ink-soft" />}
                </button>
              </div>
            </div>

            {/* User Profile Stationery Chip */}
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-raised border border-rule transition-colors">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={username || 'User'}
                  className="w-7 h-7 rounded-lg object-cover flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-ink text-ground flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {userInitial}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[10.5px] font-medium text-ink-faint leading-tight">
                  {greeting()}
                </p>
                <p className="text-[13px] font-bold text-ink truncate font-sans">
                  {username || "Guest"}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links with Magnetic Glider */}
          <nav className="px-3 py-2 space-y-1 overflow-y-auto relative">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => sound.pageTurn()}
                className={({ isActive }) =>
                  clsx(
                    "relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors duration-150 group text-[13.5px] font-semibold cursor-pointer z-10",
                    isActive
                      ? "text-ink"
                      : "text-ink-soft hover:text-ink"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Magnetic Gliding Active Pill */}
                    {isActive && (
                      <motion.div
                        layoutId="activeNavPill"
                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                        className="absolute inset-0 bg-raised rounded-xl border border-rule -z-10 shadow-xs"
                      />
                    )}

                    <link.icon
                      className={clsx(
                        "w-4.5 h-4.5 flex-shrink-0 transition-colors duration-200",
                        isActive
                          ? "text-accent stroke-[2.2]"
                          : "text-ink-faint group-hover:text-ink stroke-[1.8]"
                      )}
                    />
                    <span className="relative z-10">{link.label}</span>
                    {isActive && (
                      <motion.span
                        layoutId="activeNavDot"
                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-accent z-10"
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer: Clean Sign Out */}
        <div className="p-3 border-t border-rule">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl w-full text-[13px] font-semibold text-ink-soft hover:bg-danger/10 hover:text-danger transition-colors group cursor-pointer"
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5 stroke-[1.8]" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Workspace with Smooth Page Deck Transitions ────────── */}
      <main className="flex-1 relative overflow-auto bg-ground">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
