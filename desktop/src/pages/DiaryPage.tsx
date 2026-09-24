import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import dayjs from "dayjs";
import {
  Lock, Unlock, Key, BookOpen, AlertCircle, Loader2,
  Plus, ChevronRight, Pencil, CalendarDays, Check,
  Bold, Italic, List, Sparkles, Shuffle, Smile,
  RotateCcw, Delete, ShieldAlert, ShieldCheck, Settings, X, Trash2,
  CornerDownLeft, Shield, Sparkle
} from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { api } from "@/lib/api";
import { sound } from "@/lib/sound";
import type { DiaryEntry } from "@/lib/types";
import { clsx } from "clsx";
import { ClarityLogo } from "@/components/ClarityLogo";

// Curated daily reflection prompts for personal mindfulness
const DAILY_PROMPTS = [
  "What is one small thing that made you smile today?",
  "What gave you the most energy or satisfaction today?",
  "What is a thought or feeling you want to let go of tonight?",
  "Who did you appreciate talking to or spending time with today?",
  "What is one personal lesson or insight from this week?",
  "Describe today in three words and explain why.",
  "What is something simple you are genuinely looking forward to tomorrow?",
  "What did you do today that future-you will be thankful for?",
];

const MOOD_GLOWS: Record<string, string> = {
  Energized: 'rgba(245, 158, 11, 0.08)',
  Peaceful: 'rgba(107, 128, 101, 0.08)',
  Productive: 'rgba(200, 116, 103, 0.08)',
  Chilled: 'rgba(217, 138, 126, 0.08)',
  Tired: 'rgba(139, 92, 246, 0.08)',
  Thoughtful: 'rgba(59, 130, 246, 0.08)',
};

const MOODS = [
  { label: "Energized", emoji: "⚡" },
  { label: "Peaceful", emoji: "🌿" },
  { label: "Productive", emoji: "🎯" },
  { label: "Chilled", emoji: "☕" },
  { label: "Tired", emoji: "🌙" },
  { label: "Thoughtful", emoji: "💭" },
];

// ─── 3D Vault Lock Screen (Physical Keyboard Only, Kinetic Rings) ─────────────
function LockScreen({
  onUnlocked,
}: {
  onUnlocked: (pin: string, entries: DiaryEntry[]) => void;
}) {
  const [pin, setPin] = useState("");
  const [mode, setMode] = useState<"unlock" | "reset" | "setup">("unlock");
  const [resetStep, setResetStep] = useState<"enter" | "confirm">("enter");
  const [tempNewPin, setTempNewPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [ripples, setRipples] = useState<{ id: number; index: number }[]>([]);

  // 3D Tilt Parallax Motion Values
  const cardRef = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mouseX = useSpring(rawX, { stiffness: 280, damping: 26 });
  const mouseY = useSpring(rawY, { stiffness: 280, damping: 26 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["12deg", "-12deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-12deg", "12deg"]);
  const glareX = useTransform(mouseX, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(mouseY, [-0.5, 0.5], ["0%", "100%"]);

  // Mouse ambient lighting
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

  const triggerShake = (msg: string) => {
    sound.pop();
    setError(msg);
    setShake(true);
    setPin("");
    setTimeout(() => setShake(false), 500);
  };

  const handleUnlock = useCallback(async (pinToVerify: string) => {
    setError("");
    setLoading(true);
    try {
      const data = await api.getDiaryEntries(pinToVerify);
      setSuccess(true);
      sound.chime();
      setTimeout(() => {
        onUnlocked(pinToVerify, data);
      }, 350);
    } catch (err: any) {
      const message = err?.message || String(err);
      if (message.includes("Diary PIN not set")) {
        setMode("setup");
        setPin("");
        setError("No passcode set yet. Type 4 digits to secure your journal.");
      } else {
        triggerShake("Incorrect passcode. Try again or reset below.");
      }
    } finally {
      setLoading(false);
    }
  }, [onUnlocked]);

  const handleResetSubmit = useCallback(async (confirmedPin: string) => {
    setError("");
    setLoading(true);
    try {
      await api.resetDiaryPin(confirmedPin);
      setSuccess(true);
      sound.chime();
      const entries = await api.getDiaryEntries(confirmedPin);
      setTimeout(() => {
        onUnlocked(confirmedPin, entries);
      }, 350);
    } catch {
      triggerShake("Failed to reset passcode. Try again.");
    } finally {
      setLoading(false);
    }
  }, [onUnlocked]);

  // Handle digit input with ripple shockwaves
  const handleDigit = useCallback((digit: string) => {
    if (loading || success) return;
    sound.pop();
    setError("");
    setActiveKey(digit);
    setTimeout(() => setActiveKey(null), 140);

    setPin((prev) => {
      if (prev.length >= 4) return prev;
      const targetIndex = prev.length;
      const next = prev + digit;

      // Trigger ripple shockwave on target kinetic ring
      const rippleId = Date.now() + Math.random();
      setRipples((r) => [...r, { id: rippleId, index: targetIndex }]);
      setTimeout(() => {
        setRipples((r) => r.filter((item) => item.id !== rippleId));
      }, 600);

      if (next.length === 4) {
        if (mode === "unlock") {
          setTimeout(() => handleUnlock(next), 90);
        } else if (mode === "setup") {
          setTimeout(async () => {
            setLoading(true);
            try {
              await api.setDiaryPin(next);
              setSuccess(true);
              sound.chime();
              const entries = await api.getDiaryEntries(next);
              setTimeout(() => onUnlocked(next, entries), 350);
            } catch {
              triggerShake("Failed to set passcode. Try again.");
            } finally {
              setLoading(false);
            }
          }, 90);
        } else if (mode === "reset") {
          if (resetStep === "enter") {
            setTimeout(() => {
              setTempNewPin(next);
              setResetStep("confirm");
              setPin("");
            }, 90);
          } else {
            setTimeout(() => {
              if (next === tempNewPin) {
                handleResetSubmit(next);
              } else {
                triggerShake("Passcodes do not match. Start over.");
                setResetStep("enter");
                setTempNewPin("");
              }
            }, 90);
          }
        }
      }
      return next;
    });
  }, [loading, success, mode, resetStep, tempNewPin, handleUnlock, handleResetSubmit, onUnlocked]);

  const handleBackspace = useCallback(() => {
    if (loading || success) return;
    sound.pop();
    setActiveKey("Backspace");
    setTimeout(() => setActiveKey(null), 140);
    setPin((prev) => prev.slice(0, -1));
  }, [loading, success]);

  const handleClear = useCallback(() => {
    sound.pop();
    setPin("");
    setError("");
  }, []);

  // Global physical keyboard capture
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleClear();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleDigit, handleBackspace, handleClear]);

  const startResetMode = () => {
    sound.pop();
    setMode("reset");
    setResetStep("enter");
    setTempNewPin("");
    setPin("");
    setError("");
  };

  const cancelResetMode = () => {
    sound.pop();
    setMode("unlock");
    setResetStep("enter");
    setTempNewPin("");
    setPin("");
    setError("");
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="h-full flex items-center justify-center p-6 bg-ground text-ink relative select-none overflow-hidden"
      style={{ perspective: 1200 }}
    >
      {/* Dynamic Cursor Light Refraction Sphere */}
      <motion.div
        className="pointer-events-none absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-35"
        style={{
          background: "radial-gradient(circle, rgba(200, 116, 103, 0.28) 0%, rgba(217, 138, 126, 0.12) 40%, transparent 70%)",
          left: coords.x ? coords.x - 300 : "50%",
          top: coords.y ? coords.y - 300 : "40%",
          transform: coords.x ? "none" : "translate(-50%, -50%)",
          transition: "left 0.1s ease-out, top 0.1s ease-out",
        }}
      />

      {/* Floating 3D Parallax Vault Card */}
      <motion.div
        ref={cardRef}
        animate={shake ? { x: [-16, 16, -12, 12, -6, 6, 0] } : success ? { scale: [1, 1.05, 0.98], opacity: [1, 1, 0.9] } : {}}
        transition={{ duration: 0.45, ease: "easeOut" }}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        onMouseLeave={handleMouseLeave}
        className="w-full max-w-lg relative z-10"
      >
        <div className="relative overflow-hidden rounded-[32px] p-[1.5px] shadow-[0_24px_64px_rgba(60,50,40,0.12),0_8px_24px_rgba(0,0,0,0.06)] bg-gradient-to-b from-white/90 via-white/40 to-black/[0.08] transition-all">
          {/* Edge Specular Light Follower */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[32px] transition-opacity duration-300 opacity-80"
            style={{
              background: `radial-gradient(400px circle at ${coords.x}px ${coords.y}px, rgba(200, 116, 103, 0.35), transparent 60%)`,
            }}
          />

          {/* Inner Card Body */}
          <div className="relative rounded-[30px] bg-surface backdrop-blur-2xl px-10 py-10 flex flex-col items-center">
            {/* 3D Floating Vault Emblem */}
            <motion.div
              style={{ transform: "translateZ(40px)" }}
              className="relative flex items-center justify-center mb-6"
            >
              <div className="relative w-20 h-20 rounded-3xl bg-accent/15 border border-accent/30 shadow-sm flex items-center justify-center">
                <motion.div
                  animate={success ? { rotate: [0, 360], scale: [1, 1.25, 1] } : { rotate: [0, 3, -3, 0] }}
                  transition={{ duration: 0.6 }}
                >
                  <ClarityLogo size="lg" showText={false} theme="terracotta" shape="squircle" />
                </motion.div>

                {/* Status indicator lock glyph */}
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center shadow-md">
                  {mode === "reset" ? (
                    <RotateCcw className="w-3.5 h-3.5 stroke-[2.4]" />
                  ) : success ? (
                    <Unlock className="w-3.5 h-3.5 stroke-[2.4]" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 stroke-[2.4]" />
                  )}
                </div>
              </div>
            </motion.div>

            {/* Typography */}
            <div className="text-center space-y-1.5 mb-8" style={{ transform: "translateZ(30px)" }}>
              <h2 className="text-3xl font-bold tracking-tight text-ink font-serif">
                {mode === "reset"
                  ? resetStep === "enter"
                    ? "Reset Passcode"
                    : "Confirm New Passcode"
                  : mode === "setup"
                  ? "Protect Your Sanctuary"
                  : "Private Vault"}
              </h2>
              <p className="text-ink-faint text-xs font-medium tracking-wide">
                {mode === "reset"
                  ? resetStep === "enter"
                    ? "Enter 4 digits for your new passcode"
                    : "Repeat the 4 digits to confirm"
                  : mode === "setup"
                  ? "Choose a 4-digit PIN using your keyboard"
                  : "Type your 4-digit passcode on your keyboard"}
              </p>
            </div>

            {/* ─── 4 Kinetic Floating Vault Rings ───────────────────────────────── */}
            <div
              style={{ transform: "translateZ(50px)" }}
              className="py-4 px-6 flex items-center justify-center gap-6 mb-4 relative"
            >
              {[0, 1, 2, 3].map((idx) => {
                const filled = pin.length > idx;
                const active = pin.length === idx;
                const ringRipples = ripples.filter((r) => r.index === idx);

                return (
                  <div key={idx} className="relative flex items-center justify-center">
                    {/* Expanding Kinetic Ripple Shockwaves */}
                    {ringRipples.map((r) => (
                      <motion.div
                        key={r.id}
                        initial={{ scale: 0.8, opacity: 0.95 }}
                        animate={{ scale: 2.3, opacity: 0 }}
                        transition={{ duration: 0.55, ease: "easeOut" }}
                        className="absolute w-14 h-14 rounded-full border-2 border-accent pointer-events-none"
                      />
                    ))}

                    {/* Outer Ambient Kinetic Ring */}
                    <motion.div
                      animate={
                        success
                          ? { scale: [1, 1.2, 1], borderColor: "var(--c-done)" }
                          : filled
                          ? { scale: [1, 1.12, 1], borderColor: "var(--c-accent)" }
                          : active
                          ? { scale: [1, 1.05, 1], borderColor: "var(--c-accent-soft)" }
                          : { scale: 1, borderColor: "var(--c-rule)" }
                      }
                      transition={{ duration: 0.35 }}
                      className={clsx(
                        "w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all duration-200 relative overflow-hidden",
                        filled
                          ? "bg-raised shadow-xs border-accent"
                          : active
                          ? "bg-surface border-accent shadow-xs ring-2 ring-accent/20"
                          : "bg-ground border-rule"
                      )}
                    >
                      {/* Inner Core Gemstone / Glyph */}
                      <AnimatePresence mode="wait">
                        {filled ? (
                          <motion.div
                            key="filled"
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0 }}
                            transition={{ type: "spring", stiffness: 450, damping: 20 }}
                            className={clsx(
                              "w-5 h-5 rounded-full flex items-center justify-center text-white shadow-sm",
                              success ? "bg-done" : "bg-accent"
                            )}
                          >
                            <span className="w-2 h-2 rounded-full bg-white/90" />
                          </motion.div>
                        ) : active ? (
                          <motion.div
                            key="active"
                            animate={{ opacity: [0.3, 0.9, 0.3], scale: [0.85, 1.15, 0.85] }}
                            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                            className="w-2.5 h-2.5 rounded-full bg-accent/50"
                          />
                        ) : (
                          <div key="empty" className="w-2 h-2 rounded-full bg-rule" />
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>
                );
              })}
            </div>

            {/* Error & Status Toast */}
            <div className="h-6 flex items-center justify-center mb-6" style={{ transform: "translateZ(30px)" }}>
              <AnimatePresence mode="wait">
                {error ? (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 text-xs text-accent font-semibold bg-accent/10 px-3 py-1 rounded-full border border-accent/20"
                  >
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                ) : loading ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-xs text-ink-faint font-medium"
                  >
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                    <span>Decrypting archives...</span>
                  </motion.div>
                ) : success ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1.5 text-xs text-done font-bold"
                  >
                    <Sparkle className="w-3.5 h-3.5" />
                    <span>Vault Unlocked</span>
                  </motion.div>
                ) : (
                  <p className="text-[11px] text-ink-faint font-mono tracking-tight flex items-center gap-1.5">
                    <span>Press any 4 digits</span>
                    <span>•</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-black/[0.04] text-ink-soft text-[10px] font-bold">Esc</kbd>
                    <span>to clear</span>
                  </p>
                )}
              </AnimatePresence>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-black/[0.06] to-transparent mb-6" />

            {/* ─── Real-Time Physical Keyboard Visualizer Strip ──────────────────── */}
            <div className="w-full flex flex-col items-center gap-3" style={{ transform: "translateZ(30px)" }}>
              <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-sm">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((k) => {
                  const isPressed = activeKey === k;
                  return (
                    <motion.button
                      key={k}
                      type="button"
                      onClick={() => handleDigit(k)}
                      animate={isPressed ? { scale: 0.88, y: 2 } : { scale: 1, y: 0 }}
                      className={clsx(
                        "w-8 h-8 rounded-xl font-mono text-xs font-bold transition-colors flex items-center justify-center border cursor-pointer select-none shadow-xs",
                        isPressed
                          ? "bg-accent text-white border-accent shadow-sm"
                          : "bg-white/80 hover:bg-white text-ink-soft hover:text-ink border-rule"
                      )}
                    >
                      {k}
                    </motion.button>
                  );
                })}

                {/* Backspace Key */}
                <motion.button
                  type="button"
                  onClick={handleBackspace}
                  disabled={pin.length === 0}
                  animate={activeKey === "Backspace" ? { scale: 0.88 } : { scale: 1 }}
                  className={clsx(
                    "px-2.5 h-8 rounded-xl font-mono text-[11px] font-bold transition-colors flex items-center gap-1 border cursor-pointer select-none shadow-xs",
                    activeKey === "Backspace"
                      ? "bg-accent text-white border-accent"
                      : "bg-white/80 hover:bg-white text-ink-faint hover:text-ink border-rule disabled:opacity-30 disabled:pointer-events-none"
                  )}
                  title="Backspace"
                >
                  <Delete className="w-3.5 h-3.5" />
                  <span>Del</span>
                </motion.button>
              </div>

              {/* Recovery / Reset Link */}
              <div className="pt-2 text-center">
                {mode === "unlock" ? (
                  <button
                    type="button"
                    onClick={startResetMode}
                    className="text-xs font-bold text-ink-faint hover:text-accent transition cursor-pointer flex items-center gap-1.5 mx-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Forgot Passcode? Reset PIN</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={cancelResetMode}
                    className="text-xs font-bold text-ink-faint hover:text-ink transition cursor-pointer"
                  >
                    ← Cancel &amp; Return to Unlock
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Passcode Settings Modal (Inside unlocked diary) ─────────────────────────
function PasscodeSettingsModal({
  currentPin,
  onClose,
  onPinChanged,
}: {
  currentPin: string;
  onClose: () => void;
  onPinChanged: (newPin: string | null) => void;
}) {
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length !== 4) {
      setError("New PIN must be exactly 4 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      setError("Passcodes do not match.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.resetDiaryPin(newPin.trim());
      sound.chime();
      onPinChanged(newPin.trim());
      onClose();
    } catch {
      setError("Failed to update PIN. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePin = async () => {
    if (!confirm("Are you sure you want to remove passcode protection from your diary? Anyone on this computer will be able to open it.")) {
      return;
    }
    setSaving(true);
    try {
      await api.removeDiaryPin();
      sound.chime();
      onPinChanged(null);
      onClose();
    } catch {
      setError("Failed to remove PIN.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="w-full max-w-sm morning-card-elevated overflow-hidden bg-surface rounded-3xl border border-rule shadow-2xl"
      >
        <div className="px-6 py-4.5 bg-raised border-b border-rule flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
              <Key className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink font-serif">Passcode Settings</h3>
              <p className="text-[11px] text-ink-faint">Update or remove diary encryption</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-ink-faint hover:text-ink transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleChangePin} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-2.5 text-xs font-semibold text-accent bg-accent/10 rounded-xl border border-accent/20">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1.5">
              New 4-Digit Passcode
            </label>
            <input
              type="password"
              maxLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className="morning-input text-center font-mono text-lg tracking-widest"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1.5">
              Confirm New Passcode
            </label>
            <input
              type="password"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className="morning-input text-center font-mono text-lg tracking-widest"
            />
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={saving || newPin.length !== 4 || confirmPin.length !== 4}
              className="morning-btn-accent justify-center py-2.5 w-full cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save New Passcode
            </button>

            <button
              type="button"
              onClick={handleRemovePin}
              disabled={saving}
              className="text-xs font-bold text-accent hover:text-accent-soft py-2 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove Passcode Protection
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Main Diary Unlocked View ────────────────────────────────────────────────
export default function DiaryPage() {
  const [pin, setPin] = useState("");
  const [isLocked, setIsLocked] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [entries, setEntries] = useState<Record<string, DiaryEntry>>({});
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [addingDate, setAddingDate] = useState(false);
  const [newDate, setNewDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [promptIdx, setPromptIdx] = useState(0);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<any>(null);

  // Build the default date list: last 14 days
  const buildDefaultDates = () =>
    Array.from({ length: 14 }, (_, i) => dayjs().subtract(i, "day").format("YYYY-MM-DD"));

  const handleUnlocked = (unlockedPin: string, fetchedEntries: DiaryEntry[]) => {
    setPin(unlockedPin);
    const map: Record<string, DiaryEntry> = {};
    fetchedEntries.forEach((e) => { map[e.date] = e; });
    setEntries(map);

    const defaults = buildDefaultDates();
    const extraDates = fetchedEntries
      .map((e) => e.date)
      .filter((d) => !defaults.includes(d));
    const all = [...new Set([...defaults, ...extraDates])].sort((a, b) => (a > b ? -1 : 1));
    setDates(all);
    setIsLocked(false);
  };

  const handleAddDate = () => {
    if (!dates.includes(newDate)) {
      const updated = [...new Set([...dates, newDate])].sort((a, b) => (a > b ? -1 : 1));
      setDates(updated);
    }
    setSelectedDate(newDate);
    setAddingDate(false);
    sound.pageTurn();
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleSave = async (date: string, body: string) => {
    setSavingIds((p) => ({ ...p, [date]: true }));
    try {
      const saved = await api.saveDiaryEntry(date, pin, { body, mood: selectedMood || undefined });
      setEntries((p) => ({ ...p, [date]: saved }));
      setSavedIds((p) => ({ ...p, [date]: true }));
      setSaveErrors((p) => ({ ...p, [date]: "" }));
      setTimeout(() => setSavedIds((p) => ({ ...p, [date]: false })), 2000);
    } catch (err: any) {
      setSaveErrors((p) => ({ ...p, [date]: err?.message || "Failed to save" }));
    } finally {
      setSavingIds((p) => ({ ...p, [date]: false }));
    }
  };

  const cyclePrompt = () => {
    sound.pop();
    setPromptIdx((prev) => (prev + 1) % DAILY_PROMPTS.length);
  };

  const insertPrompt = () => {
    sound.pop();
    if (!textareaRef.current) return;
    const p = DAILY_PROMPTS[promptIdx];
    const current = textareaRef.current.value.trim();
    textareaRef.current.value = current ? `${current}\n\n✨ *${p}*\n` : `✨ *${p}*\n`;
    textareaRef.current.focus();
    handleSave(selectedDate, textareaRef.current.value.trim());
  };

  const selectMoodPill = (mood: string) => {
    sound.pop();
    const next = mood === selectedMood ? null : mood;
    setSelectedMood(next);
    if (textareaRef.current) {
      handleSave(selectedDate, textareaRef.current.value.trim());
    }
  };

  const handleTextChange = () => {
    setIsTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      if (textareaRef.current) {
        handleSave(selectedDate, textareaRef.current.value.trim());
      }
    }, 1500);
  };

  if (isLocked) return <LockScreen onUnlocked={handleUnlocked} />;

  const entry = entries[selectedDate];
  const currentText = entry?.body || "";
  const wordCount = currentText.trim() ? currentText.trim().split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="h-full flex overflow-hidden bg-transparent">
      {/* Passcode Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <PasscodeSettingsModal
            currentPin={pin}
            onClose={() => setShowSettings(false)}
            onPinChanged={(newP) => {
              if (newP) setPin(newP);
              else {
                setPin("");
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* ─── Left Sidebar: Date List ────────────────────────────────────────── */}
      <aside className="w-72 flex-shrink-0 border-r border-rule flex flex-col bg-surface/90 select-none">
        <div className="px-5 py-4 border-b border-rule flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center text-accent">
              <BookOpen className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h2 className="font-bold text-ink text-base font-serif">Diary Entries</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              title="Add date"
              onClick={() => { sound.pop(); setAddingDate((v) => !v); }}
              className="p-1.5 rounded-lg hover:bg-raised text-ink-faint hover:text-ink transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.2]" />
            </button>
            <button
              title="Passcode Settings"
              onClick={() => setShowSettings(true)}
              className="p-1.5 rounded-lg hover:bg-raised text-ink-faint hover:text-ink transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 stroke-[1.8]" />
            </button>
            <button
              title="Lock diary"
              onClick={() => { sound.pageTurn(); setIsLocked(true); setPin(""); setEntries({}); }}
              className="p-1.5 rounded-lg hover:bg-accent/10 text-ink-faint hover:text-accent transition-colors cursor-pointer"
            >
              <Lock className="w-4 h-4 stroke-[1.8]" />
            </button>
          </div>
        </div>

        {/* Add date picker */}
        <AnimatePresence>
          {addingDate && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="p-3 border-b border-rule bg-raised flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-accent flex-shrink-0" />
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="morning-input py-1 text-xs"
                />
                <button
                  onClick={handleAddDate}
                  className="p-1.5 rounded-lg bg-accent hover:bg-accent-soft text-white transition-colors cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Date List */}
        <nav className="flex-1 overflow-y-auto py-2 px-2.5 space-y-1">
          {dates.map((date) => {
            const d = dayjs(date);
            const isToday = date === dayjs().format("YYYY-MM-DD");
            const isSelected = date === selectedDate;
            const hasEntry = !!entries[date]?.body;

            return (
              <button
                key={date}
                onClick={() => { sound.pageTurn(); setSelectedDate(date); }}
                className={clsx(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left group cursor-pointer",
                  isSelected
                    ? "bg-surface border border-rule shadow-sm text-ink"
                    : "hover:bg-black/[0.03] border border-transparent text-ink-soft"
                )}
              >
                <div className={clsx(
                  "w-9 h-9 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-xs font-bold leading-tight font-serif",
                  isToday
                    ? "bg-accent text-white shadow-xs"
                    : isSelected
                      ? "bg-accent/15 text-accent border border-accent/30"
                      : "bg-surface text-ink-soft border border-rule"
                )}>
                  <span className="text-[9px] uppercase tracking-wider opacity-80">{d.format("MMM")}</span>
                  <span className="text-xs font-bold -mt-0.5">{d.format("D")}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className={clsx(
                    "text-xs font-bold truncate",
                    isSelected ? "text-ink" : "text-ink-soft"
                  )}>
                    {isToday ? "Today" : d.format("dddd")}
                  </div>
                  <div className="text-[11px] text-ink-faint truncate mt-0.5">
                    {hasEntry ? entries[date].body!.slice(0, 30) + (entries[date].body!.length > 30 ? "..." : "") : "No entry yet"}
                  </div>
                </div>

                {isSelected && <ChevronRight className="w-3.5 h-3.5 text-ink-faint flex-shrink-0" />}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ─── Right: Editor Canvas ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Header with Date, Word count & Save Pulse */}
            <div className="px-10 pt-6 pb-4 border-b border-rule flex items-center justify-between bg-surface/90 backdrop-blur-md select-none">
              <div>
                <p className="text-xs font-bold text-ink-faint uppercase tracking-wider font-mono">
                  {dayjs(selectedDate).format("dddd")}
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-ink font-serif tracking-tight mt-0.5">
                  {dayjs(selectedDate).format("MMMM D, YYYY")}
                </h2>
              </div>

              {/* Stats & Tactile Save Indicator */}
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-ink-faint px-2.5 py-1 rounded-lg bg-surface border border-rule">
                  {wordCount} words • ~{readTime}m read
                </span>

                <div className="h-8 flex items-center">
                  <AnimatePresence mode="wait">
                    {savingIds[selectedDate] || isTyping ? (
                      <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5 text-xs text-accent font-medium bg-accent/10 px-2.5 py-1 rounded-lg border border-accent/20">
                        <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                        <span>Autosaving...</span>
                      </motion.span>
                    ) : savedIds[selectedDate] ? (
                      <motion.span key="saved" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5 text-xs text-done font-semibold bg-done/10 px-2.5 py-1 rounded-lg border border-done/20">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Saved
                      </motion.span>
                    ) : saveErrors[selectedDate] ? (
                      <motion.span key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5 text-xs text-danger font-semibold bg-danger/10 px-2.5 py-1 rounded-lg border border-danger/20"
                        title={saveErrors[selectedDate]}>
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Save failed · Retrying</span>
                      </motion.span>
                    ) : (
                      <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5 text-xs text-ink-faint px-2 py-1">
                        <Pencil className="w-3.5 h-3.5 stroke-[1.8]" /> Ready
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Notebook canvas wrapper */}
            <div className="flex-1 overflow-hidden p-6 flex flex-col space-y-4">
              {/* Daily Reflection Prompt Carousel */}
              <div className="p-3.5 px-4.5 rounded-2xl bg-surface border border-rule shadow-xs flex items-center justify-between gap-4 select-none">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center text-accent flex-shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-ink-faint">
                      Daily Reflection Prompt
                    </div>
                    <p className="text-xs font-semibold text-ink truncate italic font-serif">
                      "{DAILY_PROMPTS[promptIdx]}"
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={cyclePrompt}
                    title="Shuffle prompt"
                    className="p-1.5 rounded-lg hover:bg-raised text-ink-faint hover:text-ink transition cursor-pointer"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={insertPrompt}
                    className="px-2.5 py-1 rounded-lg bg-surface hover:bg-raised border border-rule text-[11px] font-bold text-accent transition cursor-pointer"
                  >
                    Use Prompt
                  </button>
                </div>
              </div>

              {/* Mood selector strip */}
              <div className="flex items-center gap-2 px-1 select-none">
                <span className="text-xs font-bold text-ink-faint uppercase tracking-wider mr-1 flex items-center gap-1">
                  <Smile className="w-3.5 h-3.5" /> Mood:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {MOODS.map((m) => (
                    <button
                      key={m.label}
                      onClick={() => selectMoodPill(m.label)}
                      className={clsx(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
                        selectedMood === m.label
                          ? "bg-accent text-white border-accent shadow-xs"
                          : "bg-surface text-ink-soft border-rule hover:border-rule hover:text-ink"
                      )}
                    >
                      <span>{m.emoji}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Physical Journal Textured Page */}
              <div
                style={{ '--mood-glow': selectedMood && MOOD_GLOWS[selectedMood] ? MOOD_GLOWS[selectedMood] : 'transparent' } as React.CSSProperties}
                className="flex-1 overflow-hidden rounded-2xl bg-surface border border-rule p-6 sm:p-8 flex flex-col relative mood-glow transition-all duration-300">
                {/* Left Margin Accent Line */}
                <div className="absolute top-0 bottom-0 left-12 sm:left-16 w-px bg-accent/20 pointer-events-none" />

                <textarea
                  ref={textareaRef}
                  defaultValue={currentText}
                  onChange={handleTextChange}
                  placeholder={`Write your private thoughts for ${dayjs(selectedDate).format("MMMM D")}...`}
                  className="w-full h-full bg-transparent outline-none resize-none text-ink font-serif text-base sm:text-lg leading-relaxed placeholder:text-ink-faint pl-10 sm:pl-12 pr-4 border-none focus:ring-0"
                  autoFocus
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
