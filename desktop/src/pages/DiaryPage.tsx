import { useState, useRef, useEffect } from "react";
import dayjs from "dayjs";
import {
  Lock, Unlock, Key, BookOpen, AlertCircle, Loader2,
  Plus, ChevronRight, Pencil, CalendarDays, Check,
  Bold, Italic, List, Sparkles, Shuffle, Smile
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

const MOODS = [
  { label: "Energized", emoji: "⚡" },
  { label: "Peaceful", emoji: "🌿" },
  { label: "Productive", emoji: "🔥" },
  { label: "Chilled", emoji: "☕" },
  { label: "Tired", emoji: "😴" },
  { label: "Thoughtful", emoji: "🧠" },
];

// ─── PIN / Lock screen ───────────────────────────────────────────────────────
function LockScreen({
  onUnlocked,
}: {
  onUnlocked: (pin: string, entries: DiaryEntry[]) => void;
}) {
  const [pin, setPin] = useState("");
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.getDiaryEntries(pin);
      sound.chime();
      onUnlocked(pin, data);
    } catch (err: any) {
      sound.pop();
      if (err.message?.includes("Diary PIN not set") || err.message?.includes("Conflict")) {
        setIsSettingPin(true);
        setError("No PIN set yet — create one to protect your diary.");
      } else {
        setError("Incorrect PIN. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) { setError("PIN must be at least 4 characters."); return; }
    setError("");
    setLoading(true);
    try {
      await api.setDiaryPin(pin);
      sound.chime();
      await handleUnlock(e);
      setIsSettingPin(false);
    } catch {
      setError("Failed to set PIN. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex items-center justify-center p-6 morning-bg relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-tr from-[#D98A7E]/15 to-[#C87467]/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="relative overflow-hidden rounded-3xl clay-card border border-black/[0.08] shadow-lg">
          <div className="relative px-8 pt-8 pb-6 text-center overflow-hidden">
            <div className="flex justify-center mb-3">
              <ClarityLogo size="lg" showText={false} theme="terracotta" shape="squircle" />
            </div>
            <h2 className="relative text-2xl font-bold tracking-tight text-[#24211E] font-serif">
              Personal Diary
            </h2>
            <p className="relative text-[#827A72] text-xs mt-1 font-medium">
              Encrypted &amp; private journal archives
            </p>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#C87467]/25 to-transparent" />

          <div className="p-7">
            <form onSubmit={isSettingPin ? handleSetPin : handleUnlock} className="space-y-4">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 p-3 text-[#C87467] bg-[#C87467]/10 rounded-xl text-xs font-semibold border border-[#C87467]/20"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-xs font-bold text-[#524B45] uppercase tracking-wider mb-2">
                  {isSettingPin ? "Create Passcode" : "Enter Passcode"}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#827A72]" />
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder={isSettingPin ? "Min. 4 characters" : "••••••••"}
                    className="morning-input pl-10 tracking-widest font-mono text-center text-lg font-bold"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !pin}
                className="w-full morning-btn-accent clay-button justify-center py-2.5 cursor-pointer font-sans"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isSettingPin ? (
                  <><Key className="w-4 h-4 stroke-[2.2]" /> Set Passcode</>
                ) : (
                  <><Unlock className="w-4 h-4 stroke-[2.2]" /> Unlock Journal</>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => { setIsSettingPin(!isSettingPin); setError(""); setPin(""); }}
                  className="text-xs font-semibold text-[#827A72] hover:text-[#C87467] transition cursor-pointer"
                >
                  {isSettingPin ? "Already set up? Unlock with passcode" : "First time? Set your diary passcode"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Diary unlocked view ─────────────────────────────────────────────────────
export default function DiaryPage() {
  const [pin, setPin] = useState("");
  const [isLocked, setIsLocked] = useState(true);
  const [entries, setEntries] = useState<Record<string, DiaryEntry>>({});
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
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
      const saved = await api.saveDiaryEntry(date, pin, { body });
      setEntries((p) => ({ ...p, [date]: saved }));
      setSavedIds((p) => ({ ...p, [date]: true }));
      sound.pop();
      setTimeout(() => setSavedIds((p) => ({ ...p, [date]: false })), 2000);
    } catch {
      alert(`Failed to save entry for ${date}`);
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
    textareaRef.current.value = current ? `${current}\n\n✍️ *${p}*\n` : `✍️ *${p}*\n`;
    textareaRef.current.focus();
    handleSave(selectedDate, textareaRef.current.value.trim());
  };

  const selectMoodPill = (mood: string) => {
    sound.pop();
    setSelectedMood(mood === selectedMood ? null : mood);
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
      {/* ── Left Sidebar: Date List ─────────────────────────────────── */}
      <aside className="w-68 flex-shrink-0 border-r border-[#DCD6CC] flex flex-col bg-[#ECE8E1]/90">
        <div className="px-5 py-4 border-b border-black/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#D98A7E]/15 flex items-center justify-center text-[#C87467]">
              <BookOpen className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h2 className="font-bold text-[#24211E] text-base font-serif">Diary Entries</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              title="Add date"
              onClick={() => { sound.pop(); setAddingDate((v) => !v); }}
              className="p-1.5 rounded-lg hover:bg-black/[0.04] text-[#827A72] hover:text-[#24211E] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.2]" />
            </button>
            <button
              title="Lock diary"
              onClick={() => { sound.pageTurn(); setIsLocked(true); setPin(""); setEntries({}); }}
              className="p-1.5 rounded-lg hover:bg-[#C87467]/10 text-[#827A72] hover:text-[#C87467] transition-colors cursor-pointer"
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
              <div className="p-3 border-b border-black/[0.06] bg-[#F2EFE9] flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#C87467] flex-shrink-0" />
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="morning-input py-1 text-xs"
                />
                <button
                  onClick={handleAddDate}
                  className="p-1.5 rounded-lg bg-[#C87467] hover:bg-[#B86356] text-white transition-colors cursor-pointer shadow-xs"
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
                    ? "bg-[#FAF8F5] border border-black/[0.08] shadow-sm text-[#24211E]"
                    : "hover:bg-black/[0.03] border border-transparent text-[#6E6862]"
                )}
              >
                <div className={clsx(
                  "w-9 h-9 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-xs font-bold leading-tight font-serif",
                  isToday
                    ? "bg-gradient-to-tr from-[#D98A7E] to-[#C87467] text-white shadow-xs"
                    : isSelected
                      ? "bg-[#D98A7E]/15 text-[#C87467] border border-[#D98A7E]/30"
                      : "bg-[#FAF8F5] text-[#524B45] border border-black/[0.06]"
                )}>
                  <span className="text-[9px] uppercase tracking-wider opacity-80">{d.format("MMM")}</span>
                  <span className="text-xs font-bold -mt-0.5">{d.format("D")}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className={clsx(
                    "text-xs font-bold truncate",
                    isSelected ? "text-[#24211E]" : "text-[#524B45]"
                  )}>
                    {isToday ? "Today" : d.format("dddd")}
                  </div>
                  <div className="text-[11px] text-[#827A72] truncate mt-0.5">
                    {hasEntry ? entries[date].body!.slice(0, 30) + (entries[date].body!.length > 30 ? "..." : "") : "No entry yet"}
                  </div>
                </div>

                {isSelected && <ChevronRight className="w-3.5 h-3.5 text-[#827A72] flex-shrink-0" />}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── Right: Editor Canvas ────────────────────────────────────── */}
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
            <div className="px-10 pt-6 pb-4 border-b border-[#DDD7CE] flex items-center justify-between bg-[#F5F2EC]/90 backdrop-blur-md">
              <div>
                <p className="text-xs font-bold text-[#827A72] uppercase tracking-wider font-mono">
                  {dayjs(selectedDate).format("dddd")}
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#24211E] font-serif tracking-tight mt-0.5">
                  {dayjs(selectedDate).format("MMMM D, YYYY")}
                </h2>
              </div>

              {/* Stats & Tactile Save Indicator */}
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-[#827A72] px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-black/[0.06]">
                  {wordCount} words · ~{readTime}m read
                </span>

                <div className="h-8 flex items-center">
                  <AnimatePresence mode="wait">
                    {savingIds[selectedDate] || isTyping ? (
                      <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5 text-xs text-[#C87467] font-medium bg-[#C87467]/10 px-2.5 py-1 rounded-lg border border-[#C87467]/20">
                        <span className="w-2 h-2 rounded-full bg-[#C87467] animate-ping" />
                        <span>Autosaving...</span>
                      </motion.span>
                    ) : savedIds[selectedDate] ? (
                      <motion.span key="saved" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5 text-xs text-[#6B8065] font-semibold bg-[#6B8065]/10 px-2.5 py-1 rounded-lg border border-[#6B8065]/20">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Saved
                      </motion.span>
                    ) : (
                      <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5 text-xs text-[#827A72] px-2 py-1">
                        <Pencil className="w-3.5 h-3.5 stroke-[1.8]" /> Ready
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Notebook canvas wrapper */}
            <div className="flex-1 overflow-hidden p-6 flex flex-col space-y-4">

              {/* Daily Reflection Prompt Carousel (Beats the blank page block!) */}
              <div className="p-3.5 px-4.5 rounded-2xl bg-[#FAF8F5] border border-black/[0.06] shadow-xs flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-[#D98A7E]/20 text-[#C87467] flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <p className="font-serif italic text-sm text-[#524B45] truncate">
                    &ldquo;{DAILY_PROMPTS[promptIdx]}&rdquo;
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={cyclePrompt}
                    title="Cycle to next prompt"
                    className="p-1.5 rounded-lg text-[#827A72] hover:text-[#24211E] hover:bg-black/[0.04] transition-colors cursor-pointer"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={insertPrompt}
                    className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] hover:bg-white text-xs font-semibold text-[#C87467] border border-[#C87467]/30 hover:border-[#C87467] transition-all cursor-pointer shadow-2xs"
                  >
                    Use Prompt
                  </button>
                </div>
              </div>

              {/* Mood / Vibe Chips Bar */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  <span className="text-[11px] font-semibold text-[#827A72] mr-1">Mood:</span>
                  {MOODS.map((m) => {
                    const isSelected = selectedMood === m.label;
                    return (
                      <button
                        key={m.label}
                        type="button"
                        onClick={() => selectMoodPill(m.label)}
                        className={clsx(
                          "px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 flex items-center gap-1 cursor-pointer",
                          isSelected
                            ? "bg-[#C87467] text-white shadow-xs scale-105"
                            : "bg-[#FAF8F5] hover:bg-white text-[#524B45] border border-black/[0.06]"
                        )}
                      >
                        <span>{m.emoji}</span>
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notebook Ruled Body */}
              <div className="clay-card flex-1 flex flex-col overflow-hidden border border-black/[0.08] shadow-sm relative">
                <div className="absolute left-6 top-7 w-2.5 h-2.5 rounded-full brass-pin shadow-xs z-10 pointer-events-none" />
                <div className="absolute left-6 bottom-16 w-2.5 h-2.5 rounded-full brass-pin shadow-xs z-10 pointer-events-none" />

                <div className="flex-1 overflow-auto ruled-paper pl-16 pr-8 py-6">
                  <textarea
                    ref={textareaRef}
                    key={selectedDate}
                    defaultValue={entry?.body || ""}
                    onChange={handleTextChange}
                    placeholder="What is on your mind today? Write down a moment, thought, or feeling..."
                    className="w-full h-full min-h-[300px] bg-transparent resize-none outline-none leading-[32px] text-[#24211E] placeholder-[#A39B92] text-lg font-serif"
                    onBlur={(e) => {
                      const val = e.target.value.trim();
                      if (val !== (entry?.body || "").trim()) {
                        handleSave(selectedDate, val);
                      }
                    }}
                  />
                </div>

                {/* Bottom Notebook Toolbar */}
                <div className="bg-[#F2EFE9] px-6 py-2.5 border-t border-black/[0.06] flex items-center justify-between z-10">
                  <div className="flex items-center gap-1 text-[#827A72]">
                    <button
                      type="button"
                      title="Bold"
                      onClick={() => {
                        sound.pop();
                        if (textareaRef.current) {
                          textareaRef.current.value += "**bold**";
                          textareaRef.current.focus();
                        }
                      }}
                      className="p-1.5 hover:text-[#24211E] hover:bg-black/[0.04] rounded-lg transition-colors cursor-pointer"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Italic"
                      onClick={() => {
                        sound.pop();
                        if (textareaRef.current) {
                          textareaRef.current.value += "*italic*";
                          textareaRef.current.focus();
                        }
                      }}
                      className="p-1.5 hover:text-[#24211E] hover:bg-black/[0.04] rounded-lg transition-colors cursor-pointer"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Bullet list"
                      onClick={() => {
                        sound.pop();
                        if (textareaRef.current) {
                          textareaRef.current.value += "\n- ";
                          textareaRef.current.focus();
                        }
                      }}
                      className="p-1.5 hover:text-[#24211E] hover:bg-black/[0.04] rounded-lg transition-colors cursor-pointer"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (textareaRef.current) {
                        handleSave(selectedDate, textareaRef.current.value.trim());
                      }
                    }}
                    className="morning-btn-accent clay-button text-xs py-1.5 px-3.5 cursor-pointer"
                  >
                    Save Entry
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
