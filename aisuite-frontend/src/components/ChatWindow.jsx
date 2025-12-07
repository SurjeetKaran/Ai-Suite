


import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/chatStore";
import { useAuthStore } from "../store/authStore"; // 🆕 Import Auth Store
import ReactMarkdown from "react-markdown";

// Logos
import { SparklesIcon, BoltIcon, CubeTransparentIcon } from "@heroicons/react/24/solid";

const MODEL_CONFIG = {
  chatGPT: { name: "ChatGPT 4o", color: "text-green-400", icon: <BoltIcon className="w-5 h-5" /> },
  gemini:  { name: "Gemini 2.0 Flash", color: "text-blue-400", icon: <SparklesIcon className="w-5 h-5" /> },
  claude:  { name: "Claude 3.5 Sonnet", color: "text-orange-400", icon: <CubeTransparentIcon className="w-5 h-5" /> },
};

const QUICK_PROMPTS = [
  { label: "CareerGPT", text: "Rewrite my resume for a Senior Dev role", icon: "💼" },
  { label: "StudyGPT", text: "Explain Quantum Physics like I'm 5", icon: "🎓" },
  { label: "ContentGPT", text: "Write a viral tweet about AI tools", icon: "🚀" },
  { label: "StudyGPT", text: "Summarize the history of Rome", icon: "🏛️" },
];

// Typing Effect Component (30ms speed)
const TypingEffect = ({ text, animate }) => {
  const [displayedText, setDisplayedText] = useState(animate ? "" : text);

  useEffect(() => {
    if (!animate || !text) {
      setDisplayedText(text);
      return;
    }

    setDisplayedText(""); 
    let index = 0;
    
    const intervalId = setInterval(() => {
      if (index < text.length - 1) {
        setDisplayedText((prev) => prev + text[index]);
        index++;
      } else {
        setDisplayedText(text);
        clearInterval(intervalId);
      }
    }, 30);

    return () => clearInterval(intervalId);
  }, [text, animate]);

  return <ReactMarkdown>{displayedText}</ReactMarkdown>;
};

export default function ChatWindow() {
  const { messages, loading, sendMessage, setModule, conversationId } = useChatStore();
  const { user, subscription } = useAuthStore(); // 🆕 Get User Data
  
  const scrollRef = useRef();
  const isHistoryLoadRef = useRef(false);

  // 🆕 Check Limit (Same logic as ChatInput)
  const isLimitReached = 
    subscription === "Free" && 
    (user?.dailyQueryCount || 0) >= 3;

  // Scroll Logic
  useEffect(() => {
    if (isHistoryLoadRef.current !== conversationId) {
      isHistoryLoadRef.current = conversationId;
      return; 
    }
    const lastMsg = messages[messages.length - 1];
    const isUserLast = lastMsg?.role === "user";

    if (loading || isUserLast) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, conversationId]);

  const handleQuickPrompt = (prompt) => {
    if (isLimitReached) return; // 🔒 Block action
    setModule(prompt.label);
    sendMessage(prompt.text);
  };

  return (
    <div className="h-full overflow-y-auto thin-scrollbar p-4 w-full flex flex-col">
      
      {/* Centered Container */}
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">

        {/* ---------------- EMPTY STATE ---------------- */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 h-full px-4">
            <div className="mb-8 flex flex-col items-center animate-in fade-in zoom-in duration-500">
              <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20 mb-4">
                <SparklesIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to AiSuite</h2>
              <p className="text-gray-400 text-sm max-w-md text-center">
                {isLimitReached 
                  ? <span className="text-amber-400">Daily limit reached. Upgrade to continue.</span>
                  : "Unleash the power of multi-model AI. Select a module below or start typing."
                }
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickPrompt(prompt)}
                  disabled={isLimitReached} // 🔒 Disable Button
                  className={`flex items-center gap-4 p-4 border rounded-xl text-left transition-all group
                    ${isLimitReached 
                      ? "bg-white/5 border-white/5 opacity-50 cursor-not-allowed grayscale" // Disabled Style
                      : "bg-white/5 hover:bg-white/10 border-white/10 hover:-translate-y-1 hover:shadow-lg" // Active Style
                    }
                  `}
                >
                  <span className="text-2xl grayscale group-hover:grayscale-0 transition-all">{prompt.icon}</span>
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${isLimitReached ? "text-gray-600" : "text-gray-500 group-hover:text-blue-400"}`}>
                      {prompt.label}
                    </span>
                    <span className={`text-sm font-medium ${isLimitReached ? "text-gray-500" : "text-gray-300 group-hover:text-white"}`}>
                      {prompt.text}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ---------------- MESSAGE STREAM ---------------- */}
        {messages.map((msg, idx) => {
          // User Message
          if (msg.role === "user") {
            return (
              <div key={idx} className="flex justify-end w-full mb-8">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-5 py-3.5 rounded-2xl rounded-tr-sm max-w-[85%] md:max-w-[70%] shadow-lg break-words text-sm md:text-base leading-relaxed">
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
          }

          // AI Response
          if (msg.role === "assistant" && msg.individualOutputs) {
            return (
              <div key={idx} className="w-full mb-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full animate-in fade-in slide-in-from-bottom-2">
                  {Object.entries(msg.individualOutputs).map(([key, text]) => {
                    if (!text) return null;
                    const config = MODEL_CONFIG[key] || { name: key, color: "text-gray-400" };

                    return (
                      <div 
                        key={key} 
                        className="bg-[#1A2332] border border-white/10 rounded-2xl overflow-hidden shadow-lg flex flex-col hover:border-white/20 transition-colors min-w-0"
                      >
                        {/* Header */}
                        <div className="flex items-center gap-2 px-4 py-3 bg-[#131B2D] border-b border-white/5 shrink-0">
                          <span className={config.color}>{config.icon}</span>
                          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                            {config.name}
                          </span>
                        </div>
                        
                        {/* Content */}
                        <div className="p-4 text-sm text-gray-300 leading-relaxed">
                          <div className="prose prose-invert prose-sm max-w-none break-words">
                            <TypingEffect text={text} animate={msg.animate} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }
          return null;
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-center py-4">
            <div className="flex gap-2 p-2 bg-white/5 rounded-full">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}

        <div ref={scrollRef} className="h-4" />
      </div>
    </div>
  );
}