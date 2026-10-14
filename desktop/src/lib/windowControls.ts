import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

/**
 * Robust window controls for Clarity desktop frameless window.
 * Uses native Rust IPC commands first for 100% reliability, with JS API fallback.
 */
export const windowControls = {
  minimize: async () => {
    try {
      await invoke("window_minimize");
    } catch {
      try {
        await getCurrentWindow().minimize();
      } catch (e) {
        console.warn("Minimize error:", e);
      }
    }
  },

  toggleMaximize: async () => {
    try {
      await invoke("window_toggle_maximize");
    } catch {
      try {
        await getCurrentWindow().toggleMaximize();
      } catch (e) {
        console.warn("Toggle maximize error:", e);
      }
    }
  },

  close: async () => {
    try {
      await invoke("window_close");
    } catch {
      try {
        await getCurrentWindow().close();
      } catch (e) {
        console.warn("Close error:", e);
      }
    }
  },
};
