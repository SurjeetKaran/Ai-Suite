

import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/chatStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  SparklesIcon,
  BoltIcon,
  CubeTransparentIcon,
} from "@heroicons/react/24/solid";
import log from "../utils/logger";
import MarkdownRenderer from "./MarkdownRenderer";

/* =====================================================
 * DEFAULT PROMPTS (UNCHANGED UX)
 * ===================================================== */
const DEFAULT_PROMPTS = [
  {
    label: "CareerGPT",
    title: "Upgrade my resume",
    text: "Rewrite my resume for a senior software engineer role.",
    icon: "💼",
  },
  {
    label: "StudyGPT",
    title: "Learn faster",
    text: "Explain quantum physics like I'm 10 years old.",
    icon: "🎓",
  },
  {
    label: "ContentGPT",
    title: "Create content",
    text: "Write a viral LinkedIn post about AI trends.",
    icon: "✍️",
  },
  {
    label: "StudyGPT",
    title: "Quick summary",
    text: "Summarize the history of the Roman Empire.",
    icon: "🏛️",
  },
];

/* =====================================================
 * MODEL ICON (BASED ON MODEL NAME, NOT ID)
 * ===================================================== */
const iconForModelName = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("gpt")) return <BoltIcon className="w-5 h-5 text-green-400" />;
  if (n.includes("gemini")) return <SparklesIcon className="w-5 h-5 text-blue-400" />;
  if (n.includes("claude")) return <CubeTransparentIcon className="w-5 h-5 text-orange-400" />;
  return <SparklesIcon className="w-5 h-5 text-gray-400" />;
};

/* =====================================================
 * ANIMATED MARKDOWN (WITH TYPING EFFECT)
 * ===================================================== */
const AnimatedMarkdown = ({ text = "", animate }) => {
  const [displayed, setDisplayed] = useState(animate ? "" : text);

  useEffect(() => {
    if (!animate) {
      setDisplayed(text);
      return;
    }

    let i = 0;
    const id = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(id);
    }, 20);

    return () => clearInterval(id);
  }, [text, animate]);

  return <MarkdownRenderer content={displayed} />;
};

/* =====================================================
 * MAIN COMPONENT
 * ===================================================== */
export default function ChatWindow() {
  const {
    messages,
    loading,
    activeModels,
    models,
    conversationId,
    selectModel,
    setModule,
    sendMessage,
  } = useChatStore();

  const scrollRef = useRef(null);

  /* ---------------- AUTO SCROLL ---------------- */
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* ---------------- UI FLAGS ---------------- */
  const lastMessage = messages[messages.length - 1];
  const showLoader = loading && lastMessage?.role === "user";
  const showPrompts = messages.length === 0 && !conversationId;

  /* ---------------- HELPERS ---------------- */

  const getModelName = (id) =>
    models.find((m) => m.id === id)?.name || id;

  const extractText = (value) =>
    typeof value === "string" ? value : value?.text || "";

  /**
   * 🔑 DISPLAY RULE
   * - If multiple models active → show all
   * - If single model active → show only that model
   */
  const shouldShowModel = (modelId) => {
    if (activeModels.length === 1) {
      return activeModels[0] === modelId;
    }
    return true;
  };

  /* =====================================================
   * RENDER
   * ===================================================== */
  return (
    <div className="h-full overflow-y-auto px-3 sm:px-4 md:px-6 py-6 w-full">
      <div className="max-w-6xl mx-auto w-full">

        {/* ================= DEFAULT PROMPTS ================= */}
        {showPrompts && (
          <div className="mt-8 mb-12">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
                What would you like to explore today?
              </h1>
              <p className="text-gray-400 mt-3">
                Compare answers across multiple AI models — all in one place.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DEFAULT_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => {
                    log("INFO", "Default prompt selected", p);
                    setModule(p.label);
                    sendMessage(p.text);
                  }}
                  className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition text-left"
                >
                  <span className="text-2xl">{p.icon}</span>
                  <div className="mt-2">
                    <div className="text-xs uppercase text-gray-400 font-bold">
                      {p.title}
                    </div>
                    <div className="text-sm text-gray-200">
                      {p.text}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ================= MESSAGE STREAM ================= */}
        <AnimatePresence>
          {messages.map((msg, idx) => {

            /* ---------- USER MESSAGE ---------- */
            if (msg.role === "user") {
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end mb-8"
                >
                  <div className="bg-blue-600 text-white px-5 py-3 rounded-2xl max-w-[80%] whitespace-pre-wrap">
                    {msg.content}
                  </div>
                </motion.div>
              );
            }

            /* ---------- ASSISTANT MESSAGE ---------- */
            if (msg.role === "assistant") {
              const outputs = msg.individualOutputs || {};

              return (
                <div key={idx} className="mb-10">
                  <div
                    className={`grid gap-4 ${
                      activeModels.length === 1
                        ? "grid-cols-1"
                        : "grid-cols-1 lg:grid-cols-3"
                    }`}
                  >
                    {Object.entries(outputs)
                      .filter(([id]) => shouldShowModel(id))
                      .map(([id, value]) => {
                        const modelName = getModelName(id);

                        return (
                          <motion.div
                            key={id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => {
                              if (activeModels.length > 1) {
                                log("INFO", "Model locked for continuation", id);
                                selectModel(id);
                              }
                            }}
                            className="cursor-pointer bg-[#1A2332] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20"
                          >
                            {/* MODEL HEADER */}
                            <div className="flex items-center gap-2 px-4 py-3 bg-[#131B2D] border-b border-white/5">
                              {iconForModelName(modelName)}
                              <span className="text-xs font-bold uppercase text-gray-300">
                                {modelName}
                              </span>
                            </div>

                            {/* MODEL OUTPUT */}
                            <div className="p-4 text-sm text-gray-300">
                              <AnimatedMarkdown
                                text={extractText(value)}
                                animate={msg.animate}
                              />
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>
                </div>
              );
            }

            return null;
          })}
        </AnimatePresence>

        {/* ================= LOADER ================= */}
        {showLoader && (
          <div className="text-gray-400 text-sm mt-4">
            AI is thinking…
          </div>
        )}

        <div ref={scrollRef} />
      </div>
    </div>
  );
}

