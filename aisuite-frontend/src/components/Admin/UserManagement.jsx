

import React, { useEffect, useState } from "react";
import { useAdminDashboardStore } from "../../store/adminDashboardStore";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../api/axios";

import {
  UserCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";

export default function UserManagement() {
  const { dashboardData, fetchDashboard } = useAdminDashboardStore();
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [editModeUserId, setEditModeUserId] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState("");
  const [message, setMessage] = useState(null);

  // useEffect(() => {
  //   fetchDashboard();
  // }, [fetchDashboard]);

  if (!dashboardData) return <div className="p-8 text-gray-500 text-center animate-pulse">Loading Users...</div>;

  const handleEditClick = (e, user) => {
    e.stopPropagation();
    setEditModeUserId(user._id);
    setSelectedSubscription(user.subscription);
  };

  const handleSaveClick = async (e, user) => {
    e.stopPropagation();
    if (!selectedSubscription) return;

    try {
      await API.patch(`admin/user/${user._id}`, { subscription: selectedSubscription });
      setEditModeUserId(null);
      fetchDashboard(); 
      showMessage("User subscription updated", "success");
    } catch (err) {
      console.error(err);
      showMessage("Update failed", "error");
    }
  };

  const showMessage = (msg, type) => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-[#1e293b]/50 p-4 rounded-2xl border border-white/5 backdrop-blur-xl">
        <h2 className="text-xl font-bold text-white">User Management</h2>
        <p className="text-sm text-gray-400">View and manage user accounts.</p>
      </div>

      <div className="space-y-2">
        {dashboardData.usersList.map((user) => {
          const isExpanded = expandedUserId === user._id;
          const isEditing = editModeUserId === user._id;
          const avatarChar = user.name?.charAt(0).toUpperCase() || "U";

          return (
            <motion.div
              key={user._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-[#1e293b]/40 border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-colors ${isExpanded ? 'bg-[#1e293b]/60 border-blue-500/20' : ''}`}
            >
              {/* Row Header */}
              <div 
                onClick={() => setExpandedUserId(isExpanded ? null : user._id)}
                className="flex items-center justify-between p-4 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                    {avatarChar}
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{user.name || "Unknown User"}</h3>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                    user.subscription === "Pro" 
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  }`}>
                    {user.subscription}
                  </span>
                  {isExpanded ? <ChevronUpIcon className="w-5 h-5 text-gray-500" /> : <ChevronDownIcon className="w-5 h-5 text-gray-500" />}
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden border-t border-white/5 bg-[#0f172a]/30"
                  >
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                      
                      {/* Edit Actions */}
                      <div className="absolute top-4 right-4">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <button onClick={(e) => { e.stopPropagation(); setEditModeUserId(null); }} className="p-2 bg-gray-700 rounded-lg text-gray-300 hover:text-white"><XMarkIcon className="w-4 h-4" /></button>
                            <button onClick={(e) => handleSaveClick(e, user)} className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500"><CheckIcon className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <button onClick={(e) => handleEditClick(e, user)} className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10">
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* 🟢 DETAILS (Email & ID Removed) */}
                      <DetailItem label="Full Name" value={user.name} />
                      <DetailItem label="Joined" value={new Date(user.createdAt).toLocaleDateString()} />
                      <DetailItem label="Usage" value={`${user.dailyQueryCount} queries today`} />
                      
                      {/* Editable Subscription */}
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Subscription</label>
                        {isEditing ? (
                          <div className="flex gap-2 mt-1">
                            {['Free', 'Pro'].map(plan => (
                              <button
                                key={plan}
                                onClick={(e) => { e.stopPropagation(); setSelectedSubscription(plan); }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                                  selectedSubscription === plan 
                                    ? "bg-blue-600 text-white border-blue-500" 
                                    : "bg-transparent text-gray-400 border-gray-700 hover:border-gray-500"
                                }`}
                              >
                                {plan}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-sm">{user.subscription} Plan</span>
                        )}
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {message && (
        <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${message.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}

const DetailItem = ({ label, value }) => (
  <div>
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">{label}</label>
    <p className="text-gray-300 text-sm font-medium">{value}</p>
  </div>
);