import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import ChatInput from "../components/ChatInput";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";
import LoadingSpinner from "../components/LoadingSpinner";

// Icons for Toggles
import { BoltIcon, SparklesIcon, CubeTransparentIcon } from "@heroicons/react/24/solid";

const MODEL_OPTIONS = [
  { id: "chatGPT", name: "ChatGPT 4o", icon: <BoltIcon className="w-4 h-4" />, color: "text-green-400" },
  { id: "gemini", name: "Gemini 2.0", icon: <SparklesIcon className="w-4 h-4" />, color: "text-blue-400" },
  { id: "claude", name: "Claude 3.5", icon: <CubeTransparentIcon className="w-4 h-4" />, color: "text-orange-400" },
];

export default function Dashboard() {
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const { activeModels, toggleModel } = useChatStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);

      // ✅ Wait for BOTH the API call AND a 5-second timer
      await Promise.all([
        fetchUser(), // Get user data
        new Promise((resolve) => setTimeout(resolve, 5000)) // Force 5s delay
      ]);

      setLoading(false);
    };
    initialize();
  }, [fetchUser]);

  if (loading) return <LoadingSpinner message="Initializing AiSuite..." />;

  return (
    <div className="flex h-screen bg-[#0B1120] text-white overflow-hidden font-sans">
      
      {/* 1. Sidebar (Fixed Width) */}
      <Sidebar />

      {/* 2. Main Content Area (Takes remaining width) */}
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        
        {/* ---------------- TOP BAR (Static Height) ---------------- */}
        <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-white/5 bg-[#0B1120] z-20">
          <h1 className="text-lg font-bold tracking-wide text-gray-200 hidden md:block">
            Dashboard
          </h1>

          {/* Toggles Container */}
          <div className="flex items-center gap-3 bg-white/5 p-1 rounded-xl border border-white/10">
            {MODEL_OPTIONS.map((model) => {
              const isActive = activeModels.includes(model.id);
              return (
                <button
                  key={model.id}
                  onClick={() => toggleModel(model.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                    isActive 
                      ? "bg-white/10 text-white shadow-sm ring-1 ring-white/20" 
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <span className={isActive ? model.color : "grayscale opacity-50"}>
                    {model.icon}
                  </span>
                  <span className={!isActive ? "opacity-0 w-0 overflow-hidden" : "opacity-100"}>
                    {model.name}
                  </span>
                </button>
              );
            })}
          </div>
        </header>

        {/* ---------------- CHAT WINDOW (Fills Available Space) ---------------- */}
        <div className="flex-1 min-h-0 overflow-hidden relative z-0">
          <ChatWindow />
        </div>

        {/* ---------------- CHAT INPUT (Static Height at Bottom) ---------------- */}
        <div className="w-full bg-[#0B1120] border-t border-white/5 shrink-0 z-20">
          <div className="max-w-6xl mx-auto">
            <ChatInput />
          </div>
        </div>

      </div>
    </div>
  );
}