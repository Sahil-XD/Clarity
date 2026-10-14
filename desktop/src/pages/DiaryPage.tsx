import { useState, useRef, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import {
  Lock, Unlock, Key, BookOpen, AlertCircle,
  Plus, ChevronRight, Pencil, CalendarDays, Check,
  Sparkles, Shuffle, Smile,
  Settings, X,
  FileText, DollarSign, CheckSquare
} from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { api } from "@/lib/api";
import { sound } from "@/lib/sound";
import { dataCache } from "@/lib/dataCache";
import type { DiaryEntry, DiaryMood, Task, Expense } from "@/lib/types";
import { clsx } from "clsx";


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

const MOOD_COLORS: Record<string, string> = {
  Energized: '#F59E0B',
  Peaceful: '#6B8065',
  Productive: '#C87467',
  Chilled: '#D98A7E',
  Tired: '#8B5CF6',
  Thoughtful: '#3B82F6',
};

const MOODS: { label: DiaryMood; emoji: string }[] = [
  { label: "Energized", emoji: "⚡" },
  { label: "Peaceful", emoji: "🌿" },
  { label: "Productive", emoji: "🎯" },
  { label: "Chilled", emoji: "☕" },
  { label: "Tired", emoji: "🌙" },
  { label: "Thoughtful", emoji: "💭" },
];

// ── 3D Vault Lock Screen ─────────────────────────────────────────────────────
function LockScreen({
  onUnlocked,
}: {
  onUnlocked: (pin: string, entries: DiaryEntry[]) => void;
}) {
  const [pin, setPin] = useState("");
  const [mode, setMode] = useState<"unlock" | "reset" | "setup">("unlock");
  const [resetConfirmPin, setResetConfirmPin] = useState("");
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // hasPin
  const [success, setSuccess] = useState(false);
  
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [12, -12]), { damping: 28, stiffness: 220 });
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-12, 12]), { damping: 28, stiffness: 220 });

  const cardRef = useRef<HTMLDivElement>(null);
  const isVerifyingRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    api.checkDiaryPin()
      .then((exists) => {
        if (!mounted) return;
        // exists
        if (!exists) setMode("setup");
      })
      .catch(() => {
        if (!mounted) return;
        // false
        setMode("setup");
      });
    return () => { mounted = false; };
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const spawnParticle = (_k: string) => {
    // const id = Date.now();
    
    setTimeout(() => {
      
    }, 600);
  };

  const handleDigit = useCallback((d: string) => {
    sound.click();
    setError("");
    setActiveKey(d);
    setTimeout(() => setActiveKey(null), 120);
    spawnParticle(d);

    setPin((prev) => {
      if (prev.length >= 4) return prev;
      return prev + d;
    });
  }, []);

  const handleBackspace = useCallback(() => {
    sound.pop();
    setError("");
    setActiveKey("Backspace");
    setTimeout(() => setActiveKey(null), 120);
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    sound.pop();
    setPin("");
    setError("");
  }, []);

  const verifyPin = useCallback(async (code: string) => {
    if (isVerifyingRef.current) return;
    isVerifyingRef.current = true;
    setLoading(true);
    setError("");

    try {
      const valid = await api.verifyDiaryPin(code);
      if (valid) {
        sound.chime();
        setSuccess(true);
        const entries = await api.getDiaryEntries(code);
        setTimeout(() => {
          onUnlocked(code, entries);
        }, 500);
      } else {
        sound.pop();
        setError("Incorrect passcode. Please try again.");
        setPin("");
      }
    } catch (err: any) {
      sound.pop();
      setError(err?.message || "Authentication error.");
      setPin("");
    } finally {
      setLoading(false);
      isVerifyingRef.current = false;
    }
  }, [onUnlocked]);

  useEffect(() => {
    if (mode === "unlock" && pin.length === 4 && !loading && !success) {
      verifyPin(pin);
    } else if (mode === "setup" && pin.length === 4) {
      if (resetStep === 1) {
        sound.pop();
        setResetConfirmPin(pin);
        setPin("");
        setResetStep(2);
      } else {
        if (pin === resetConfirmPin) {
          sound.chime();
          setLoading(true);
          api.setDiaryPin(pin)
            .then(() => {
              setSuccess(true);
              return api.getDiaryEntries(pin);
            })
            .then((entries) => {
              setTimeout(() => onUnlocked(pin, entries), 500);
            })
            .catch((err) => {
              setError(err.message || "Failed to set PIN.");
              setPin("");
              setResetStep(1);
            })
            .finally(() => setLoading(false));
        } else {
          sound.pop();
          setError("PINs do not match. Try again.");
          setPin("");
          setResetConfirmPin("");
          setResetStep(1);
        }
      }
    } else if (mode === "reset" && pin.length === 4) {
      if (resetStep === 1) {
        sound.pop();
        setResetConfirmPin(pin);
        setPin("");
        setResetStep(2);
      } else {
        if (pin === resetConfirmPin) {
          sound.chime();
          setLoading(true);
          api.resetDiaryPin(pin)
            .then(() => {
              setSuccess(true);
              return api.getDiaryEntries(pin);
            })
            .then((entries) => {
              setTimeout(() => onUnlocked(pin, entries), 500);
            })
            .catch((err) => {
              setError(err.message || "Failed to reset PIN.");
              setPin("");
              setResetStep(1);
            })
            .finally(() => setLoading(false));
        } else {
          sound.pop();
          setError("PINs do not match. Try again.");
          setPin("");
          setResetConfirmPin("");
          setResetStep(1);
        }
      }
    }
  }, [pin, mode, resetStep, resetConfirmPin, loading, success, verifyPin, onUnlocked]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (/^[0-9]$/.test(e.key)) {
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
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDigit, handleBackspace, handleClear]);

  const startResetMode = () => {
    sound.pop();
    setMode("reset");
    setResetStep(1);
    setPin("");
    setResetConfirmPin("");
    setError("");
  };

  const cancelResetMode = () => {
    sound.pop();
    setMode("unlock");
    setResetStep(1);
    setPin("");
    setResetConfirmPin("");
    setError("");
  };

  return (
    <div
      className="h-full flex items-center justify-center p-6 select-none bg-ground overflow-hidden"
      style={{ perspective: 1200 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        ref={cardRef}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative"
      >
        <div className="relative rounded-3xl bg-surface/95 border border-rule shadow-2xl p-8 backdrop-blur-xl transition-all duration-300">
          <div className="flex flex-col items-center text-center">
            <motion.div
              animate={success ? { scale: [1, 1.15, 1], rotate: [0, -6, 0] } : {}}
              className="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent mb-4 shadow-sm"
            >
              {success ? (
                <Unlock className="w-7 h-7 stroke-[2.2]" />
              ) : mode === "setup" ? (
                <Key className="w-7 h-7 stroke-[2.2]" />
              ) : (
                <Lock className="w-7 h-7 stroke-[2.2]" />
              )}
            </motion.div>

            <h1 className="text-2xl font-bold text-ink tracking-tight font-serif mb-1">
              {mode === "setup"
                ? (resetStep === 1 ? "Initialize Private Vault" : "Confirm Passcode")
                : mode === "reset"
                ? (resetStep === 1 ? "Enter New Passcode" : "Confirm New Passcode")
                : "Private Vault"}
            </h1>
            <p className="text-xs text-ink-faint font-sans max-w-xs mb-6">
              {mode === "setup"
                ? (resetStep === 1 ? "Inscribe a 4-digit master PIN to seal your private entries." : "Re-enter your 4-digit PIN to confirm.")
                : mode === "reset"
                ? (resetStep === 1 ? "Choose a new 4-digit passcode for your journal." : "Confirm your new 4-digit passcode.")
                : "Client-side AES-256-GCM encrypted personal reflections."}
            </p>

            {/* Digit Slots */}
            <div className="flex items-center gap-3.5 mb-6">
              {[0, 1, 2, 3].map((idx) => {
                const filled = pin.length > idx;
                const active = pin.length === idx;
                return (
                  <div
                    key={idx}
                    className={clsx(
                      "w-11 h-13 rounded-xl border flex items-center justify-center transition-all duration-200 font-mono text-xl font-bold",
                      filled
                        ? "border-accent bg-accent/10 text-accent shadow-xs"
                        : active
                        ? "border-accent/60 bg-ground ring-2 ring-accent/20"
                        : "border-rule bg-ground text-ink-faint"
                    )}
                  >
                    {filled ? "•" : ""}
                  </div>
                );
              })}
            </div>

            {error && (
              <p className="text-xs text-danger font-medium mb-4 flex items-center gap-1.5 animate-fadeIn">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </p>
            )}

            {/* Physical Keyboard Visualizer */}
            <div className="w-full flex flex-col items-center gap-2 pt-2">
              <div className="grid grid-cols-5 gap-1.5 max-w-xs">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => handleDigit(k)}
                    className={clsx(
                      "w-11 h-10 rounded-xl font-mono text-xs font-bold transition-all border flex items-center justify-center cursor-pointer shadow-xs",
                      activeKey === k
                        ? "bg-accent text-white border-accent scale-95"
                        : "bg-surface text-ink hover:border-accent border-rule"
                    )}
                  >
                    {k}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleBackspace}
                  disabled={pin.length === 0}
                  className="px-3 py-1.5 rounded-lg border border-rule bg-surface text-xs font-mono text-ink-soft hover:text-ink disabled:opacity-40 cursor-pointer"
                >
                  Backspace
                </button>
                {mode === "unlock" ? (
                  <button
                    type="button"
                    onClick={startResetMode}
                    className="text-xs text-ink-faint hover:text-accent font-mono transition-colors cursor-pointer ml-2"
                  >
                    Reset PIN?
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={cancelResetMode}
                    className="text-xs text-ink-faint hover:text-ink font-mono transition-colors cursor-pointer ml-2"
                  >
                    Cancel
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

// ── Passcode Settings Modal ──────────────────────────────────────────────────
function PasscodeSettingsModal({
  currentPin: _currentPin,
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
    sound.click();
    try {
      await api.setDiaryPin(newPin.trim());
      sound.chime();
      onPinChanged(newPin.trim());
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to update passcode.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="w-full max-w-sm bg-surface rounded-2xl border border-rule shadow-2xl overflow-hidden"
      >
        <div className="px-5 py-3.5 bg-raised border-b border-rule flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-bold text-ink font-serif">Vault Passcode</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-ink-faint hover:text-ink cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleChangePin} className="p-5 space-y-3">
          {error && <p className="text-xs text-danger font-medium">{error}</p>}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-ink-faint uppercase">New 4-Digit PIN</label>
            <input
              type="password"
              maxLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className="w-full px-3 py-2 rounded-lg bg-ground border border-rule text-center font-mono text-lg text-ink focus:outline-none focus:border-accent"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-ink-faint uppercase">Confirm PIN</label>
            <input
              type="password"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className="w-full px-3 py-2 rounded-lg bg-ground border border-rule text-center font-mono text-lg text-ink focus:outline-none focus:border-accent"
            />
          </div>
          <button
            type="submit"
            disabled={saving || newPin.length !== 4}
            className="w-full py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/90 disabled:opacity-40 cursor-pointer mt-2"
          >
            {saving ? "Saving..." : "Update Vault PIN"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ── Main Diary Unlocked View ─────────────────────────────────────────────────
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
  const [editorText, setEditorText] = useState("");
  
  // Phase 2.4: Segmented toggle 'all' | 'written'
  const [filterMode, setFilterMode] = useState<"all" | "written">("all");

  // Phase 3.1: Day's Footprint auto-margin data
  const [dayTasks, setDayTasks] = useState<Task[]>([]);
  const [dayExpenses, setDayExpenses] = useState<Expense[]>([]);
  const [isFootprintCollapsed, setIsFootprintCollapsed] = useState(false);

  const entriesRef = useRef(entries);
  entriesRef.current = entries;
  const editorTextRef = useRef(editorText);
  editorTextRef.current = editorText;
  const isLockedRef = useRef(isLocked);
  isLockedRef.current = isLocked;
  const saveQueueRef = useRef<Record<string, {
    inFlight: boolean;
    pending?: { body: string; mood?: DiaryEntry['mood'] | null };
  }>>({});

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<any>(null);
  const typingDateRef = useRef<string>(dayjs().format("YYYY-MM-DD"));

  // Build the default date list: last 14 days
  const buildDefaultDates = () =>
    Array.from({ length: 14 }, (_, i) => dayjs().subtract(i, "day").format("YYYY-MM-DD"));

  // Fetch Footprint data for selectedDate (Phase 3.1)
  useEffect(() => {
    const allTasks = dataCache.get<Task[]>("tasks") || [];
    const allExpenses = dataCache.get<Expense[]>("expenses") || [];

    setDayTasks(allTasks.filter((t) => t.due_at && t.due_at.startsWith(selectedDate)));
    setDayExpenses(allExpenses.filter((e) => e.date === selectedDate));

    if (allTasks.length === 0) {
      api.getTasks().then((ts) => {
        dataCache.set("tasks", ts);
        setDayTasks(ts.filter((t) => t.due_at && t.due_at.startsWith(selectedDate)));
      }).catch(() => {});
    }
    if (allExpenses.length === 0) {
      api.getExpenses().then((exs) => {
        dataCache.set("expenses", exs);
        setDayExpenses(exs.filter((e) => e.date === selectedDate));
      }).catch(() => {});
    }
  }, [selectedDate]);

  const handleLockDiary = () => {
    sound.pageTurn();
    isLockedRef.current = true;
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    saveQueueRef.current = {};
    setIsTyping(false);
    setEditorText("");
    editorTextRef.current = "";
    setPin("");
    setEntries({});
    entriesRef.current = {};
    setIsLocked(true);
  };

  const handleUnlocked = (unlockedPin: string, fetchedEntries: DiaryEntry[]) => {
    isLockedRef.current = false;
    setPin(unlockedPin);
    const map: Record<string, DiaryEntry> = {};
    fetchedEntries.forEach((e) => { map[e.date] = e; });
    setEntries(map);
    setEditorText(map[selectedDate]?.body || "");

    const defaults = buildDefaultDates();
    const extraDates = fetchedEntries
      .map((e) => e.date)
      .filter((d) => !defaults.includes(d));
    const all = [...new Set([...defaults, ...extraDates])].sort((a, b) => (a > b ? -1 : 1));
    setDates(all);
    setIsLocked(false);
  };

  const handleAddDate = () => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
      setIsTyping(false);
      handleSave(typingDateRef.current, editorText.trim(), entries[typingDateRef.current]?.mood);
    }
    if (!dates.includes(newDate)) {
      const updated = [...new Set([...dates, newDate])].sort((a, b) => (a > b ? -1 : 1));
      setDates(updated);
    }
    setSelectedDate(newDate);
    typingDateRef.current = newDate;
    setEditorText(entries[newDate]?.body || "");
    setAddingDate(false);
    sound.pageTurn();
  };

  const handleSave = async (date: string, body: string, moodOverride?: DiaryEntry['mood'] | null) => {
    if (isLockedRef.current || !pin) return;

    if (!saveQueueRef.current[date]) {
      saveQueueRef.current[date] = { inFlight: false };
    }
    const q = saveQueueRef.current[date];

    if (q.inFlight) {
      q.pending = {
        body,
        mood: moodOverride !== undefined ? moodOverride : (q.pending?.mood !== undefined ? q.pending.mood : entriesRef.current[date]?.mood),
      };
      return;
    }

    q.inFlight = true;
    setSavingIds((p) => ({ ...p, [date]: true }));

    try {
      if (isLockedRef.current || !pin) return;
      const moodToSave = moodOverride !== undefined ? (moodOverride || undefined) : entriesRef.current[date]?.mood;
      const saved = await api.saveDiaryEntry(date, pin, { body, mood: moodToSave });
      if (isLockedRef.current) return;
      setEntries((p) => {
        const next = { ...p, [date]: saved };
        entriesRef.current = next;
        return next;
      });
      setSavedIds((p) => ({ ...p, [date]: true }));
      setSaveErrors((p) => ({ ...p, [date]: "" }));
      setTimeout(() => {
        setSavedIds((p) => ({ ...p, [date]: false }));
      }, 2000);
    } catch (err: any) {
      console.error("[Diary] Save failed:", err);
      if (!isLockedRef.current) {
        setSaveErrors((p) => ({ ...p, [date]: err?.message || "Failed to save entry" }));
      }
    } finally {
      q.inFlight = false;
      setSavingIds((p) => ({ ...p, [date]: false }));
      if (isLockedRef.current || !pin) {
        q.pending = undefined;
        return;
      }
      if (q.pending) {
        const next = q.pending;
        q.pending = undefined;
        handleSave(date, next.body, next.mood);
      }
    }
  };

  const cyclePrompt = () => {
    sound.pop();
    setPromptIdx((prev) => (prev + 1) % DAILY_PROMPTS.length);
  };

  const insertPrompt = () => {
    sound.pop();
    const p = DAILY_PROMPTS[promptIdx];
    const current = editorText.trim();
    const nextVal = current ? `${current}\n\n• *${p}*\n` : `• *${p}*\n`;
    setEditorText(nextVal);
    handleSave(selectedDate, nextVal.trim());
  };

  const selectMoodPill = (mood: DiaryMood) => {
    sound.pop();
    const currentMood = entriesRef.current[selectedDate]?.mood || null;
    const next = mood === currentMood ? null : mood;
    setEntries((prev) => {
      const updated = {
        ...prev,
        [selectedDate]: {
          ...(prev[selectedDate] || {
            id: "",
            user_id: "",
            date: selectedDate,
            body: "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            deleted_at: null,
          }),
          mood: next,
          body: editorTextRef.current || (prev[selectedDate]?.body || ""),
        },
      };
      entriesRef.current = updated;
      return updated;
    });

    handleSave(selectedDate, editorTextRef.current.trim(), next);
  };

  const handleTextChange = (text: string) => {
    setIsTyping(true);
    editorTextRef.current = text;
    typingDateRef.current = selectedDate;

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    typingTimerRef.current = setTimeout(() => {
      typingTimerRef.current = null;
      setIsTyping(false);
      const targetDate = typingDateRef.current;
      handleSave(targetDate, editorTextRef.current.trim(), entriesRef.current[targetDate]?.mood);
    }, 1500);
  };

  const handleSelectDate = (date: string) => {
    if (date === selectedDate) return;
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
      setIsTyping(false);
      handleSave(typingDateRef.current, editorText.trim(), entries[typingDateRef.current]?.mood);
    }
    sound.pageTurn();
    setSelectedDate(date);
    typingDateRef.current = date;
    setEditorText(entries[date]?.body || "");
  };

  // Phase 3.1: Insert Footprint into Entry
  const handleInsertFootprint = () => {
    sound.chime();
    const completedTasks = dayTasks.filter((t) => t.completed);
    const daySpend = dayExpenses
      .filter((e) => e.expense_type === "EXPENSE")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const dateFormatted = dayjs(selectedDate).format("MMMM D, YYYY");

    const taskLines = completedTasks.length > 0
      ? completedTasks.map((t) => `  • ✓ ${t.title}`).join("\n")
      : "  • (No completed tasks recorded)";

    const expenseLines = dayExpenses.length > 0
      ? dayExpenses.map((e) => `  • $${Number(e.amount).toFixed(2)} — ${e.category}${e.description ? ` (${e.description})` : ""}`).join("\n")
      : "  • $0.00 logged";

    const stamp = `\n\n════════════════════════════════════════\n📜 Day's Footprint — ${dateFormatted}\n════════════════════════════════════════\nTasks Accomplished (${completedTasks.length}/${dayTasks.length}):\n${taskLines}\n\nLedger Spend ($${daySpend.toFixed(2)} total):\n${expenseLines}\n════════════════════════════════════════\n`;

    const updatedText = editorText + stamp;
    setEditorText(updatedText);
    editorTextRef.current = updatedText;
    handleSave(selectedDate, updatedText.trim(), entries[selectedDate]?.mood);
  };

  if (isLocked) {
    return <LockScreen onUnlocked={handleUnlocked} />;
  }

  const entry = entries[selectedDate];
  const currentMood = entry?.mood || null;
  const wordCount = editorText.trim() ? editorText.trim().split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  // Phase 2.4: Filtered dates based on 'all' | 'written'
  const visibleDates = filterMode === "written"
    ? dates.filter((d) => !!entries[d]?.body?.trim())
    : dates;

  const completedTasks = dayTasks.filter((t) => t.completed);
  const totalSpend = dayExpenses
    .filter((e) => e.expense_type === "EXPENSE")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="h-full flex overflow-hidden bg-transparent font-sans">
      <AnimatePresence>
        {showSettings && (
          <PasscodeSettingsModal
            currentPin={pin}
            onClose={() => setShowSettings(false)}
            onPinChanged={(newP) => {
              if (newP) setPin(newP);
              else setPin("");
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Left Sidebar: Date List & Decluttering (Phase 2.4) ────────────────────── */}
      <aside className="w-72 flex-shrink-0 border-r border-rule flex flex-col bg-surface/90 select-none">
        <div className="px-4 py-3.5 border-b border-rule flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent stroke-[2.2]" />
            <h2 className="font-bold text-ink text-sm font-serif">Diary Entries</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              title="Add date"
              onClick={() => { sound.pop(); setAddingDate((v) => !v); }}
              className="p-1 rounded-lg hover:bg-raised text-ink-faint hover:text-ink transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.2]" />
            </button>
            <button
              title="Passcode Settings"
              onClick={() => setShowSettings(true)}
              className="p-1 rounded-lg hover:bg-raised text-ink-faint hover:text-ink transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 stroke-[1.8]" />
            </button>
            <button
              title="Lock diary"
              onClick={handleLockDiary}
              className="p-1 rounded-lg hover:bg-accent/10 text-ink-faint hover:text-accent transition-colors cursor-pointer"
            >
              <Lock className="w-4 h-4 stroke-[1.8]" />
            </button>
          </div>
        </div>

        {/* Phase 2.4: Segmented Pill Toggle (All Days | Written Only) */}
        <div className="px-3 pt-2.5 pb-1">
          <div className="grid grid-cols-2 p-0.5 rounded-lg bg-raised border border-rule text-xs font-mono font-medium">
            <button
              type="button"
              onClick={() => { sound.click(); setFilterMode("all"); }}
              className={clsx(
                "py-1 rounded-md transition-all cursor-pointer text-center",
                filterMode === "all" ? "bg-surface text-ink font-bold shadow-2xs" : "text-ink-faint hover:text-ink"
              )}
            >
              All Days ({dates.length})
            </button>
            <button
              type="button"
              onClick={() => { sound.click(); setFilterMode("written"); }}
              className={clsx(
                "py-1 rounded-md transition-all cursor-pointer text-center",
                filterMode === "written" ? "bg-surface text-ink font-bold shadow-2xs" : "text-ink-faint hover:text-ink"
              )}
            >
              Written ({dates.filter((d) => !!entries[d]?.body?.trim()).length})
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
                  className="px-2 py-1 rounded bg-ground border border-rule text-xs font-mono text-ink outline-none"
                />
                <button
                  onClick={handleAddDate}
                  className="p-1.5 rounded-lg bg-accent text-white transition-colors cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Date List with Mood Dots & 1-line preview snippets */}
        <nav className="flex-1 overflow-y-auto py-2 px-2.5 space-y-1">
          {visibleDates.map((date) => {
            const d = dayjs(date);
            const isToday = date === dayjs().format("YYYY-MM-DD");
            const isSelected = date === selectedDate;
            const entryData = entries[date];
            const hasEntry = !!entryData?.body?.trim();
            const moodTag = entryData?.mood;

            return (
              <button
                key={date}
                onClick={() => handleSelectDate(date)}
                className={clsx(
                  "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all duration-150 text-left group cursor-pointer border",
                  isSelected
                    ? "bg-surface border-rule shadow-2xs text-ink"
                    : "hover:bg-raised/70 border-transparent text-ink-soft"
                )}
              >
                {/* Date Monogram badge */}
                <div
                  className={clsx(
                    "w-8 h-8 rounded-lg flex flex-col items-center justify-center flex-shrink-0 text-xs font-bold leading-tight font-serif",
                    isToday
                      ? "bg-accent text-white"
                      : isSelected
                      ? "bg-accent/15 text-accent border border-accent/30"
                      : "bg-surface text-ink-soft border border-rule"
                  )}
                >
                  <span className="text-[8.5px] uppercase tracking-wider opacity-80">{d.format("MMM")}</span>
                  <span className="text-xs font-bold -mt-0.5">{d.format("D")}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={clsx("text-xs font-bold truncate", isSelected ? "text-ink" : "text-ink-soft")}>
                      {isToday ? "Today" : d.format("ddd, D MMM")}
                    </span>

                    {/* Mood Colored Status Dot (Phase 2.4) */}
                    {moodTag && MOOD_COLORS[moodTag] && (
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: MOOD_COLORS[moodTag] }}
                        title={`Mood: ${moodTag}`}
                      />
                    )}
                  </div>

                  {/* 1-Line Preview Snippet */}
                  <p className="text-[11px] text-ink-faint truncate font-sans">
                    {hasEntry ? entryData.body.slice(0, 36) : "No entry recorded"}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── Right: Editor Canvas & Daily Chronicle Margin (Phase 3.1) ────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-8 pt-5 pb-3 border-b border-rule flex items-center justify-between bg-surface/90 backdrop-blur-md select-none shrink-0">
              <div>
                <p className="text-xs font-bold text-ink-faint uppercase tracking-wider font-mono">
                  {dayjs(selectedDate).format("dddd")}
                </p>
                <h2 className="text-2xl font-bold text-ink font-serif tracking-tight">
                  {dayjs(selectedDate).format("MMMM D, YYYY")}
                </h2>
              </div>

              {/* Stats & Save Indicator */}
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-ink-faint px-2 py-0.5 rounded bg-surface border border-rule">
                  {wordCount} words • ~{readTime}m read
                </span>

                <div className="h-7 flex items-center" aria-live="polite">
                  <AnimatePresence mode="wait">
                    {savingIds[selectedDate] || isTyping ? (
                      <span className="flex items-center gap-1.5 text-xs text-accent font-medium bg-accent/10 px-2.5 py-0.5 rounded-lg border border-accent/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                        <span>Autosaving…</span>
                      </span>
                    ) : savedIds[selectedDate] ? (
                      <span className="flex items-center gap-1.5 text-xs text-done font-semibold bg-done/10 px-2.5 py-0.5 rounded-lg border border-done/20">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Encrypted & Saved
                      </span>
                    ) : saveErrors[selectedDate] ? (
                      <span className="flex items-center gap-1.5 text-xs text-danger font-semibold bg-danger/10 px-2.5 py-0.5 rounded-lg border border-danger/20">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Save failed</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-ink-faint px-2 py-0.5">
                        <Pencil className="w-3 h-3 stroke-[1.8]" /> Ready
                      </span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Main Notebook Surface with Horizontal Split for Footprint Auto-Margin */}
            <div className="flex-1 overflow-hidden p-6 flex gap-5">
              {/* Left Main Writing Area */}
              <div className="flex-1 flex flex-col space-y-3.5 min-w-0">
                {/* Reflection Prompt */}
                <div className="p-3 px-4 rounded-xl bg-surface border border-rule shadow-2xs flex items-center justify-between gap-3 select-none shrink-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Sparkles className="w-4 h-4 text-accent shrink-0" />
                    <p className="text-xs font-semibold text-ink truncate italic font-serif">
                      "{DAILY_PROMPTS[promptIdx]}"
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={cyclePrompt}
                      title="Shuffle prompt"
                      className="p-1 rounded text-ink-faint hover:text-ink cursor-pointer"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={insertPrompt}
                      className="px-2 py-0.5 rounded bg-surface hover:bg-raised border border-rule text-[11px] font-bold text-accent cursor-pointer"
                    >
                      Use Prompt
                    </button>
                  </div>
                </div>

                {/* Mood Selector Strip */}
                <div className="flex items-center gap-2 px-1 select-none shrink-0">
                  <span className="text-xs font-mono font-bold text-ink-faint uppercase mr-1 flex items-center gap-1">
                    <Smile className="w-3.5 h-3.5" /> Mood:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {MOODS.map((m) => (
                      <button
                        key={m.label}
                        onClick={() => selectMoodPill(m.label)}
                        className={clsx(
                          "flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                          currentMood === m.label
                            ? "bg-accent text-white border-accent shadow-2xs"
                            : "bg-surface text-ink-soft border-rule hover:border-ink-soft hover:text-ink"
                        )}
                      >
                        <span>{m.emoji}</span>
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Physical Ruled Journal Surface */}
                <div
                  style={{ '--mood-glow': currentMood && MOOD_GLOWS[currentMood] ? MOOD_GLOWS[currentMood] : 'transparent' } as React.CSSProperties}
                  className="flex-1 overflow-hidden rounded-2xl bg-surface border border-rule p-6 sm:p-8 flex flex-col relative mood-glow transition-[border-color,box-shadow,background-color] duration-300"
                >
                  <div className="absolute top-0 bottom-0 left-12 sm:left-16 w-px bg-accent/20 pointer-events-none" />
                  <textarea
                    key={selectedDate}
                    ref={textareaRef}
                    value={editorText}
                    onChange={(e) => {
                      setEditorText(e.target.value);
                      handleTextChange(e.target.value);
                    }}
                    placeholder={`Write your private thoughts for ${dayjs(selectedDate).format("MMMM D")}…`}
                    className="w-full h-full bg-transparent outline-none resize-none text-ink font-serif text-base sm:text-lg leading-relaxed placeholder:text-ink-faint pl-10 sm:pl-12 pr-4 border-none"
                    autoFocus
                  />
                </div>
              </div>

              {/* ── Phase 3.1: Collapsible "Day's Footprint" Auto-Margin ──────────── */}
              <div
                className={clsx(
                  "flex-shrink-0 transition-all duration-300 flex flex-col",
                  isFootprintCollapsed ? "w-10" : "w-72"
                )}
              >
                {isFootprintCollapsed ? (
                  <button
                    type="button"
                    onClick={() => { sound.click(); setIsFootprintCollapsed(false); }}
                    className="h-full bg-surface border border-rule rounded-2xl p-2 flex flex-col items-center justify-between text-ink-faint hover:text-ink hover:border-accent transition-all cursor-pointer"
                    title="Expand Day's Footprint"
                  >
                    <FileText className="w-4 h-4 text-accent" />
                    <span className="font-mono text-[10px] uppercase tracking-wider [writing-mode:vertical-lr] rotate-180 font-bold">
                      Day's Footprint
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="h-full bg-surface border border-rule rounded-2xl p-4 shadow-2xs flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between pb-2 border-b border-rule shrink-0">
                      <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink font-bold flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-accent" /> Day's Footprint
                      </span>
                      <button
                        type="button"
                        onClick={() => { sound.click(); setIsFootprintCollapsed(true); }}
                        className="p-1 rounded text-ink-faint hover:text-ink cursor-pointer"
                        title="Collapse Footprint"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Aggregated Daily Activity */}
                    <div className="flex-1 overflow-y-auto py-3 space-y-3.5 text-xs">
                      {/* Tasks Checked Off */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-mono text-ink-faint uppercase">
                          <span className="flex items-center gap-1 font-semibold text-ink">
                            <CheckSquare className="w-3 h-3 text-accent" /> Tasks
                          </span>
                          <span>{completedTasks.length} / {dayTasks.length}</span>
                        </div>
                        {dayTasks.length > 0 ? (
                          <div className="space-y-1 pl-1">
                            {dayTasks.map((t) => (
                              <p key={t.id} className={clsx("truncate text-[11px]", t.completed ? "text-ink-faint line-through" : "text-ink")}>
                                • {t.title}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-ink-faint italic pl-1">No tasks recorded for date.</p>
                        )}
                      </div>

                      {/* Ledger Outflow */}
                      <div className="space-y-1.5 pt-2 border-t border-rule">
                        <div className="flex items-center justify-between text-[11px] font-mono text-ink-faint uppercase">
                          <span className="flex items-center gap-1 font-semibold text-ink">
                            <DollarSign className="w-3 h-3 text-accent" /> Ledger Spend
                          </span>
                          <span className="font-bold text-accent font-mono">${totalSpend.toFixed(2)}</span>
                        </div>
                        {dayExpenses.length > 0 ? (
                          <div className="space-y-1 pl-1">
                            {dayExpenses.slice(0, 4).map((ex) => (
                              <p key={ex.id} className="truncate text-[11px] text-ink font-mono">
                                • ${Number(ex.amount).toFixed(2)} <span className="font-sans text-ink-faint">({ex.category})</span>
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-ink-faint italic pl-1">$0.00 spent on date.</p>
                        )}
                      </div>
                    </div>

                    {/* 1-Click "Insert Footprint into Entry" */}
                    <div className="pt-2 border-t border-rule shrink-0">
                      <button
                        type="button"
                        onClick={handleInsertFootprint}
                        className="w-full py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-all active:scale-[0.98] shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Insert Footprint into Entry</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
