import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "./lib/store";
import { supabase } from "./lib/supabase";
import AuthPage from "./pages/AuthPage";
import Layout from "./components/Layout";
import CalendarPage from "./pages/CalendarPage";
import DiaryPage from "./pages/DiaryPage";
import TasksPage from "./pages/TasksPage";
import ExpensesPage from "./pages/ExpensesPage";
import ProjectsPage from "./pages/ProjectsPage";
import { Loader2 } from "lucide-react";
import { OpeningAnimation } from "./components/OpeningAnimation";

function App() {
  const isAuthenticated = useAuth((s) => s.isAuthenticated);
  const isLoading = useAuth((s) => s.isLoading);
  const initAuth = useAuth((s) => s.initAuth);
  const [slowNotice, setSlowNotice] = useState(false);

  const [showIntro, setShowIntro] = useState(() => {
    try {
      return !sessionStorage.getItem("clarity_intro_seen");
    } catch {
      return true;
    }
  });

  useEffect(() => {
    // Initialize auth state from Supabase session
    initAuth();

    const slowTimer = setTimeout(() => {
      setSlowNotice(true);
    }, 3500);

    // Listen for auth state changes (login, logout, token refresh, OAuth redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, _session) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          await initAuth();
        } else if (event === "SIGNED_OUT") {
          useAuth.setState({
            supabaseUser: null,
            username: null,
            email: null,
            avatarUrl: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      }
    );

    // Replay opening animation listeners (custom event + Ctrl+Shift+O shortcut)
    const replayListener = () => {
      setShowIntro(true);
    };
    window.addEventListener("clarity:replay-intro", replayListener);
    (window as any).__clarityReplayIntro = () => setShowIntro(true);

    const handleGlobalKeys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "O" || e.key === "o")) {
        e.preventDefault();
        setShowIntro(true);
      }
    };
    window.addEventListener("keydown", handleGlobalKeys);

    return () => {
      clearTimeout(slowTimer);
      subscription.unsubscribe();
      window.removeEventListener("clarity:replay-intro", replayListener);
      window.removeEventListener("keydown", handleGlobalKeys);
      delete (window as any).__clarityReplayIntro;
    };
  }, []);

  return (
    <>
      {showIntro && (
        <OpeningAnimation
          onComplete={() => {
            setShowIntro(false);
            try {
              sessionStorage.setItem("clarity_intro_seen", "true");
            } catch {}
          }}
        />
      )}

      {isLoading ? (
        <div className="bg-ground text-ink min-h-screen flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3 max-w-sm text-center">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
            <span className="text-xs font-medium text-ink-faint">Loading Clarity...</span>
            {slowNotice && (
              <div className="mt-2 flex flex-col items-center gap-2">
                <p className="text-[11px] text-ink-soft">
                  Network connection is taking longer than expected.
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => { setSlowNotice(false); initAuth(); }}
                    className="px-2.5 py-1 text-xs border border-rule bg-surface hover:bg-raised text-ink rounded-lg transition cursor-pointer"
                  >
                    Retry Connection
                  </button>
                  <button
                    type="button"
                    onClick={() => useAuth.setState({ isLoading: false, isAuthenticated: false })}
                    className="px-2.5 py-1 text-xs text-ink-faint hover:text-ink underline cursor-pointer"
                  >
                    Go to Login
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : !isAuthenticated ? (
        <AuthPage />
      ) : (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/calendar" replace />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="diary" element={<DiaryPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="projects" element={<ProjectsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      )}
    </>
  );
}

export default App;
