
// src/components/Admin/AdminSidebar.jsx
import React from "react";
import { useAuthStore } from "../../store/authStore";
import log from "../../utils/logger";
import { useNavigate } from "react-router-dom";

import {
  HomeIcon,
  UsersIcon,
  UserGroupIcon,
  TagIcon,
  KeyIcon,
  Cog6ToothIcon,
  AdjustmentsHorizontalIcon,
  ArrowLeftOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const expandedWidth = "w-64";
const collapsedWidth = "w-20";

export default function AdminSidebar({
  sidebarOpen,
  toggleSidebar,
  activeTab,
  setActiveTab,
}) {
  const logout = useAuthStore((state) => state.logout);
  const role = useAuthStore((state) => state.role);
  const isOwner = role === 'admin';
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    localStorage.clear();
    navigate("/login");
  };

  const menuItems = [
    { name: "Home", icon: <HomeIcon className="w-5 h-5" /> },
    { name: "User Management", icon: <UsersIcon className="w-5 h-5" /> },
    { name: "Team Management", icon: <UserGroupIcon className="w-5 h-5" /> },
    { name: "Plan Management", icon: <TagIcon className="w-5 h-5" /> },

    // 🆕 New Tabs
    // Owner-only tabs — only show when logged-in role is `admin` (system owner)
    ...(isOwner
      ? [
          { name: "API Keys", icon: <KeyIcon className="w-5 h-5" /> },
          { name: "Load Balancer", icon: <AdjustmentsHorizontalIcon className="w-5 h-5" /> },
          { name: "System Config", icon: <Cog6ToothIcon className="w-5 h-5" /> },
        ]
      : []),
  ];

  return (
    <div
      className={`flex flex-col h-screen bg-[#0B1120] border-r border-white/10 text-gray-300 transition-all duration-300 relative ${
        sidebarOpen ? expandedWidth : collapsedWidth
      }`}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
        {sidebarOpen && (
          <div className="flex items-center gap-2 text-white font-bold">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
              <SparklesIcon className="w-5 h-5" />
            </div>
            <span className="text-lg">Admin</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
        >
          {sidebarOpen ? <ChevronLeftIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
        </button>
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = activeTab === item.name;
          return (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`group flex items-center gap-3 w-full p-3 rounded-xl text-sm transition-all ${
                isActive
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-blue-500/20"
                  : "hover:bg-white/5 text-gray-400 hover:text-gray-100"
              } ${!sidebarOpen ? "justify-center" : ""}`}
              title={!sidebarOpen ? item.name : ""}
            >
              <div>{item.icon}</div>
              {sidebarOpen && <span>{item.name}</span>}
              {isActive && sidebarOpen && <div className="absolute left-0 w-1 h-8 bg-blue-500 rounded-r-full" />}
            </button>
          );
        })}
      </div>

      {/* Logout */}
      <div className="p-3 border-t border-white/5 bg-black/20">
        <button
          onClick={handleLogout}
          className={`group flex items-center gap-3 w-full p-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 ${
            !sidebarOpen ? "justify-center" : ""
          }`}
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5 group-hover:-translate-x-1" />
          {sidebarOpen && <span>Log out</span>}
        </button>
      </div>
    </div>
  );
}
