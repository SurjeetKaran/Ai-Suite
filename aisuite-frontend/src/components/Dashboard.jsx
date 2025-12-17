


import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import ChatInput from "../components/ChatInput";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";
import LoadingSpinner from "../components/LoadingSpinner";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { ShareIcon } from "@heroicons/react/24/outline";
import API from "../api/axios";
import log from "../utils/logger";

/**
 * =====================================================
 * DASHBOARD
 * =====================================================
 * Responsibilities:
 * - App shell
 * - Bootstrapping authenticated user
 * - Loading available AI models
 * - Model selector (single vs multi-model)
 * - Share conversation (ChatGPT-style)
 * - Layout composition
 *
 * IMPORTANT DESIGN NOTES:
 * - Share feature creates a SNAPSHOT (backend)
 * - Dashboard ONLY triggers share creation
 * - No shared chat rendering happens here
 */

export default function Dashboard() {
  /* =====================================================
   * STORES
   * ===================================================== */

  const fetchUser = useAuthStore((s) => s.fetchUser);

  const {
    models,
    activeModels,
    selectModel,
    resetModels,
    sidebarOpen,
    loadModels,
    conversationId, // 🔑 REQUIRED for Share feature
  } = useChatStore();

  /* =====================================================
   * LOCAL UI STATE
   * ===================================================== */

  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false); // model dropdown
  const [toast, setToast] = useState(null);

  /* =====================================================
   * APP INITIALIZATION
   * ===================================================== */

  useEffect(() => {
    const init = async () => {
      try {
        log("INFO", "Dashboard init started");

        // 1️⃣ Fetch authenticated user
        await fetchUser();
        log("INFO", "User loaded");

        // 2️⃣ Load available AI models (SystemConfig-backed)
        await loadModels();
        log("INFO", "Models loaded");

      } catch (err) {
        log("ERROR", "Dashboard initialization failed", err);
      } finally {
        setLoading(false);
        log("INFO", "Dashboard ready");
      }
    };

    init();
  }, [fetchUser, loadModels]);

  useEffect(() => {
  if (!toast) return;

  const t = setTimeout(() => {
    setToast(null);
  }, 3000);

  return () => clearTimeout(t);
}, [toast]);


  /* =====================================================
   * SHARE CONVERSATION (ChatGPT-style)
   * =====================================================
   * - Creates a READ-ONLY snapshot in backend
   * - Returns public share URL
   * - Copies link to clipboard
   */

  const handleShareChat = async () => {
    try {
      if (!conversationId) {
        setToast({
  type: "error",
  text: "Start a conversation before sharing.",
});

        return;
      }

      log("INFO", "Sharing conversation", {
        chatId: conversationId,
      });

      const res = await API.post(
        `/chats/${conversationId}/share`
      );

      const shareUrl =
        window.location.origin + res.data.shareUrl;

      await navigator.clipboard.writeText(shareUrl);

      setToast({
  type: "success",
  text: "Share link copied to clipboard",
});

      log("INFO", "Chat shared successfully", {
        shareUrl,
      });

    } catch (err) {
      log("ERROR", "Failed to share chat", err);
      setToast({
  type: "error",
  text: "Failed to generate share link",
});

    }
  };

  /* =====================================================
   * LOADING STATE
   * ===================================================== */

  if (loading) {
    return <LoadingSpinner message="Initializing AiSuite..." />;
  }

  /* =====================================================
   * DERIVED UI STATE
   * ===================================================== */

  const selectedModel =
    activeModels.length === 1
      ? models.find((m) => m.id === activeModels[0])
      : null;

  /* =====================================================
   * RENDER
   * ===================================================== */

  return (
    <div className="flex h-screen bg-[#0B1120] text-white overflow-hidden">
      {/* ================= SIDEBAR ================= */}
      <Sidebar />

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 flex flex-col h-full transition-all duration-300">
        
        {/* ================= HEADER ================= */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 shrink-0">
          
          {/* BRAND */}
          <span
            className="
              font-extrabold text-xl tracking-wide
              bg-gradient-to-r from-indigo-400 to-purple-500
              text-transparent bg-clip-text
              animate-aisuite-glow
            "
          >
            AiSuite
          </span>

          {/* MODEL SELECTOR + SHARE */}
          <div className="flex items-center gap-2">

            {/* MODEL SELECTOR */}
            <div className="relative">
              <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm hover:bg-white/10 transition"
              >
                <span>
                  {selectedModel
                    ? selectedModel.name
                    : "All Models"}
                </span>
                <ChevronDownIcon
                  className={`w-4 h-4 transition-transform ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-56 bg-[#0f172a] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                  
                  {/* ALL MODELS */}
                  <button
                    onClick={() => {
                      log("INFO", "Model selector → reset to all");
                      resetModels();
                      setOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-white/5"
                  >
                    All Models (Default)
                  </button>

                  <div className="h-px bg-white/10" />

                  {/* SINGLE MODELS */}
                  {models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        log("INFO", "Model selector → single", model.id);
                        selectModel(model.id);
                        setOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-white/5"
                    >
                      {model.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* SHARE BUTTON */}
            <button
  onClick={handleShareChat}
  disabled={!conversationId}
  title={
    conversationId
      ? "Share conversation"
      : "Start a conversation to share"
  }
  className={`p-2 rounded-xl border transition ${
    conversationId
      ? "bg-white/5 border-white/10 hover:bg-white/10"
      : "bg-white/5 border-white/5 opacity-40 cursor-not-allowed"
  }`}
>
  <ShareIcon className="w-5 h-5 text-indigo-400" />
</button>


          </div>
        </header>

        {/* ================= CHAT WINDOW ================= */}
        <div className="flex-1 overflow-hidden">
          <ChatWindow />
        </div>

        {/* ================= CHAT INPUT ================= */}
        <div className="border-t border-white/5 shrink-0">
          <ChatInput />
        </div>
      </div>
      {/* ================= TOAST ================= */}
{toast && (
  <div className="fixed bottom-6 right-6 z-50">
    <div
      className={`
        px-5 py-3 rounded-xl shadow-xl border
        text-sm font-medium backdrop-blur-md
        transition-all animate-fade-in
        ${
          toast.type === "success"
            ? "bg-emerald-600/90 border-emerald-400 text-white"
            : "bg-red-600/90 border-red-400 text-white"
        }
      `}
    >
      {toast.text}
    </div>
  </div>
)}

    </div>
  );
}
