import React, { useState, useRef, useEffect } from "react";
import { useChatStore } from "../store/chatStore";
import { useAuthStore } from "../store/authStore";
import { useDropzone } from "react-dropzone";
import * as pdfjsLib from "pdfjs-dist";
import log from "../utils/logger";
import dialog from "../utils/dialogService";

import {
  PaperAirplaneIcon,
  PaperClipIcon,
  XMarkIcon,
  SparklesIcon,
  ChevronUpIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/solid";

/* =====================================================
 * PDF WORKER SETUP
 * ===================================================== */
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/* =====================================================
 * STATIC MODULE DEFINITIONS
 * (Backend expects these exact IDs)
 * ===================================================== */
const MODULES = [
  { id: "CareerGPT", label: "Career", color: "text-blue-400" },
  { id: "StudyGPT", label: "Study", color: "text-green-400" },
  { id: "ContentGPT", label: "Content", color: "text-purple-400" },
];

export default function ChatInput() {
  /* =====================================================
   * LOCAL UI STATE
   * ===================================================== */
  const [input, setInput] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parsedFileText, setParsedFileText] = useState("");
  const [showModuleMenu, setShowModuleMenu] = useState(false);

  const textareaRef = useRef(null);

  /* =====================================================
   * STORES
   * ===================================================== */
  const {
    sendMessage,
    loading,
    currentModule,
    setModule,
    conversationId,
    messages,
    canSendMessage, // ✅ centralized limit logic
  } = useChatStore();

  const { subscription } = useAuthStore();

  /* =====================================================
   * LIMIT HANDLING (NO MAGIC NUMBERS HERE)
   * ===================================================== */
  const isBlocked = !canSendMessage();

  /* =====================================================
   * AUTO-RESIZE TEXTAREA
   * ===================================================== */
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height =
      `${textareaRef.current.scrollHeight}px`;
  }, [input]);

  /* =====================================================
   * FILE PARSING (TXT / CSV / JSON / PDF)
   * ===================================================== */
  const parseFileContent = async (file) => {
    try {
      const ext = file.name.split(".").pop().toLowerCase();
      log("INFO", "Parsing uploaded file", { name: file.name, ext });

      // Simple text-based files
      if (["txt", "csv", "json"].includes(ext)) {
        return await file.text();
      }

      // PDF files (first 5 pages only)
      if (ext === "pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let text = "";
        const maxPages = Math.min(pdf.numPages, 5);

        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(" ") + "\n";
        }

        return text;
      }

      return "";
    } catch (err) {
      log("ERROR", "File parsing failed", err);
      await dialog.alert("Failed to read uploaded file.");
      return "";
    }
  };

  /* =====================================================
   * FILE DROP HANDLER
   * ===================================================== */
  const onDrop = async (files) => {
    const file = files[0];
    if (!file) return;

    log("INFO", "File dropped", file.name);

    setUploadedFile(file);
    const text = await parseFileContent(file);
    setParsedFileText(text);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: false,
    disabled: loading || isBlocked,
    accept: {
      "text/*": [".txt", ".csv", ".json"],
      "application/pdf": [".pdf"],
    },
  });

  const clearFile = (e) => {
    e.stopPropagation();
    log("INFO", "Clearing uploaded file");
    setUploadedFile(null);
    setParsedFileText("");
  };

  /* =====================================================
   * SEND MESSAGE
   * ===================================================== */
  const handleSend = async () => {
    if (loading || isBlocked) return;

    if (!input.trim() && !parsedFileText) return;

    let finalMessage = input.trim();

    // Encode file content safely (no backend changes)
    if (parsedFileText) {
      finalMessage +=
        `\n\n<<<FILE:${uploadedFile.name}>>>\n` +
        parsedFileText +
        `\n<<<END_FILE>>>`;
    }

    log("INFO", "Sending message", {
      hasFile: !!uploadedFile,
      module: currentModule,
      conversationId,
    });

    await sendMessage(finalMessage);

    // Reset input state
    setInput("");
    setUploadedFile(null);
    setParsedFileText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  /* =====================================================
   * DERIVED UI VALUES
   * ===================================================== */
  const activeModule =
    MODULES.find(m => m.id === currentModule) || MODULES[0];

  /* =====================================================
   * RENDER
   * ===================================================== */
  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 md:px-6 pb-6">

      {/* ⚠️ LIMIT WARNING */}
      {isBlocked && (
        <div className="mb-4 flex items-center justify-center gap-2 p-3 text-xs text-amber-200 bg-amber-900/30 border border-amber-500/30 rounded-xl">
          <SparklesIcon className="w-4 h-4" />
          <span>
            {subscription === "Free"
              ? "Free plan limit reached. Upgrade to continue."
              : "Action temporarily blocked."}
          </span>
        </div>
      )}

      <div
        className={`relative flex flex-col bg-[#1e293b]/80 border border-white/10 rounded-3xl shadow-xl
        ${isBlocked ? "opacity-50 pointer-events-none" : ""}`}
      >

        {/* FILE PREVIEW */}
        {uploadedFile && (
          <div className="mx-4 mt-3 flex items-center gap-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <DocumentTextIcon className="w-4 h-4 text-blue-400" />
            <div className="flex-1 truncate text-xs text-blue-100">
              {uploadedFile.name}
            </div>
            <button onClick={clearFile}>
              <XMarkIcon className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 p-3">

          {/* MODULE SELECTOR */}
          <div className="relative">
            <button
              onClick={() => setShowModuleMenu(v => !v)}
              className="px-3 py-2 bg-white/5 rounded-xl flex items-center gap-2"
            >
              <span className={`text-xs font-bold ${activeModule.color}`}>
                {activeModule.label}
              </span>
              <ChevronUpIcon
                className={`w-3 h-3 transition ${showModuleMenu ? "rotate-180" : ""}`}
              />
            </button>

            {showModuleMenu && (
              <div className="absolute bottom-12 left-0 bg-[#0f172a] rounded-xl border border-white/10 z-50">
                {MODULES.map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      log("INFO", "Module selected", m.id);
                      setModule(m.id);
                      setShowModuleMenu(false);
                    }}
                    className="block w-full px-4 py-3 text-left text-sm hover:bg-white/5"
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* TEXTAREA */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            disabled={loading || isBlocked}
            placeholder={isBlocked ? "Limit reached..." : "Ask anything..."}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 bg-transparent resize-none text-sm outline-none text-white"
          />

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-2">
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <PaperClipIcon className="w-5 h-5 text-gray-400 cursor-pointer" />
            </div>

            <button
              onClick={handleSend}
              disabled={loading || isBlocked}
              className="p-2 bg-blue-600 rounded-xl"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <PaperAirplaneIcon className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] text-gray-500 mt-2">
        AiSuite uses multiple AI models. Answers may vary.
      </p>
    </div>
  );
}
