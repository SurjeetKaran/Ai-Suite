

import React, { useEffect, useState, useRef } from "react";
import { useChatStore } from "../store/chatStore";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import API from "../api/axios"; // Need direct API access for clear history

// Icons
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  ChatBubbleLeftIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
  UserCircleIcon,
  ArrowDownTrayIcon,
  LockClosedIcon,
  EllipsisVerticalIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon // 🆕 Settings Icon
} from "@heroicons/react/24/outline";

const expandedWidth = "w-64";
const collapsedWidth = "w-20";
const DAILY_LIMIT = 3;

const MODEL_CONFIG = {
  chatGPT: { name: "ChatGPT 4o" },
  gemini:  { name: "Gemini 2.0 Flash" },
  claude:  { name: "Claude 3.5 Sonnet" },
};

export default function Sidebar() {
  const { 
    sidebarOpen, 
    toggleSidebar, 
    history, 
    fetchHistory, 
    loadChat, 
    startNewChat,
    conversationId,
    messages,
    deleteChat,
    clearMessages // Add this action if you have it, or we manually clear history
  } = useChatStore();

  const { logout, subscription, user } = useAuthStore();
  const navigate = useNavigate();
  
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null); 
  const [showSettingsMenu, setShowSettingsMenu] = useState(false); // 🆕 Settings Menu State
  const [confirmClearAll, setConfirmClearAll] = useState(false);   // 🆕 Confirm Clear All State

  const menuRef = useRef(null);
  const settingsRef = useRef(null); // 🆕 Ref for settings menu

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close Chat Menu
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
      // Close Settings Menu
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettingsMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    localStorage.clear();
    navigate("/login");
  };

  const handleDeleteChat = (e, id) => {
    e.stopPropagation();
    setActiveMenuId(null);
    setDeleteTargetId(id);
  };

  // 🆕 Clear All History Handler
  const handleClearHistory = async () => {
    try {
      await API.delete('/auth/history/clear'); // Call Backend
      fetchHistory(); // Refresh list (will be empty)
      startNewChat(); // Reset current view
      setConfirmClearAll(false);
      setShowSettingsMenu(false);
    } catch (err) {
      console.error("Failed to clear history", err);
    }
  };

  const confirmDelete = async () => {
    if (deleteTargetId) {
      await deleteChat(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  const handleExportPDF = (e) => {
    e.stopPropagation(); 
    if (messages.length === 0) return;
    const doc = new jsPDF();
    let y = 10;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;
    const maxWidth = 190;

    const addText = (text, fontSize = 10, isBold = false, color = [0, 0, 0]) => {
      doc.setFontSize(fontSize);
      doc.setTextColor(...color);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((line) => {
        if (y + 10 > pageHeight - margin) {
          doc.addPage();
          y = 10;
        }
        doc.text(line, margin, y);
        y += 7;
      });
      y += 3;
    };

    addText("AiSuite Chat Export", 16, true, [0, 102, 204]);
    addText(`Date: ${new Date().toLocaleDateString()}`, 10, false, [100, 100, 100]);
    y += 5;

    messages.forEach((msg) => {
      if (msg.role === "user") {
        addText(`User: ${msg.content}`, 12, true, [0, 0, 0]);
      } else if (msg.role === "assistant" && msg.individualOutputs) {
        Object.entries(msg.individualOutputs).forEach(([key, text]) => {
          if (text) {
            const label = MODEL_CONFIG[key]?.name || key;
            addText(`[${label}]:`, 11, true, [0, 51, 102]);
            addText(text, 10, false, [50, 50, 50]);
          }
        });
        y += 5;
      }
    });
    doc.save("AiSuite_Chat.pdf");
  };

  const queryCount = user?.dailyQueryCount || 0;
  const progressPercent = Math.min((queryCount / DAILY_LIMIT) * 100, 100);

  return (
    <>
      <div
        className={`flex flex-col h-screen bg-[#0B1120] backdrop-blur-2xl border-r border-white/5 text-gray-300 transition-all duration-300 overflow-x-hidden ${
          sidebarOpen ? expandedWidth : collapsedWidth
        }`}
      >
        {/* TOP HEADER */}
        <div className="p-4 flex items-center justify-between  bg-[#0B1120] shrink-0">
          {sidebarOpen && (
            <div className="flex items-center gap-2 font-bold text-white tracking-wide animate-in fade-in duration-300">
              <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">AiSuite</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
          >
            {sidebarOpen ? <ChevronLeftIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
          </button>
        </div>

        {/* NEW CHAT BUTTON */}
        <div className="px-3 mb-6 shrink-0">
          <button
            onClick={startNewChat}
            className={`flex items-center gap-3 w-full p-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all duration-300 group hover:shadow-blue-500/40 hover:-translate-y-0.5 ${
              !sidebarOpen ? "justify-center" : ""
            }`}
          >
            <PlusIcon className="w-5 h-5 transition-transform group-hover:rotate-90" />
            {sidebarOpen && <span className="font-semibold tracking-wide">New Chat</span>}
          </button>
        </div>

        {/* HISTORY LIST */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden thin-scrollbar px-3 bg-[#0B1120] space-y-1 pb-4">
          {sidebarOpen && <div className="text-[10px] font-bold text-gray-500 mb-3 px-2 uppercase tracking-widest">Recent Chats</div>}
          
          {history.map((chat) => (
            <div key={chat.id} className="relative group/item">
              <button
                onClick={() => loadChat(chat.id)}
                className={`flex items-center gap-3 w-full p-2.5 rounded-xl text-sm transition-all duration-200 border border-transparent ${
                  conversationId === chat.id 
                    ? "bg-white/10 text-white border-white/5 shadow-md pr-8"
                    : "hover:bg-white/5 text-gray-400 hover:text-white"
                } ${!sidebarOpen ? "justify-center" : ""}`}
                title={chat.title}
              >
                <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                  conversationId === chat.id ? "bg-blue-600 text-white shadow-sm" : "bg-white/5 text-gray-500 group-hover/item:text-white group-hover/item:bg-white/10"
                }`}>
                  <ChatBubbleLeftIcon className="w-4 h-4" />
                </div>
                
                {sidebarOpen && (
                  <div className="flex flex-col items-start overflow-hidden flex-1 min-w-0">
                    <span className="truncate w-full text-left font-medium text-[13px] leading-tight">
                      {chat.title || "New Conversation"}
                    </span>
                    <span className="text-[10px] text-gray-500 group-hover/item:text-gray-400 uppercase tracking-wider mt-0.5 font-semibold">
                      {chat.moduleType}
                    </span>
                  </div>
                )}
              </button>

              {sidebarOpen && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === chat.id ? null : chat.id);
                  }}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full 
                    transition-all duration-200 ease-in-out border border-transparent
                    ${activeMenuId === chat.id 
                      ? "opacity-100 bg-white/20 text-white border-white/10" 
                      : "opacity-0 group-hover/item:opacity-100 bg-black/40 text-gray-400 hover:text-white hover:bg-white/20 hover:border-white/10 hover:shadow-lg backdrop-blur-sm"
                    }
                  `}
                >
                  <EllipsisVerticalIcon className="w-5 h-5" />
                </button>
              )}

              {activeMenuId === chat.id && (
                <div ref={menuRef} className="absolute right-0 top-8 w-36 bg-[#1A2332] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-right ring-1 ring-black/50">
                  <button
                    onClick={(e) => handleDeleteChat(e, chat.id)}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Delete Chat
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* BOTTOM SECTION */}
        <div className="p-3 bg-[#0B1120] border-t border-white/5 space-y-2 shrink-0">
          
          {/* Usage Tracker */}
          {sidebarOpen && subscription === "Free" && (
            <div className="px-3 py-3 mb-2 bg-white/5 rounded-xl border border-white/5">
              <div className="flex justify-between text-xs text-gray-300 mb-2">
                <span className="font-bold">Free Plan Usage</span>
                <span className="text-gray-400">{queryCount} / {DAILY_LIMIT}</span>
              </div>
              <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    queryCount >= DAILY_LIMIT ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Export Chat */}
          {conversationId && subscription === "Pro" && (
            <button
              onClick={handleExportPDF}
              className={`flex items-center gap-3 w-full p-2.5 rounded-xl border border-transparent transition-all duration-200 group hover:bg-white/5 hover:border-white/5 ${
                !sidebarOpen ? "justify-center" : ""
              }`}
              title="Export Chat as PDF"
            >
              <ArrowDownTrayIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
              {sidebarOpen && <span className="text-sm font-medium text-gray-300 group-hover:text-blue-100">Export Chat</span>}
            </button>
          )}

          {/* Upgrade */}
          {subscription !== "Pro" && (
            <button
              onClick={() => navigate("/payment")}
              className={`flex items-center gap-3 w-full p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-all group ${
                !sidebarOpen ? "justify-center" : ""
              }`}
              title="Upgrade to Pro"
            >
              <SparklesIcon className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              {sidebarOpen && <span className="text-sm font-bold text-amber-100">Upgrade Plan</span>}
            </button>
          )}

          {/* Profile */}
          <div className={`flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 shadow-sm group hover:bg-white/10 transition-all ${
            !sidebarOpen ? "justify-center" : ""
          }`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-inner shrink-0 text-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : <UserCircleIcon className="w-5 h-5" />}
            </div>
            {sidebarOpen && (
              <div className="flex flex-col overflow-hidden min-w-0">
                <span className="text-xs font-bold text-gray-200 truncate group-hover:text-white transition-colors">
                  {user?.name || "User"}
                </span>
                <span className={`text-[9px] font-bold tracking-widest uppercase mt-0.5 ${
                  subscription === "Pro" ? "text-purple-400" : "text-gray-500"
                }`}>
                  {subscription || "Free"} Plan
                </span>
              </div>
            )}
          </div>

          {/* 🆕 SETTINGS BUTTON (REPLACES LOGOUT) */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className={`flex items-center gap-3 w-full p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all group ${
                !sidebarOpen ? "justify-center" : "pl-3"
              }`}
              title="Settings"
            >
              <Cog6ToothIcon className={`w-5 h-5 transition-transform duration-500 ${showSettingsMenu ? 'rotate-90 text-blue-400' : ''}`} />
              {sidebarOpen && <span className="text-xs font-semibold">Settings</span>}
            </button>

            {/* 🆕 SETTINGS MENU (Popup) */}
            {showSettingsMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-full bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 z-50">
                
                {/* Clear History */}
                <button
                  onClick={() => setConfirmClearAll(true)}
                  className="flex items-center gap-3 w-full px-4 py-3 text-xs font-semibold text-gray-300 hover:bg-white/5 transition-colors border-b border-white/5"
                >
                  <TrashIcon className="w-4 h-4 text-red-400" />
                  Clear All History
                </button>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 text-xs font-semibold text-gray-300 hover:bg-white/5 transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🔴 MODAL: DELETE SINGLE CHAT */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1e293b] border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full transform transition-all scale-100">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-500/10 rounded-full">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-white text-center mb-2">Delete Chat?</h3>
            <p className="text-gray-400 text-sm text-center mb-6 leading-relaxed">
              This conversation will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTargetId(null)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-semibold text-sm transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02]">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 MODAL: CLEAR ALL HISTORY */}
      {confirmClearAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1e293b] border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full transform transition-all scale-100">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-500/10 rounded-full">
                <TrashIcon className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-white text-center mb-2">Clear All History?</h3>
            <p className="text-gray-400 text-sm text-center mb-6 leading-relaxed">
              Are you sure? This will wipe <strong>all</strong> your conversations permanently.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmClearAll(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-semibold text-sm transition-colors">Cancel</button>
              <button onClick={handleClearHistory} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02]">Confirm Clear</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}