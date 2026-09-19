import { Outlet, NavLink } from "react-router-dom";
import { Calendar, BookOpen, CheckSquare, DollarSign, FolderKanban, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/store";
import { clsx } from "clsx";
import { ClarityLogo } from "./ClarityLogo";

export default function Layout() {
  const { username, logout } = useAuth();

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

  const userInitial = (username || "U").charAt(0).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden morning-bg text-[#3A3530] select-none">
      {/* ── Matte Clay Stationery Sidebar ─────────────────────── */}
      <aside className="w-64 flex-shrink-0 bg-[#ECE8E1]/92 backdrop-blur-xl border-r border-[#DCD6CC] flex flex-col justify-between z-20 relative shadow-[2px_0_12px_rgba(84,67,64,0.03)]">
        <div>
          {/* Brand Monogram Header */}
          <div className="px-5 pt-6 pb-4">
            <ClarityLogo size="md" theme="terracotta" shape="squircle" className="mb-5" />

            {/* User Profile Stationery Chip */}
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-[#FAF8F5] border border-black/[0.06] shadow-[0_2px_8px_rgba(60,50,40,0.04),inset_0_1px_0_rgba(255,255,255,0.85)]">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#D98A7E] to-[#C87467] text-white flex items-center justify-center text-xs font-black flex-shrink-0 shadow-xs">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10.5px] font-medium text-[#827A72] leading-tight">
                  {greeting()}
                </p>
                <p className="text-[13px] font-bold text-[#24211E] truncate font-sans">
                  {username || "Guest"}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-2 space-y-1 overflow-y-auto">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 group text-[13.5px] font-semibold cursor-pointer",
                    isActive
                      ? "bg-[#FAF8F5] text-[#24211E] shadow-[0_2px_8px_rgba(60,50,40,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] border border-black/[0.06]"
                      : "text-[#6E6862] hover:bg-black/[0.04] hover:text-[#24211E] border border-transparent"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <link.icon
                      className={clsx(
                        "w-4.5 h-4.5 flex-shrink-0 transition-colors",
                        isActive
                          ? "text-[#C87467] stroke-[2.4]"
                          : "text-[#8C857E] group-hover:text-[#24211E] stroke-[1.8]"
                      )}
                    />
                    <span>{link.label}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C87467] shadow-[0_0_6px_rgba(200,116,103,0.6)]" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer: Volume Progress & Sign Out */}
        <div className="p-3 border-t border-black/[0.06] space-y-3">
          {/* Notebook Volume Progress Indicator */}
          <div className="px-3 py-2.5 rounded-xl bg-[#FAF8F5]/80 border border-black/[0.05] shadow-2xs">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-[#6E6862] font-semibold flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#C87467]" />
                Notebook Vol. I
              </span>
              <span className="font-mono text-[11px] font-bold text-[#C87467]">
                84%
              </span>
            </div>
            <div className="w-full bg-[#EAE5DE] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#D98A7E] to-[#C87467] h-1.5 rounded-full transition-all duration-500"
                style={{ width: "84%" }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#827A72] font-medium font-mono">
              <span>168 of 200 pages</span>
              <span className="text-[#6B8065] font-semibold">Active</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-3 px-3.5 py-2 rounded-xl w-full text-[13px] font-semibold text-[#827A72] hover:bg-[#C87467]/10 hover:text-[#C87467] transition-colors group cursor-pointer"
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5 stroke-[1.8]" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Workspace ────────────────────────────────────── */}
      <main className="flex-1 relative overflow-auto page-transition">
        <Outlet />
      </main>
    </div>
  );
}
