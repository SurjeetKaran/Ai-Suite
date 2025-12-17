
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../api/axios";
import LoadingSpinner from "../components/LoadingSpinner";
import log from "../utils/logger";

export default function SharedChat() {
  const { shareId } = useParams();

  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSharedChat = async () => {
      try {
        log("INFO", "Fetching shared chat", { shareId });
        const res = await API.get(`/share/${shareId}`);
        setChat(res.data);
      } catch (err) {
        log("ERROR", "Failed to load shared chat", err);
        setError(
          err.response?.status === 404
            ? "This shared conversation no longer exists."
            : "Failed to load shared conversation."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSharedChat();
  }, [shareId]);

  if (loading) {
    return <LoadingSpinner message="Loading shared conversation..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-[#0B1120]">
        <div className="text-center px-6">
          <h1 className="text-2xl font-bold mb-3">Conversation Unavailable</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            to="/"
            className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 transition"
          >
            Go to AiSuite
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-white overflow-hidden">
      {/* ================= AURORA BACKGROUND ================= */}
      <div className="absolute inset-0 bg-[#0B1120]" />

      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px]" />
      <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px]" />

      {/* ================= CONTENT LAYER ================= */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* HEADER */}
        <header className="h-16 px-6 flex items-center justify-between border-b border-white/5 backdrop-blur-md bg-black/30">
          <span className="font-extrabold text-xl tracking-wide bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text animate-aisuite-glow">
            AiSuite
          </span>

          <span className="text-xs text-gray-400 uppercase tracking-wider">
            Shared Conversation
          </span>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto px-4 py-10">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-center text-lg sm:text-xl font-semibold mb-8 text-gray-200">
              {chat.title || "Shared Conversation"}
            </h1>

            <div className="space-y-5">
              {chat.messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-md
                      ${
                        msg.role === "user"
                          ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white"
                          : "bg-[#0f172a]/90 text-gray-200 border border-white/5"
                      }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* FOOTER */}
        <footer className="border-t border-white/5 py-4 text-center text-xs text-gray-500 backdrop-blur-sm bg-black/20">
          Read-only shared conversation · Powered by{" "}
          <span className="text-gray-300 font-medium">AiSuite</span>
        </footer>
      </div>
    </div>
  );
}
