// // src/pages/AdminDashboard.jsx


import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/Admin/AdminSidebar";
import LoadingSpinner from "../components/LoadingSpinner";

// Import Admin Sections
import HomeSection from "../components/Admin/HomeSection";
import UserManagement from "../components/Admin/UserManagement";
import TeamManagement from "../components/Admin/TeamManagement";
import PlanManagement from "../components/Admin/PlanManagement";

// Store
import { useAdminDashboardStore } from "../store/adminDashboardStore";

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("Home");

  const { dashboardData, loading, fetchDashboard } = useAdminDashboardStore();

  // Fetch data once on mount
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Show Premium Loader
  if (loading || !dashboardData) return <LoadingSpinner message="Loading Admin Dashboard..." />;

  // Render the correct component based on the active tab
  const renderContent = () => {
    switch (activeTab) {
      case "Home":
        return <HomeSection />;
      case "User Management":
        return <UserManagement />;
      case "Team Management":
        return <TeamManagement />;
      case "Plan Management":
        return <PlanManagement />;
      default:
        return <HomeSection />;
    }
  };

  return (
    <div className="flex h-screen bg-[#0B1120] text-white overflow-hidden font-sans">
      
      {/* 1. Admin Sidebar (Navigation) */}
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen((prev) => !prev)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* 2. Main Content Area */}
      {/* Removed AdminNavbar. The content now takes the full height. */}
      <main className="flex-1 flex flex-col h-full relative min-w-0 overflow-hidden bg-gradient-to-br from-[#0B1120] to-[#1a1f2e]">
        
        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto thin-scrollbar p-8">
          
          {/* Internal Header (Replaces Navbar) */}
          <div className="mb-10 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {activeTab}
            </h1>
            <p className="text-gray-400 text-sm font-medium">
              Overview and management for your AI-Suite platform.
            </p>
            <div className="h-1 w-20 bg-blue-600 rounded-full mt-2"></div>
          </div>

          {/* Dynamic Section Content */}
          <div className="animate-in fade-in zoom-in-95 duration-500">
            {renderContent()}
          </div>

        </div>
      </main>

    </div>
  );
}
