import { useState, useRef } from "react";
import { useAuth } from "@/lib/store";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  User, Mail, Lock, ArrowRight, Loader2, AlertCircle,
  Eye, EyeOff, ShieldCheck, Database
} from "lucide-react";
import { ClarityLogo } from "@/components/ClarityLogo";
import { sound } from "@/lib/sound";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  // 3D Tilt Parallax
  const cardRef = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mouseX = useSpring(rawX, { stiffness: 280, damping: 26 });
  const mouseY = useSpring(rawY, { stiffness: 280, damping: 26 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-10deg", "10deg"]);

  // Mouse ambient lighting coords
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    rawX.set(x);
    rawY.set(y);
    setCoords({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await login({ username, password });
      } else {
        await register({ username, email, password });
      }
      sound.chime();
    } catch (err) {
      sound.pop();
      setError(err instanceof Error ? err.message : "Authentication failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = (targetLogin: boolean) => {
    sound.pop();
    setIsLogin(targetLogin);
    setError("");
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="bg-ground text-ink min-h-screen flex items-center justify-center p-6 relative overflow-hidden select-none transition-colors duration-200"
      style={{ perspective: 1200 }}
    >
      {/* Dynamic Cursor Light Refraction Sphere */}
      <motion.div
        className="pointer-events-none absolute w-[550px] h-[550px] rounded-full blur-3xl opacity-25"
        style={{
          background: "radial-gradient(circle, rgba(200, 116, 103, 0.22) 0%, rgba(217, 138, 126, 0.08) 40%, transparent 70%)",
          left: coords.x ? coords.x - 275 : "50%",
          top: coords.y ? coords.y - 275 : "40%",
          transform: coords.x ? "none" : "translate(-50%, -50%)",
          transition: "left 0.1s ease-out, top 0.1s ease-out",
        }}
      />

      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        onMouseLeave={handleMouseLeave}
        className="w-full max-w-md relative z-10"
      >
        {/* Main 3D Tilt Card */}
        <div className="relative overflow-hidden rounded-[32px] p-[1px] border border-rule bg-surface/95 backdrop-blur-2xl shadow-xl transition-all">
          {/* Edge Specular Light Follower */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[32px] transition-opacity duration-300 opacity-60"
            style={{
              background: `radial-gradient(400px circle at ${coords.x}px ${coords.y}px, rgba(200, 116, 103, 0.2), transparent 60%)`,
            }}
          />

          <div className="relative rounded-[31px] bg-surface">
            {/* Header Brand */}
            <div className="px-8 pt-8 pb-5 text-center" style={{ transform: "translateZ(30px)" }}>
              <div className="flex justify-center mb-3">
                <ClarityLogo size="lg" showText={false} theme="terracotta" shape="squircle" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-ink font-serif">
                Clarity
              </h1>
              <p className="text-ink-soft text-xs mt-1.5 font-medium max-w-xs mx-auto">
                {isLogin
                  ? "Welcome back to your private personal sanctuary"
                  : "Create your offline-first encrypted personal workspace"}
              </p>

              {/* Mode Switcher Tabs */}
              <div className="flex items-center justify-center gap-1.5 p-1 bg-ground rounded-2xl mt-5 border border-rule max-w-[280px] mx-auto">
                <button
                  type="button"
                  onClick={() => toggleMode(true)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    isLogin
                      ? "bg-raised text-ink border border-rule shadow-xs"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => toggleMode(false)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    !isLogin
                      ? "bg-raised text-ink border border-rule shadow-xs"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  Create Account
                </button>
              </div>
            </div>

            <div className="h-px w-full bg-rule" />

            {/* Form Content */}
            <div className="p-8 pt-6" style={{ transform: "translateZ(20px)" }}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 p-3 text-danger bg-danger/10 rounded-2xl text-xs font-semibold border border-danger/20"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Username Input with Dedicated Icon Slot */}
                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1.5">
                    {isLogin ? "Username or Email" : "Username"}
                  </label>
                  <div className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-ground border border-rule focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15 focus-within:bg-raised transition-all group">
                    <div className="w-5 h-5 flex items-center justify-center text-ink-faint group-focus-within:text-accent transition-colors flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={isLogin ? "sahil or you@example.com" : "e.g. sahil"}
                      required
                      autoFocus
                      className="w-full bg-transparent text-sm font-medium text-ink placeholder:text-ink-faint outline-none border-none p-0 focus:ring-0 font-sans"
                    />
                  </div>
                </div>

                {/* Email (Register only) */}
                <AnimatePresence>
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden space-y-1.5"
                    >
                      <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1.5">
                        Email Address
                      </label>
                      <div className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-ground border border-rule focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15 focus-within:bg-raised transition-all group">
                        <div className="w-5 h-5 flex items-center justify-center text-ink-faint group-focus-within:text-accent transition-colors flex-shrink-0">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          required={!isLogin}
                          className="w-full bg-transparent text-sm font-medium text-ink placeholder:text-ink-faint outline-none border-none p-0 focus:ring-0 font-sans"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Password Input with Show/Hide Toggle */}
                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-ground border border-rule focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15 focus-within:bg-raised transition-all group">
                    <div className="w-5 h-5 flex items-center justify-center text-ink-faint group-focus-within:text-accent transition-colors flex-shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-transparent text-sm font-semibold text-ink placeholder:text-ink-faint outline-none border-none p-0 focus:ring-0 tracking-wide font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="p-1 rounded-lg text-ink-faint hover:text-ink transition-colors cursor-pointer flex-shrink-0"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full morning-btn-accent justify-center py-3 mt-3 cursor-pointer font-sans shadow-md"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span className="font-bold text-sm">{isLogin ? "Sign In to Workspace" : "Create My Account"}</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                    </>
                  )}
                </button>
              </form>

              {/* Offline Trust Badges */}
              <div className="pt-6 mt-6 border-t border-rule flex items-center justify-center gap-4 text-[11px] font-medium text-ink-faint">
                <div className="flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-done" />
                  <span>100% Offline SQLite</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                  <span>Encrypted Vault</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
