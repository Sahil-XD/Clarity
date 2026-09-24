import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
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

function App() {
  const isAuthenticated = useAuth((s) => s.isAuthenticated);
  const isLoading = useAuth((s) => s.isLoading);
  const initAuth = useAuth((s) => s.initAuth);

  useEffect(() => {
    // Initialize auth state from Supabase session
    initAuth();

    // Listen for auth state changes (login, logout, token refresh, OAuth redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          await initAuth();
        } else if (event === "SIGNED_OUT") {
          useAuth.setState({
            supabaseUser: null,
            username: null,
            email: null,
            avatarUrl: null,
            isAuthenticated: false,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="bg-ground text-ink min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
          <span className="text-xs font-medium text-ink-faint">Loading Clarity...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
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
  );
}

export default App;
