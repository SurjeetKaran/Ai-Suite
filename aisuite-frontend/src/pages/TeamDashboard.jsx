
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
  ChartBarSquareIcon,
  CreditCardIcon,
  UserIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import LoadingSpinner from "../components/LoadingSpinner";
import UserUsageDetails from "../components/Admin/UserUsageDetails";
import log from "../utils/logger";

/* =========================
    UI CONSTANTS
========================= */
const METRIC_VARIANTS = {
  subscription: "from-blue-500 to-indigo-600",
  totalMembers: "from-purple-500 to-pink-600",
  freeMembers: "from-emerald-400 to-teal-500",
  proMembers: "from-amber-400 to-orange-500",
};

export default function TeamDashboard() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    subscription: "Free",
    password: "",
  });
  const [editMemberId, setEditMemberId] = useState(null);

  const [message, setMessage] = useState(null);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [showDeleteTeamDialog, setShowDeleteTeamDialog] = useState(false);

  // 🔑 Usage view
  const [selectedUser, setSelectedUser] = useState(null);

  /* =========================
      FETCH DASHBOARD
  ========================= */
  const fetchTeamDashboard = async () => {
    try {
      setLoading(true);
      const res = await API.get("/team/dashboard");
      setTeam(res.data.team || res.data);
    } catch (err) {
      log(
        "ERROR",
        "Failed to fetch team dashboard",
        err?.response?.data || err
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamDashboard();
  }, []);

  /* =========================
      HELPERS
  ========================= */
  const showToast = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  /* =========================
      MEMBER CRUD
  ========================= */
  const saveMember = async () => {
    if (!newMember.name || !newMember.email) {
      showToast("Name and Email are required", "error");
      return;
    }

    if (!editMemberId && !newMember.password) {
      showToast("Password is required for new members", "error");
      return;
    }

    try {
      if (editMemberId) {
        await API.patch(`/team/member/${editMemberId}`, newMember);
        showToast("Member updated successfully");
      } else {
        await API.post("/team/member", newMember);
        showToast("Member added successfully");
      }

      setNewMember({ name: "", email: "", subscription: "Free", password: "" });
      setEditMemberId(null);
      setShowAddForm(false);
      fetchTeamDashboard();
    } catch (err) {
      showToast(err?.response?.data?.msg || "Operation failed", "error");
    }
  };

  const handleEdit = (member) => {
    setNewMember({ ...member, password: "" });
    setEditMemberId(member.id);
    setShowAddForm(true);
  };

  const confirmDeleteMember = async () => {
    try {
      await API.delete(`/team/member/${memberToDelete}`);
      showToast("Member removed");
      fetchTeamDashboard();
    } catch {
      showToast("Failed to remove member", "error");
    } finally {
      setMemberToDelete(null);
    }
  };

  const handleDeleteTeam = async () => {
    try {
      await API.delete("/team/self");
      showToast("Team deleted successfully");
      setTimeout(() => {
        logout();
        navigate("/login");
      }, 1500);
    } catch {
      showToast("Failed to delete team", "error");
    }
  };

  /* =========================
      🔁 USAGE VIEW
  ========================= */
  if (selectedUser) {
    return (
      <UserUsageDetails
        userId={selectedUser.userId}
        userName={selectedUser.name}
        teamMode
        onBack={() => setSelectedUser(null)}
      />
    );
  }

  if (loading || !team) {
    return <LoadingSpinner message="Loading Team Dashboard..." />;
  }

  /* =========================
      UI
  ========================= */
  return (
    <div className="min-h-screen bg-[#0B1120] text-white">
      {/* NAVBAR */}
      <header className="sticky top-0 z-30 h-20 px-6 md:px-10 flex items-center justify-between bg-[#0B1120]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <UserGroupIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Team Portal</h1>
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Admin Dashboard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowDeleteTeamDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold"
          >
            <TrashIcon className="w-4 h-4" />
            Delete Team
          </button>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
          >
            <ArrowLeftOnRectangleIcon className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-10 space-y-8">
        {/* HEADER */}
        <div>
          <h2 className="text-3xl font-bold">{team.teamDetails.name}</h2>
          <p className="text-gray-400 max-w-xl">
            {team.teamDetails.description ||
              "Manage your team members and track usage efficiently."}
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "Plan",
              value: team.teamDetails.subscription,
              icon: <CreditCardIcon />,
              gradient: METRIC_VARIANTS.subscription,
            },
            {
              title: "Members",
              value: team.stats.totalMembers,
              icon: <UserGroupIcon />,
              gradient: METRIC_VARIANTS.totalMembers,
            },
            {
              title: "Free Users",
              value: team.stats.freeMembers,
              icon: <UserIcon />,
              gradient: METRIC_VARIANTS.freeMembers,
            },
            {
              title: "Pro Users",
              value: team.stats.proMembers,
              icon: <ShieldCheckIcon />,
              gradient: METRIC_VARIANTS.proMembers,
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative overflow-hidden p-6 rounded-2xl bg-[#1e293b]/40 border border-white/5 group hover:border-white/10"
            >
              <div
                className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-10 blur-2xl rounded-full -mr-10 -mt-10 group-hover:opacity-20`}
              />
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    {stat.title}
                  </p>
                  <h3 className="text-2xl font-bold">{stat.value}</h3>
                </div>
                <div className="p-2 rounded-lg bg-white/5 text-gray-300 group-hover:text-white">
                  {React.cloneElement(stat.icon, { className: "w-6 h-6" })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* MEMBERS */}
        <div className="bg-[#1e293b]/40 border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h3 className="font-bold text-lg">Team Members</h3>
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setEditMemberId(null);
                setNewMember({
                  name: "",
                  email: "",
                  subscription: "Free",
                  password: "",
                });
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 rounded-xl font-bold"
            >
              {showAddForm ? (
                <XMarkIcon className="w-5 h-5" />
              ) : (
                <UserPlusIcon className="w-5 h-5" />
              )}
              {showAddForm ? "Cancel" : "Add Member"}
            </button>
          </div>

          {/* ADD / EDIT FORM */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b border-white/5 bg-[#0f172a]/50"
              >
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                  <InputGroup
                    placeholder="Name"
                    value={newMember.name}
                    onChange={(e) =>
                      setNewMember({ ...newMember, name: e.target.value })
                    }
                  />
                  <InputGroup
                    placeholder="Email"
                    type="email"
                    value={newMember.email}
                    onChange={(e) =>
                      setNewMember({ ...newMember, email: e.target.value })
                    }
                  />
                  <InputGroup
                    placeholder="Password"
                    type="password"
                    value={newMember.password}
                    onChange={(e) =>
                      setNewMember({ ...newMember, password: e.target.value })
                    }
                  />
                  <select
                    value={newMember.subscription}
                    onChange={(e) =>
                      setNewMember({
                        ...newMember,
                        subscription: e.target.value,
                      })
                    }
                    className="w-full bg-[#0B1120] text-white px-4 py-3 rounded-xl border border-white/10"
                  >
                    <option value="Free">Free</option>
                    <option value="Pro">Pro</option>
                  </select>
                  <button
                    onClick={saveMember}
                    className="h-[46px] bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl"
                  >
                    {editMemberId ? "Update" : "Save"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MEMBER LIST */}
          <div className="divide-y divide-white/5">
            {team.members.map((member) => (
              <div
                key={member.id}
                className="p-4 flex justify-between items-center group hover:bg-white/5"
              >
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-xs text-gray-400">{member.email}</p>
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                  {/* VIEW USAGE */}
                  <button
                    onClick={() => {
                      const realUserId =
                        member.userId ||
                        member.user?._id ||
                        member.user ||
                        null;

                      if (!realUserId) {
                        showToast(
                          "Usage not available for this member",
                          "error"
                        );
                        return;
                      }

                      setSelectedUser({
                        userId: realUserId,
                        name: member.name,
                      });
                    }}
                    className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-gray-300"
                  >
                    <ChartBarSquareIcon className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => handleEdit(member)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-blue-500/20 text-blue-400"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setMemberToDelete(member.id)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-red-400"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* DELETE TEAM */}
      {showDeleteTeamDialog && (
        <ConfirmDialog
          title="Delete Team?"
          description="This action is permanent."
          onCancel={() => setShowDeleteTeamDialog(false)}
          onConfirm={handleDeleteTeam}
        />
      )}

      {/* DELETE MEMBER */}
      {memberToDelete && (
        <ConfirmDialog
          title="Remove Member?"
          description="Are you sure you want to remove this member?"
          onCancel={() => setMemberToDelete(null)}
          onConfirm={confirmDeleteMember}
        />
      )}

      {/* TOAST */}
      {message && (
        <div
          className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl font-bold ${
            message.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}

/* =========================
    SMALL COMPONENTS
========================= */

const InputGroup = (props) => (
  <input
    {...props}
    className="w-full bg-[#0B1120] text-white px-4 py-3 rounded-xl border border-white/10 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
  />
);

const ConfirmDialog = ({ title, description, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
    <div className="bg-[#1e293b] p-6 rounded-2xl space-y-4 text-center max-w-sm w-full">
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2 bg-white/10 rounded">
          Cancel
        </button>
        <button onClick={onConfirm} className="flex-1 py-2 bg-red-600 rounded">
          Confirm
        </button>
      </div>
    </div>
  </div>
);
