// // src/components/Admin/AdminSidebar.jsx

import React from "react";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";

// Icons (Using Heroicons for consistency with User Dashboard)
import {
  HomeIcon,
  UsersIcon,
  UserGroupIcon,
  TagIcon,
  ArrowLeftOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon
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
  ];

  return (
    <div
      className={`flex flex-col h-screen bg-[#0B1120] border-r border-white/10 text-gray-300 transition-all duration-300 relative ${
        sidebarOpen ? expandedWidth : collapsedWidth
      }`}
    >
      {/* ---------------- HEADER ---------------- */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/5 shrink-0">
        {sidebarOpen && (
          <div className="flex items-center gap-2 font-bold text-white tracking-wide animate-in fade-in duration-300">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Admin
            </span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
        >
          {sidebarOpen ? (
            <ChevronLeftIcon className="w-5 h-5" />
          ) : (
            <ChevronRightIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* ---------------- MENU ITEMS ---------------- */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = activeTab === item.name;
          return (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`group flex items-center gap-3 w-full p-3 rounded-xl text-sm font-medium transition-all duration-200 border border-transparent ${
                isActive
                  ? "bg-blue-600/10 text-blue-400 border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.1)]"
                  : "hover:bg-white/5 text-gray-400 hover:text-gray-100"
              } ${!sidebarOpen ? "justify-center" : ""}`}
              title={!sidebarOpen ? item.name : ""}
            >
              <div
                className={`transition-colors ${
                  isActive ? "text-blue-400" : "text-gray-500 group-hover:text-gray-300"
                }`}
              >
                {item.icon}
              </div>

              {sidebarOpen && (
                <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                  {item.name}
                </span>
              )}

              {/* Active Indicator Bar (Left) */}
              {isActive && sidebarOpen && (
                <div className="absolute left-0 w-1 h-8 bg-blue-500 rounded-r-full blur-[1px]" />
              )}
            </button>
          );
        })}
      </div>

      {/* ---------------- BOTTOM SECTION ---------------- */}
      <div className="p-3 border-t border-white/5 bg-black/20 shrink-0">
        <button
          onClick={handleLogout}
          className={`group flex items-center gap-3 w-full p-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 ${
            !sidebarOpen ? "justify-center" : ""
          }`}
          title="Logout"
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          {sidebarOpen && <span className="text-sm font-medium">Log out</span>}
        </button>
      </div>
    </div>
  );
}
