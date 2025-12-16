// import React, { useState } from "react";
// import API from "../../api/axios";
// import { useAdminDashboardStore } from "../../store/adminDashboardStore"; // 🆕 Import Store
// import { motion, AnimatePresence } from "framer-motion";

// // Icons
// import {
//   UserGroupIcon,
//   ChevronDownIcon,
//   UserIcon,
//   StarIcon // (Optional if used)
// } from "@heroicons/react/24/outline";

// export default function TeamManagement() {
//   // 1️⃣ Get data from Store instead of fetching again
//   const { dashboardData } = useAdminDashboardStore();
  
//   const [expandedTeamId, setExpandedTeamId] = useState(null);
//   const [teamMembers, setTeamMembers] = useState({});
//   const [loadingMembers, setLoadingMembers] = useState({});

//   // Safety check: If parent hasn't loaded yet (rare), show loading
//   if (!dashboardData) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading Teams...</div>;

//   const teams = dashboardData.teamsList || [];

//   // Lazy Load Members on Expand
//   const toggleExpand = async (teamId) => {
//     if (expandedTeamId === teamId) {
//       setExpandedTeamId(null);
//       return;
//     }
//     setExpandedTeamId(teamId);

//     // Only fetch if we haven't loaded these members yet
//     if (!teamMembers[teamId]) {
//       try {
//         setLoadingMembers(prev => ({ ...prev, [teamId]: true }));
//         const res = await API.get(`/team/dashboard?teamId=${teamId}`);
//         setTeamMembers(prev => ({ ...prev, [teamId]: res.data.members || [] }));
//       } catch (err) {
//         console.error("Failed members fetch:", err);
//       } finally {
//         setLoadingMembers(prev => ({ ...prev, [teamId]: false }));
//       }
//     }
//   };

//   return (
//     <div className="p-6 max-w-7xl mx-auto space-y-6">
      
//       {/* Header */}
//       <div className="bg-[#1e293b]/50 p-4 rounded-2xl border border-white/5 backdrop-blur-xl flex justify-between items-center">
//         <div>
//           <h2 className="text-xl font-bold text-white">Team Management</h2>
//           <p className="text-sm text-gray-400">Overview of registered organizations.</p>
//         </div>
//         <div className="bg-blue-600/20 text-blue-400 px-4 py-2 rounded-xl text-sm font-bold border border-blue-500/20">
//           {teams.length} Teams
//         </div>
//       </div>

//       <div className="grid grid-cols-1 gap-4">
//         {teams.map((team) => {
//           const isExpanded = expandedTeamId === team.id;
          
//           return (
//             <motion.div
//               key={team.id}
//               layout
//               className={`bg-[#1e293b]/40 border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-1 ring-blue-500/50 bg-[#1e293b]/60' : 'hover:bg-[#1e293b]/60'}`}
//             >
//               {/* Card Header */}
//               <div 
//                 onClick={() => toggleExpand(team.id)}
//                 className="p-5 flex flex-col md:flex-row md:items-center justify-between cursor-pointer gap-4"
//               >
//                 <div className="flex items-center gap-4">
//                   <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
//                     <UserGroupIcon className="w-6 h-6" />
//                   </div>
//                   <div>
//                     <h3 className="text-lg font-bold text-white">{team.name}</h3>
//                     <p className="text-sm text-gray-400">{team.email}</p>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-6">
//                   <div className="flex gap-4 text-sm">
//                     <div className="flex flex-col items-center">
//                       <span className="text-white font-bold">{team.totalMembers}</span>
//                       <span className="text-[10px] text-gray-500 uppercase">Members</span>
//                     </div>
//                     <div className="w-px bg-white/10 h-8"></div>
//                     <div className="flex flex-col items-center">
//                       <span className="text-blue-400 font-bold">{team.proMembers}</span>
//                       <span className="text-[10px] text-gray-500 uppercase">Pro</span>
//                     </div>
//                     <div className="w-px bg-white/10 h-8"></div>
//                     <div className="flex flex-col items-center">
//                       <span className="text-emerald-400 font-bold">{team.freeMembers}</span>
//                       <span className="text-[10px] text-gray-500 uppercase">Free</span>
//                     </div>
//                   </div>
                  
//                   <div className={`p-2 rounded-full transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-white/10' : 'hover:bg-white/5'}`}>
//                     <ChevronDownIcon className="w-5 h-5 text-gray-400" />
//                   </div>
//                 </div>
//               </div>

//               {/* Members List (Accordion) */}
//               <AnimatePresence>
//                 {isExpanded && (
//                   <motion.div
//                     initial={{ height: 0, opacity: 0 }}
//                     animate={{ height: "auto", opacity: 1 }}
//                     exit={{ height: 0, opacity: 0 }}
//                     className="border-t border-white/5 bg-[#0f172a]/30"
//                   >
//                     <div className="p-4 space-y-2">
//                       <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 ml-2">Team Members</div>
                      
//                       {loadingMembers[team.id] ? (
//                         <div className="text-center py-4 text-gray-500 text-sm">Loading members...</div>
//                       ) : teamMembers[team.id]?.length === 0 ? (
//                         <div className="text-center py-4 text-gray-600 text-sm italic">No members found.</div>
//                       ) : (
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                           {teamMembers[team.id]?.map(member => (
//                             <div key={member.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
//                               <div className="flex items-center gap-3">
//                                 <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white font-bold">
//                                   {member.name.charAt(0).toUpperCase()}
//                                 </div>
//                                 <div>
//                                   <div className="text-sm text-white font-medium">{member.name}</div>
//                                   <div className="text-xs text-gray-500">{member.email}</div>
//                                 </div>
//                               </div>
//                               <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
//                                 member.subscription === "Pro" 
//                                   ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
//                                   : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
//                               }`}>
//                                 {member.subscription}
//                               </span>
//                             </div>
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                   </motion.div>
//                 )}
//               </AnimatePresence>
//             </motion.div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// src/components/Admin/TeamManagement.jsx
import React, { useState } from "react";
import API from "../../api/axios";
import { useAdminDashboardStore } from "../../store/adminDashboardStore";
import { motion, AnimatePresence } from "framer-motion";
import UserUsageDetails from "./UserUsageDetails"; // 🆕 New Import
import log from "../../utils/logger";

// Icons
import {
  UserGroupIcon,
  ChevronDownIcon,
  ChartBarSquareIcon,
} from "@heroicons/react/24/outline";

export default function TeamManagement({ openUserUsage }) {
  const { dashboardData } = useAdminDashboardStore();

  const [expandedTeamId, setExpandedTeamId] = useState(null);
  const [teamMembers, setTeamMembers] = useState({});
  const [loadingMembers, setLoadingMembers] = useState({});
  const [usageUserId, setUsageUserId] = useState(null); // 🆕 NEW (Modal control)
  const [usageUserName, setUsageUserName] = useState(null);

  if (!dashboardData)
    return <div className="p-8 text-center text-gray-500 animate-pulse">Loading Teams...</div>;

  const teams = dashboardData.teamsList || [];

  // Lazy load members when expanding
  const toggleExpand = async (teamId) => {
    if (expandedTeamId === teamId) {
      setExpandedTeamId(null);
      return;
    }
    setExpandedTeamId(teamId);

    if (!teamMembers[teamId]) {
      try {
        setLoadingMembers((prev) => ({ ...prev, [teamId]: true }));
        const res = await API.get(`/team/dashboard?teamId=${teamId}`);
        setTeamMembers((prev) => ({ ...prev, [teamId]: res.data.members || [] }));
      } catch (err) {
        log('ERROR', 'Failed members fetch', err?.response?.data || err);
      } finally {
        setLoadingMembers((prev) => ({ ...prev, [teamId]: false }));
      }
    }
  };

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto space-y-6">

        {/* Header */}
          <div className="bg-[#1e293b]/50 p-4 rounded-2xl border border-white/5 backdrop-blur-xl flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Team Management</h2>
            <p className="text-sm text-gray-400">Overview of registered organizations.</p>
          </div>
          <div className="bg-blue-600/20 text-blue-400 px-4 py-2 rounded-xl text-sm font-bold border border-blue-500/20">
            {teams.length} Teams
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {teams.map((team) => {
            const teamId = team._id || team.id;
            const isExpanded = expandedTeamId === teamId;

            return (
              <motion.div
                key={team.id}
                className={`bg-[#1e293b]/40 border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 ${
                  isExpanded ? "ring-1 ring-blue-500/50 bg-[#1e293b]/60" : "hover:bg-[#1e293b]/60"
                }`}
              >
                {/* Team Card Header */}
                <div
                    onClick={() => toggleExpand(teamId)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between cursor-pointer gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
                      <UserGroupIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{team.name}</h3>
                      <p className="text-sm text-gray-400">{team.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex gap-4 text-sm">
                      <div className="flex flex-col items-center">
                        <span className="text-white font-bold">{team.totalMembers}</span>
                        <span className="text-[10px] text-gray-500 uppercase">Members</span>
                      </div>
                      <div className="w-px bg-white/10 h-8"></div>
                      <div className="flex flex-col items-center">
                        <span className="text-blue-400 font-bold">{team.proMembers}</span>
                        <span className="text-[10px] text-gray-500 uppercase">Pro</span>
                      </div>
                      <div className="w-px bg-white/10 h-8"></div>
                      <div className="flex flex-col items-center">
                        <span className="text-emerald-400 font-bold">{team.freeMembers}</span>
                        <span className="text-[10px] text-gray-500 uppercase">Free</span>
                      </div>
                    </div>

                    <div
                      className={`p-2 rounded-full transition-transform duration-300 ${
                        isExpanded ? "rotate-180 bg-white/10" : "hover:bg-white/5"
                      }`}
                    >
                      <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Members Accordion */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/5 bg-[#0f172a]/30"
                    >
                      <div className="p-4 space-y-2">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 ml-2">
                          Team Members
                        </div>

                        {loadingMembers[teamId] ? (
                            <div className="text-center py-4 text-gray-500 text-sm">Loading members...</div>
                          ) : teamMembers[teamId]?.length === 0 ? (
                            <div className="text-center py-4 text-gray-600 text-sm italic">No members found.</div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {teamMembers[teamId]?.map((member) => (
                                <div
                                  key={member._id || member.id || member.userId}
                                className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                              >
                                {/* Left side: avatar + name */}
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white font-bold">
                                    {member.name.charAt(0).toUpperCase()}
                                  </div>

                                  <div>
                                    <div className="text-sm text-white font-medium">{member.name || member.displayName}</div>
                                    <div className="text-xs text-gray-500">{member.email}</div>
                                  </div>
                                </div>

                                {/* Right side: subscription + usage button */}
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                      member.subscription === "Pro"
                                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    }`}
                                  >
                                    {member.subscription}
                                  </span>

                                  {/* 🆕 View Usage Button */}
                                  <button
                                    onClick={() => {
                                      const id = member.userId || member._id || member.id;
                                      const name = member.name || member.displayName || "User";
                                      if (typeof openUserUsage === "function") {
                                        openUserUsage(id, name);
                                      } else {
                                        setUsageUserId(id);
                                        setUsageUserName(name);
                                      }
                                    }}
                                    className="p-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-blue-300"
                                  >
                                    <ChartBarSquareIcon className="w-4 h-4" />
                                  </button>

                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      
    </>
  );
}
