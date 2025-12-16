
import React, { useEffect, useState, useRef } from "react";
import { useChatStore } from "../store/chatStore";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import API from "../api/axios";
import log from "../utils/logger";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  ChatBubbleLeftIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
  UserCircleIcon,
  ArrowDownTrayIcon,
  EllipsisVerticalIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

/* ---------------- ORIGINAL WIDTHS (UNCHANGED) ---------------- */
const DESKTOP_EXPANDED = "w-64";
const DESKTOP_COLLAPSED = "w-20";
const MOBILE_EXPANDED = "w-64";
const MOBILE_COLLAPSED = "w-14";

const DAILY_LIMIT = 3;

export default function Sidebar() {
  /* ---------------- MOBILE ---------------- */
  const isMobile = window.innerWidth < 768;

  /* ---------------- STORES ---------------- */
  const {
    sidebarOpen,
    toggleSidebar,
    history,
    fetchHistory,
    loadChat,
    startNewChat,
    conversationId,
    messages,
    deleteConversation, // ✅ correct store action
  } = useChatStore();

  const { logout, subscription, user } = useAuthStore();
  const navigate = useNavigate();

  /* ---------------- UI STATE ---------------- */
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);

  const menuRef = useRef(null);
  const settingsRef = useRef(null);

  /* ---------------- LOAD HISTORY ---------------- */
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  /* ---------------- CLICK OUTSIDE ---------------- */
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setShowSettingsMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ---------------- ACTIONS ---------------- */



  const handleDeleteChat = (e, id) => {
    e.stopPropagation();
    setActiveMenuId(null);
    setDeleteTargetId(id);
  };

  /**
   * ✅ FIX
   * - Remove chat immediately from UI
   * - No waiting for fetchHistory
   */
  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    const id = deleteTargetId;
    setDeleteTargetId(null); // close modal instantly

    log("WARN", "Deleting chat", id);
    await deleteConversation(id);
  };

  const handleLogout = () => {
  logout();        // authStore handles cleanup
  navigate("/login");
};


 const handleClearHistory = async () => {
  await useChatStore.getState().clearAllHistory();
  setConfirmClearAll(false);
  setShowSettingsMenu(false);
};


const handleDeleteAccount = async () => {
  try {
    await API.delete("/auth/delete-me");
    logout();              // handles all cleanup
    navigate("/login");
  } catch (err) {
    log("ERROR", "Delete account failed", err);
  }
};


  /* ---------------- EXPORT PDF ---------------- */
  const handleExportPDF = (e) => {
    e.stopPropagation();
    if (!messages.length) return;

    const doc = new jsPDF();
    let y = 10;

    const add = (text, bold = false) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.text(text, 10, y);
      y += 7;
    };

    add("AiSuite Chat Export", true);
    add(new Date().toLocaleString());
    y += 4;

    messages.forEach((msg) => {
      if (msg.role === "user") {
        add(`User: ${msg.content}`, true);
      }
      if (msg.role === "assistant" && msg.individualOutputs) {
        Object.entries(msg.individualOutputs).forEach(([model, out]) => {
          add(`[${model}]`, true);
          add(typeof out === "string" ? out : out?.text || "");
        });
      }
      y += 4;
    });

    doc.save("AiSuite_Chat.pdf");
  };

  /* ---------------- USAGE ---------------- */
  const queryCount = user?.dailyQueryCount || 0;
  const progressPercent = Math.min((queryCount / DAILY_LIMIT) * 100, 100);

  /* ---------------- RENDER ---------------- */
  return (
    <>
      {/* SIDEBAR */}
      <div
        className={`flex flex-col h-screen bg-[#0B1120] backdrop-blur-2xl
        border-r border-white/5 text-gray-300 transition-all duration-300
        ${isMobile && sidebarOpen ? "fixed top-0 left-0 z-40" : "relative"}
        ${
          isMobile
            ? sidebarOpen
              ? MOBILE_EXPANDED
              : MOBILE_COLLAPSED
            : sidebarOpen
            ? DESKTOP_EXPANDED
            : DESKTOP_COLLAPSED
        }`}
      >
        {/* TOP HEADER */}
        <div className="p-4 flex items-center justify-between shrink-0">
          {sidebarOpen && (
            <div className="flex items-center gap-2 font-bold text-white">
              <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                AiSuite
              </span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
          >
            {sidebarOpen ? (
              <ChevronLeftIcon className="w-5 h-5" />
            ) : (
              <ChevronRightIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* NEW CHAT */}
        <div className="px-3 mb-6 shrink-0">
          <button
            onClick={startNewChat}
            className={`flex items-center gap-3 w-full p-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all ${
              !sidebarOpen ? "justify-center" : ""
            }`}
          >
            <PlusIcon className="w-5 h-5" />
            {sidebarOpen && <span className="font-semibold">New Chat</span>}
          </button>
        </div>

        {/* HISTORY LIST */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden thin-scrollbar px-3 space-y-1 pb-4">
          {sidebarOpen && (
            <div className="text-[10px] font-bold text-gray-500 mb-3 px-2 uppercase tracking-widest">
              Recent Chats
            </div>
          )}

          {history.map((chat) => {
            const id = chat._id || chat.id;

            return (
              <div key={id} className="relative group/item">
                <button
                  onClick={() => loadChat(id)}
                  className={`flex items-center gap-3 w-full p-2.5 rounded-xl text-sm transition-all border border-transparent
                  ${
                    conversationId === id
                      ? "bg-white/10 text-white border-white/5 shadow-md pr-8"
                      : "hover:bg-white/5 text-gray-400 hover:text-white"
                  } ${!sidebarOpen ? "justify-center" : ""}`}
                >
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${
                      conversationId === id
                        ? "bg-blue-600 text-white"
                        : "bg-white/5 text-gray-500 group-hover/item:text-white"
                    }`}
                  >
                    <ChatBubbleLeftIcon className="w-4 h-4" />
                  </div>

                  {sidebarOpen && (
                  <div className="flex flex-col items-start overflow-hidden flex-1 min-w-0 text-left">
  <span className="truncate w-full text-[13px] font-medium leading-tight">
    {chat.title || "New Conversation"}
  </span>
  <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5 font-semibold">
    {chat.moduleType}
  </span>
</div>

                  )}
                </button>

                {/* ELLIPSIS */}
                {sidebarOpen && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === id ? null : id);
                    }}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full
                    ${
                      activeMenuId === id
                        ? "opacity-100 bg-white/20"
                        : "opacity-0 group-hover/item:opacity-100 bg-black/40 hover:bg-white/20"
                    }`}
                  >
                    <EllipsisVerticalIcon className="w-5 h-5" />
                  </button>
                )}

                {activeMenuId === id && (
                  <div
                    ref={menuRef}
                    className="absolute right-0 top-8 w-36 bg-[#1A2332] border border-white/10 rounded-xl shadow-2xl z-50"
                  >
                    <button
                      onClick={(e) => handleDeleteChat(e, id)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/10"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Delete Chat
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* BOTTOM */}
        <div className="p-3 border-t border-white/5 space-y-2 shrink-0">
        {/* Export Chat (Pro only, active chat required) */}
{conversationId && subscription === "Pro" && (
  <button
    onClick={handleExportPDF}
    className={`flex items-center gap-3 w-full p-2.5 rounded-xl border border-transparent transition-all duration-200 group hover:bg-white/5 hover:border-white/5 ${
      !sidebarOpen ? "justify-center" : ""
    }`}
    title="Export Chat as PDF"
  >
    <ArrowDownTrayIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
    {sidebarOpen && (
      <span className="text-sm font-medium text-gray-300 group-hover:text-blue-100">
        Export Chat
      </span>
    )}
  </button>
)}

{/* ================= FREE PLAN USAGE ================= */}
{subscription === "Free" && (
  <div
    className={`px-3 py-3 mb-1 bg-white/5 rounded-xl border border-white/5 ${
      !sidebarOpen ? "px-2" : ""
    }`}
  >
    {/* TEXT — ONLY WHEN SIDEBAR OPEN */}
    {sidebarOpen && (
      <div className="flex justify-between text-xs text-gray-300 mb-2">
        <span className="font-bold">Free Plan Usage</span>
        <span className="text-gray-400">
          {queryCount} / {DAILY_LIMIT}
        </span>
      </div>
    )}

    {/* PROGRESS BAR — ALWAYS */}
    <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          queryCount >= DAILY_LIMIT
            ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
            : "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
        }`}
        style={{ width: `${progressPercent}%` }}
      />
    </div>
  </div>
)}



{/* ================= UPGRADE PLAN (FREE USERS ONLY) ================= */}
{subscription === "Free" && (
  <button
    onClick={() => navigate("/payment")}
    className={`flex items-center gap-3 w-full p-2.5 rounded-xl
      border border-amber-500/30
      bg-amber-500/5
      hover:bg-amber-500/10
      transition-all duration-200
      group
      ${!sidebarOpen ? "justify-center" : ""}
    `}
    title="Upgrade to Pro"
  >
    <SparklesIcon className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
    {sidebarOpen && (
      <span className="text-sm font-bold text-amber-100">
        Upgrade Plan
      </span>
    )}
  </button>
)}


          {/* PROFILE */}
          <div
            className={`flex items-center gap-3 p-2.5 rounded-xl bg-white/5 ${
              !sidebarOpen ? "justify-center" : ""
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {user?.name ? user.name[0].toUpperCase() : <UserCircleIcon />}
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-200">
                  {user?.name || "User"}
                </span>
                <span className="text-[9px] text-gray-500 uppercase">
                  {subscription || "Free"} Plan
                </span>
              </div>
            )}
          </div>

          {/* SETTINGS */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setShowSettingsMenu(v => !v)}
              className={`flex items-center gap-3 w-full p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 ${
                !sidebarOpen ? "justify-center" : ""
              }`}
            >
              <Cog6ToothIcon className="w-5 h-5" />
              {sidebarOpen && "Settings"}
            </button>

          {showSettingsMenu && (
  <div className="absolute bottom-full mb-2 w-full bg-[#1e293b] border border-white/10 rounded-xl overflow-hidden">

    {/* Clear All History */}
    <button
      onClick={() => {
        setShowSettingsMenu(false);
        setConfirmClearAll(true);
      }}
      className="flex items-center gap-3 w-full px-4 py-3 text-xs font-semibold text-gray-300 hover:bg-white/5 border-b border-white/5"
    >
      <TrashIcon className="w-4 h-4 text-red-400" />
      Clear All History
    </button>

    {/* Delete Account */}
    <button
      onClick={() => {
        setShowSettingsMenu(false);
        setConfirmDeleteAccount(true);
      }}
      className="flex items-center gap-3 w-full px-4 py-3 text-xs font-semibold text-red-400 hover:bg-red-500/10 border-b border-white/5"
    >
      <ExclamationTriangleIcon className="w-4 h-4" />
      Delete Account
    </button>

    {/* Logout */}
    <button
      onClick={handleLogout}
      className="flex items-center gap-3 w-full px-4 py-3 text-xs font-semibold hover:bg-white/5"
    >
      <ArrowRightOnRectangleIcon className="w-4 h-4" />
      Log out
    </button>
  </div>
)}

          </div>
        </div>
      </div>

      {/* MOBILE OVERLAY */}
      {isMobile && sidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-md"
        />
      )}

      {confirmClearAll && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className="bg-[#1e293b] border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full">
      <h3 className="text-lg font-bold text-white mb-4 text-center">
        Clear All History?
      </h3>
      <p className="text-gray-400 text-sm text-center mb-6">
        This will permanently delete all conversations.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => setConfirmClearAll(false)}
          className="flex-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          onClick={handleClearHistory}
          className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
)}

{confirmDeleteAccount && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className="bg-[#1e293b] border border-red-500/20 p-6 rounded-2xl shadow-2xl max-w-sm w-full">
      <h3 className="text-lg font-bold text-white mb-4 text-center">
        Delete Account?
      </h3>
      <p className="text-gray-400 text-sm text-center mb-6">
        This action cannot be undone.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => setConfirmDeleteAccount(false)}
          className="flex-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          onClick={handleDeleteAccount}
          className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}



      {/* DELETE CHAT MODAL */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1e293b] border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-500/10 rounded-full">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-white text-center mb-2">
              Delete Chat?
            </h3>
            <p className="text-gray-400 text-sm text-center mb-6">
              This conversation will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
