// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/Admin/AdminSidebar";
import LoadingSpinner from "../components/LoadingSpinner";

// Admin Sections
import HomeSection from "../components/Admin/HomeSection";
import UserManagement from "../components/Admin/UserManagement";
import TeamManagement from "../components/Admin/TeamManagement";
import PlanManagement from "../components/Admin/PlanManagement";
import ApiKeyManagement from "../components/Admin/ApiKeyManagement";
import LoadBalancerConfig from "../components/Admin/LoadBalancerConfig";
import SystemConfig from "../components/Admin/SystemConfig";
import UserUsageDetails from "../components/Admin/UserUsageDetails";

// Store
import { useAdminDashboardStore } from "../store/adminDashboardStore";

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ⬅ dynamic tab system
  const [activeTab, setActiveTab] = useState("Home");

  // ⬅ required new states for Usage Page
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserName, setSelectedUserName] = useState("");
  const [previousTab, setPreviousTab] = useState("Home");
  const [teamMode, setTeamMode] = useState(false);

  // Store
  const { dashboardData, loading, fetchDashboard } = useAdminDashboardStore();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ⬅ main function to open full-page usage
  const openUserUsage = ({ userId, userName, fromTab, team }) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setTeamMode(team || false);
    setPreviousTab(fromTab);
    setActiveTab(`Usage – ${userName}`);
  };

  const handleBackFromUsage = () => {
    setActiveTab(previousTab);
    setSelectedUserId(null);
    setSelectedUserName("");
    setTeamMode(false);
  };

  if (loading || !dashboardData)
    return <LoadingSpinner message="Loading Admin Dashboard..." />;

  const renderContent = () => {
    // ⭐ NEW: dynamic tab matching  
    if (activeTab.startsWith("Usage –") && selectedUserId) {
      return (
        <UserUsageDetails
          userId={selectedUserId}
          userName={selectedUserName}
          teamMode={teamMode}
          onBack={handleBackFromUsage}
        />
      );
    }

    switch (activeTab) {
      case "Home":
        return <HomeSection />;
      case "User Management":
        return (
          <UserManagement
            openUserUsage={(id, name) =>
              openUserUsage({
                userId: id,
                userName: name,
                fromTab: "User Management",
                team: false,
              })
            }
          />
        );
      case "Team Management":
        return (
          <TeamManagement
            openUserUsage={(id, name) =>
              openUserUsage({
                userId: id,
                userName: name,
                fromTab: "Team Management",
                team: true,
              })
            }
          />
        );
      case "Plan Management":
        return <PlanManagement />;
      case "API Keys":
        return <ApiKeyManagement />;
      case "Load Balancer":
        return <LoadBalancerConfig />;
      case "System Config":
        return <SystemConfig />;

      default:
        return <HomeSection />;
    }
  };

  return (
    <div className="flex h-screen bg-[#0B1120] text-white overflow-hidden font-sans">
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1 flex flex-col h-full relative min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto thin-scrollbar p-8">
          {/* Header (dynamic) */}
          {!activeTab.startsWith("Usage –") && (
            <div className="mb-10">
              <h1 className="text-3xl font-bold">{activeTab}</h1>
              <p className="text-gray-400 text-sm">
                Overview and management for your AI Suite.
              </p>
            </div>
          )}

          {renderContent()}
        </div>
      </main>
    </div>
  );
}
