

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuthStore } from "../store/authStore";
import { motion, AnimatePresence } from "framer-motion";

// Icons
import {
  UserGroupIcon,
  UserPlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowLeftOnRectangleIcon,
  CheckIcon,
  XMarkIcon,
  SparklesIcon,
  CreditCardIcon,
  UserIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

import LoadingSpinner from "../components/LoadingSpinner";

const METRIC_VARIANTS = {
  subscription: "from-blue-500 to-indigo-600",
  totalMembers: "from-purple-500 to-pink-600",
  freeMembers:  "from-emerald-400 to-teal-500",
  proMembers:   "from-amber-400 to-orange-500",
};

export default function TeamDashboard() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", email: "", subscription: "Free", password: "" });
  const [editMemberId, setEditMemberId] = useState(null);
  const [message, setMessage] = useState(null);
  
  // Dialog States
  const [showDeleteTeamDialog, setShowDeleteTeamDialog] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null); 

  const fetchTeamDashboard = async () => {
    try {
      setLoading(true);
      const res = await API.get("/team/dashboard");
      setTeam(res.data.team || res.data);
    } catch (err) {
      console.error("Failed to fetch team dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamDashboard();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const showToast = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  // 🟢 UPDATED SAVE LOGIC: Smart Validation
  const saveMember = async () => {
    // 1. Name and Email are ALWAYS required
    if (!newMember.name || !newMember.email) {
      showToast("Name and Email are required", "error");
      return;
    }

    // 2. Password is required ONLY for NEW members (not for updates)
    if (!editMemberId && !newMember.password) {
      showToast("Password is required for new members", "error");
      return;
    }

    try {
      if (editMemberId) {
        // Edit Mode: If password is "", backend ignores it (keeps old one)
        await API.patch(`/team/member/${editMemberId}`, newMember);
        showToast("Member updated successfully");
      } else {
        // Add Mode
        await API.post("/team/member", newMember);
        showToast("Member added successfully");
      }
      
      setNewMember({ name: "", email: "", subscription: "Free", password: "" });
      setEditMemberId(null);
      setShowAddForm(false);
      fetchTeamDashboard();
    } catch (err) {
      showToast(err.response?.data?.msg || "Operation failed", "error");
    }
  };

  const handleEdit = (member) => {
    setNewMember({ ...member, password: "" }); // Keep password blank to indicate "no change"
    setEditMemberId(member.id);
    setShowAddForm(true);
  };

  const promptDeleteMember = (memberId) => {
    setMemberToDelete(memberId);
  };

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;
    try {
      await API.delete(`/team/member/${memberToDelete}`);
      showToast("Member removed", "success");
      fetchTeamDashboard();
    } catch (err) {
      showToast("Failed to remove member", "error");
    } finally {
      setMemberToDelete(null); 
    }
  };

  const handleDeleteTeam = async () => {
    try {
      await API.delete(`/team/self`);
      showToast("Team deleted successfully", "success");
      setTimeout(() => {
        logout();
        navigate("/login");
      }, 2000);
    } catch (err) {
      showToast("Failed to delete team", "error");
      setShowDeleteTeamDialog(false);
    }
  };

  if (loading || !team) return <LoadingSpinner message="Loading Team Dashboard..." />;

  return (
    <div className="min-h-screen bg-[#0B1120] text-white font-sans selection:bg-blue-500/30">
      
      {/* NAVBAR */}
      <header className="sticky top-0 z-30 h-20 px-6 md:px-10 flex items-center justify-between bg-[#0B1120]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <UserGroupIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Team Portal</h1>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Admin Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowDeleteTeamDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold transition-all hover:scale-105"
          >
            <TrashIcon className="w-4 h-4" />
            <span>Delete Team</span>
          </button>

          <div className="h-6 w-px bg-white/10 mx-1"></div>

          <button 
            onClick={handleLogout}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            title="Logout"
          >
            <ArrowLeftOnRectangleIcon className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-10 space-y-8">
        
        {/* HEADER SECTION */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">{team.teamDetails.name}</h2>
          <p className="text-gray-400 max-w-xl">{team.teamDetails.description || "Manage your team members, track usage, and control subscriptions efficiently."}</p>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Plan", value: team.teamDetails.subscription, icon: <CreditCardIcon />, gradient: METRIC_VARIANTS.subscription },
            { title: "Members", value: team.stats.totalMembers, icon: <UserGroupIcon />, gradient: METRIC_VARIANTS.totalMembers },
            { title: "Free Users", value: team.stats.freeMembers, icon: <UserIcon />, gradient: METRIC_VARIANTS.freeMembers },
            { title: "Pro Users", value: team.stats.proMembers, icon: <ShieldCheckIcon />, gradient: METRIC_VARIANTS.proMembers },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative overflow-hidden p-6 rounded-2xl bg-[#1e293b]/40 border border-white/5 group hover:border-white/10 transition-all"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-10 blur-2xl rounded-full -mr-10 -mt-10 transition-opacity group-hover:opacity-20`}></div>
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                </div>
                <div className={`p-2 rounded-lg bg-white/5 text-gray-300 group-hover:text-white transition-colors`}>
                  {React.cloneElement(stat.icon, { className: "w-6 h-6" })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* MEMBERS MANAGEMENT */}
        <div className="bg-[#1e293b]/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
          <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Team Members</h3>
              <p className="text-sm text-gray-400">Manage access and roles.</p>
            </div>
            <button
              onClick={() => { setNewMember({ name: "", email: "", subscription: "Free", password: "" }); setEditMemberId(null); setShowAddForm(!showAddForm); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
            >
              {showAddForm ? <XMarkIcon className="w-5 h-5" /> : <UserPlusIcon className="w-5 h-5" />}
              {showAddForm ? "Cancel" : "Add Member"}
            </button>
          </div>

          {/* Add/Edit Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b border-white/5 bg-[#0f172a]/50"
              >
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                  <InputGroup placeholder="Name" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} />
                  <InputGroup placeholder="Email" type="email" value={newMember.email} onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} />
                  <InputGroup placeholder="Password" type="password" value={newMember.password} onChange={(e) => setNewMember({ ...newMember, password: e.target.value })} />
                  <div className="relative">
                    <select
                      value={newMember.subscription}
                      onChange={(e) => setNewMember({ ...newMember, subscription: e.target.value })}
                      className="w-full bg-[#0B1120] text-white px-4 py-3 rounded-xl border border-white/10 outline-none appearance-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                    >
                      <option value="Free">Free</option>
                      <option value="Pro">Pro</option>
                    </select>
                  </div>
                  <button onClick={saveMember} className="h-[46px] bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/20">
                    {editMemberId ? "Update" : "Save"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Members List */}
          <div className="divide-y divide-white/5">
            {team.members.length === 0 ? (
              <div className="p-8 text-center text-gray-500 italic">No members found. Add someone to get started.</div>
            ) : (
              team.members.map((member) => (
                <div key={member.id} className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner bg-gradient-to-br ${
                      member.subscription === "Pro" ? "from-blue-500 to-indigo-600" : "from-emerald-500 to-teal-600"
                    }`}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{member.name}</h4>
                      <p className="text-xs text-gray-400">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex flex-col items-end">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${
                        member.subscription === "Pro" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}>
                        {member.subscription}
                      </span>
                      <span className="text-[10px] text-gray-500 mt-1">{member.totalQueries || 0} Queries</span>
                    </div>
                    
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(member)} className="p-2 rounded-lg bg-white/5 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 transition-colors">
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => promptDeleteMember(member.id)} className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Delete TEAM Dialog */}
      {showDeleteTeamDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1e293b] border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center">
            <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
              <TrashIcon className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Delete Team?</h3>
            <p className="text-sm text-gray-400 mb-6">This action is permanent and will delete all team data and member accounts.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteTeamDialog(false)} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 font-semibold text-sm transition-colors">Cancel</button>
              <button onClick={handleDeleteTeam} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl text-white font-semibold text-sm transition-colors shadow-lg shadow-red-500/20">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 DELETE MEMBER DIALOG */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1e293b] border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center">
            <div className="mx-auto w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
              <UserIcon className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Remove Member?</h3>
            <p className="text-sm text-gray-400 mb-6">Are you sure you want to remove this member from the team?</p>
            <div className="flex gap-3">
              <button onClick={() => setMemberToDelete(null)} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 font-semibold text-sm transition-colors">Cancel</button>
              <button onClick={confirmDeleteMember} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl text-white font-semibold text-sm transition-colors shadow-lg shadow-red-500/20">Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {message && (
        <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm animate-in slide-in-from-bottom-5 ${message.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}

const InputGroup = (props) => (
  <input 
    {...props} 
    className="w-full bg-[#0B1120] text-white px-4 py-3 rounded-xl border border-white/10 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-600 text-sm"
  />
);