import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckSquare, DollarSign, BookOpen, Calendar, FolderKanban,
  CornerDownLeft, X, Sparkles
} from "lucide-react";
import { api } from "@/lib/api";
import { sound } from "@/lib/sound";
import { dataCache } from "@/lib/dataCache";
import dayjs from "dayjs";

interface OmniInscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OmniInscribeModal({ isOpen, onClose }: OmniInscribeModalProps) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"task" | "expense" | "nav">("task");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  
  // Expense fields
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("General");
  
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      sound.pop();
      setQuery("");
      setAmount("");
      setCategory("General");
      setSuccessMsg("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global Ctrl+K / Cmd+K and Esc listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger open via CustomEvent or parent prop
          window.dispatchEvent(new CustomEvent("clarity:open-omni"));
        }
      }
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleInscribeTask = async () => {
    if (!query.trim() || isSubmitting) return;
    setIsSubmitting(true);
    sound.click();

    try {
      await api.createTask({
        title: query.trim(),
        completed: false,
        status: "TODO",
      });
      dataCache.invalidate("tasks");
      sound.chime();
      setSuccessMsg("Task inscribed to Ledger");
      setTimeout(() => {
        onClose();
        navigate("/tasks");
      }, 500);
    } catch (err: any) {
      console.error("Omni task error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogExpense = async () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0 || isSubmitting) return;
    setIsSubmitting(true);
    sound.click();

    try {
      await api.createExpense({
        amount: num,
        category: category || "General",
        description: query.trim() || "Omni-inscribed expense",
        date: dayjs().format("YYYY-MM-DD"),
        expense_type: "EXPENSE",
      });
      dataCache.invalidate("expenses");
      sound.chime();
      setSuccessMsg("Expense logged to Ledger");
      setTimeout(() => {
        onClose();
        navigate("/expenses");
      }, 500);
    } catch (err: any) {
      console.error("Omni expense error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNavigate = (path: string) => {
    sound.pageTurn();
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-ink/30 backdrop-blur-xs select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl bg-surface border border-rule rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header Tabs */}
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-rule bg-raised/50">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] text-ink-faint tracking-wider uppercase mr-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-accent" /> Omni-Inscribe
            </span>
            <button
              type="button"
              onClick={() => { setActiveTab("task"); sound.click(); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "task" ? "bg-accent text-white" : "text-ink-soft hover:text-ink hover:bg-raised"
              }`}
            >
              Task
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("expense"); sound.click(); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "expense" ? "bg-accent text-white" : "text-ink-soft hover:text-ink hover:bg-raised"
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("nav"); sound.click(); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "nav" ? "bg-accent text-white" : "text-ink-soft hover:text-ink hover:bg-raised"
              }`}
            >
              Jump View
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-ink-faint hover:text-ink hover:bg-raised transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Body */}
        <div className="p-4 space-y-3">
          {activeTab === "task" && (
            <div>
              <div className="relative flex items-center">
                <CheckSquare className="w-4.5 h-4.5 absolute left-3 text-accent stroke-[2]" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleInscribeTask();
                  }}
                  placeholder="Inscribe a task title into your Ledger..."
                  className="w-full pl-10 pr-24 py-3 rounded-xl bg-ground border border-rule text-[14px] text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent transition-colors font-sans"
                />
                <button
                  type="button"
                  onClick={handleInscribeTask}
                  disabled={!query.trim() || isSubmitting}
                  className="absolute right-2 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/90 disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Inscribe</span>
                  <CornerDownLeft className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {activeTab === "expense" && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div className="relative flex items-center">
                  <span className="absolute left-3 font-mono text-sm text-accent font-bold">$</span>
                  <input
                    ref={inputRef}
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-ground border border-rule text-[14px] font-mono text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-ground border border-rule text-xs font-medium text-ink focus:outline-none focus:border-accent transition-colors"
                >
                  <option value="General">General</option>
                  <option value="Food & Dining">Food & Dining</option>
                  <option value="Transit & Travel">Transit & Travel</option>
                  <option value="Supplies & Stationery">Supplies & Stationery</option>
                  <option value="Software & Hosting">Software & Hosting</option>
                  <option value="Health & Living">Health & Living</option>
                </select>
              </div>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLogExpense();
                  }}
                  placeholder="Expense memo or voucher description..."
                  className="w-full px-3 py-2.5 rounded-xl bg-ground border border-rule text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent transition-colors font-sans"
                />
                <button
                  type="button"
                  onClick={handleLogExpense}
                  disabled={!amount || isSubmitting}
                  className="absolute right-2 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/90 disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Record</span>
                  <CornerDownLeft className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {activeTab === "nav" && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleNavigate("/calendar")}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-ground border border-rule hover:border-accent text-left group transition-all cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-accent" />
                <div>
                  <p className="text-xs font-bold text-ink group-hover:text-accent">Calendar Folio</p>
                  <p className="text-[10.5px] text-ink-faint">Agenda & 365-day heatmap</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleNavigate("/diary")}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-ground border border-rule hover:border-accent text-left group transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-accent" />
                <div>
                  <p className="text-xs font-bold text-ink group-hover:text-accent">Private Vault</p>
                  <p className="text-[10.5px] text-ink-faint">Daily journal & reflections</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleNavigate("/tasks")}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-ground border border-rule hover:border-accent text-left group transition-all cursor-pointer"
              >
                <CheckSquare className="w-4 h-4 text-accent" />
                <div>
                  <p className="text-xs font-bold text-ink group-hover:text-accent">Tasks Ledger</p>
                  <p className="text-[10.5px] text-ink-faint">Ruled action dockets</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleNavigate("/expenses")}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-ground border border-rule hover:border-accent text-left group transition-all cursor-pointer"
              >
                <DollarSign className="w-4 h-4 text-accent" />
                <div>
                  <p className="text-xs font-bold text-ink group-hover:text-accent">Ruled Ledger</p>
                  <p className="text-[10.5px] text-ink-faint">Expenses & monthly velocity</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleNavigate("/projects")}
                className="col-span-2 flex items-center gap-2.5 p-2.5 rounded-xl bg-ground border border-rule hover:border-accent text-left group transition-all cursor-pointer"
              >
                <FolderKanban className="w-4 h-4 text-accent" />
                <div>
                  <p className="text-xs font-bold text-ink group-hover:text-accent">Craft Dockets (Kanban)</p>
                  <p className="text-[10.5px] text-ink-faint">Multi-stage initiative boards</p>
                </div>
              </button>
            </div>
          )}

          {successMsg && (
            <p className="text-xs font-semibold text-accent flex items-center gap-1.5 animate-fadeIn">
              <CornerDownLeft className="w-3.5 h-3.5" /> {successMsg}
            </p>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 bg-raised/30 border-t border-rule flex items-center justify-between text-[11px] font-mono text-ink-faint">
          <span>Tip: Press Enter to inscribe</span>
          <span>ESC to close</span>
        </div>
      </motion.div>
    </div>
  );
}
