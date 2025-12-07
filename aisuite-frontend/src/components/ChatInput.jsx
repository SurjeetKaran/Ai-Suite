import React, { useState, useRef, useEffect } from "react";
import { useChatStore } from "../store/chatStore";
import { useAuthStore } from "../store/authStore";
import { useDropzone } from "react-dropzone";
import * as pdfjsLib from "pdfjs-dist";

// Icons
import { 
  PaperAirplaneIcon, 
  PaperClipIcon, 
  XMarkIcon, 
  SparklesIcon,
  ChevronUpIcon,
  DocumentTextIcon
} from "@heroicons/react/24/solid";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const MODULES = [
  { id: "CareerGPT", label: "Career", color: "text-blue-400" },
  { id: "StudyGPT",  label: "Study",  color: "text-green-400" },
  { id: "ContentGPT", label: "Content", color: "text-purple-400" },
];

export default function ChatInput() {
  const [input, setInput] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parsedFileText, setParsedFileText] = useState("");
  const [showModuleMenu, setShowModuleMenu] = useState(false);
  const textareaRef = useRef(null);

  const { sendMessage, loading, currentModule, setModule, conversationId, messages } = useChatStore();
  const { user, subscription } = useAuthStore();

  // 🔴 LIMIT LOGIC 🔴
  // 1. Daily Limit: Cannot start NEW chat if used 3 today
  const isDailyLimitReached = 
    subscription === "Free" && 
    (user?.dailyQueryCount || 0) >= 3 && 
    !conversationId;

  // 2. Chat Length Limit: Cannot reply if chat has >= 10 user messages
  const userMessageCount = messages.filter(m => m.role === "user").length;
  const isChatLimitReached = 
    subscription === "Free" && 
    conversationId && 
    userMessageCount >= 10;

  // Combined Block
  const isBlocked = isDailyLimitReached || isChatLimitReached;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const parseFileContent = async (file) => {
    try {
      const ext = file.name.split(".").pop().toLowerCase();
      if (["txt", "csv", "json"].includes(ext)) return await file.text();
      if (ext === "pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let text = "";
        const maxPages = Math.min(pdf.numPages, 5);
        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item) => item.str).join(" ") + "\n";
        }
        return text;
      }
      return "";
    } catch (error) {
      console.error("File parsing error:", error);
      alert("Error reading file.");
      return "";
    }
  };

  const onDrop = async (files) => {
    const file = files[0];
    if (!file) return;
    setUploadedFile(file);
    const text = await parseFileContent(file);
    setParsedFileText(text);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'text/*': ['.txt', '.csv', '.json'], 'application/pdf': ['.pdf'] },
    disabled: isBlocked || loading,
  });

  const clearFile = (e) => {
    e.stopPropagation();
    setUploadedFile(null);
    setParsedFileText("");
  };

  const handleSend = async () => {
    if ((!input.trim() && !parsedFileText) || isBlocked || loading) return;

    let finalMessage = input;
    if (parsedFileText) {
      finalMessage += `\n\n[Attached File: ${uploadedFile.name}]\nContent:\n${parsedFileText}`;
    }

    await sendMessage(finalMessage);
    setInput("");
    setUploadedFile(null);
    setParsedFileText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const activeModule = MODULES.find(m => m.id === currentModule) || MODULES[0];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-8">
      
      {/* ⚠️ DYNAMIC WARNING BANNER */}
      {isBlocked && (
        <div className="mb-4 flex items-center justify-center gap-2 p-3 text-sm text-amber-200 bg-amber-900/30 border border-amber-500/30 rounded-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4">
          <SparklesIcon className="w-4 h-4" />
          <span>
            {isDailyLimitReached 
              ? "Daily topic limit reached (3/3). Upgrade to Pro for unlimited chats." 
              : "Conversation limit reached (10/10). Upgrade to Pro to continue."
            }
          </span>
        </div>
      )}

      {/* Main Input Container */}
      <div className={`
        relative group flex flex-col bg-[#1e293b]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl transition-all duration-300 mb-4
        ${isBlocked ? 'opacity-50 pointer-events-none grayscale' : 'hover:border-blue-500/30 focus-within:border-blue-500/50 focus-within:shadow-blue-500/10'}
      `}>
        
        {/* File Preview */}
        {uploadedFile && (
          <div className="mx-4 mt-3 flex items-center gap-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl w-fit">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <DocumentTextIcon className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-blue-100 truncate max-w-[150px]">{uploadedFile.name}</span>
              <span className="text-[10px] text-blue-300 uppercase font-bold">Attached</span>
            </div>
            <button onClick={clearFile} className="ml-2 hover:bg-white/10 rounded-full p-1 transition">
              <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-white" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 p-3">
          
          {/* Module Selector */}
          <div className="relative pb-2">
            <button 
              onClick={() => setShowModuleMenu(!showModuleMenu)}
              disabled={isBlocked}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group/btn"
            >
              <span className={`text-xs font-bold uppercase tracking-wide ${activeModule.color}`}>
                {activeModule.label}
              </span>
              <ChevronUpIcon className={`w-3 h-3 text-gray-500 transition-transform duration-300 ${showModuleMenu ? 'rotate-180' : ''}`} />
            </button>

            {showModuleMenu && (
              <div className="absolute bottom-12 left-0 z-50 w-40 bg-[#0f172a] border border-white/10 rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-2">
                <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-white/5">
                  Select Mode
                </div>
                {MODULES.map(mod => (
                  <button
                    key={mod.id}
                    onClick={() => { setModule(mod.id); setShowModuleMenu(false); }}
                    className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2
                      ${currentModule === mod.id ? 'bg-blue-600/10 text-blue-400' : 'text-gray-300 hover:bg-white/5'}
                    `}
                  >
                    <span className={`w-2 h-2 rounded-full ${mod.color.replace('text-', 'bg-')}`}></span>
                    {mod.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Text Area - Disabled if BLOCKED */}
          <textarea
            ref={textareaRef}
            className="flex-1 bg-transparent text-white placeholder-gray-400 text-sm px-2 py-3 outline-none resize-none max-h-[200px] overflow-y-auto custom-scrollbar"
            placeholder={isBlocked ? "Limit reached..." : "Ask anything..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isBlocked || loading} 
            rows={1}
          />

          {/* Actions */}
          <div className="flex items-center gap-2 pb-1">
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <button 
                disabled={isBlocked || loading}
                className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                title="Upload file"
              >
                <PaperClipIcon className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleSend}
              disabled={(!input.trim() && !uploadedFile) || loading || isBlocked}
              className={`p-2.5 rounded-xl transition-all duration-300 shadow-lg flex items-center justify-center
                ${(!input.trim() && !uploadedFile) || loading || isBlocked
                  ? "bg-white/5 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20 hover:scale-105"
                }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <PaperAirplaneIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-[10px] text-gray-500 font-medium tracking-wide">
          AiSuite is powered by multi-LLM architecture. Answers may vary.
        </p>
      </div>
    </div>
  );
}