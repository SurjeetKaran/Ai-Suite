// src/components/Admin/PlanManagement.jsx


import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../api/axios";

// Icons
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  TagIcon,
  ListBulletIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";

export default function PlanManagement() {
  const [plans, setPlans] = useState([]);
  const [adding, setAdding] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [newPlan, setNewPlan] = useState({ name: "", price: "", dailyQueryLimit: "", features: "" });
  const [editPlanData, setEditPlanData] = useState({});
  const [message, setMessage] = useState(null); // Simple toast state

  const fetchPlans = async () => {
    try {
      const res = await API.get("/admin/plan");
      setPlans(res.data);
    } catch (err) {
      console.error("Failed to fetch plans:", err);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Handlers
  const handleInputChange = (e) => setNewPlan({ ...newPlan, [e.target.name]: e.target.value });
  const handleEditChange = (e) => setEditPlanData({ ...editPlanData, [e.target.name]: e.target.value });

  const handleAddPlan = async () => {
    try {
      await API.post("/admin/plan", newPlan);
      fetchPlans();
      setAdding(false);
      setNewPlan({ name: "", price: "", dailyQueryLimit: "", features: "" });
      showMessage("Plan added successfully!", "success");
    } catch (err) {
      showMessage("Failed to add plan", "error");
    }
  };

  const handleSaveClick = async (planId) => {
    try {
      await API.patch(`/admin/plan/${planId}`, editPlanData);
      fetchPlans();
      setEditingPlanId(null);
      showMessage("Plan updated successfully!", "success");
    } catch (err) {
      showMessage("Failed to update plan", "error");
    }
  };

  const handleDeleteClick = async (planId) => {
    if(!window.confirm("Delete this plan?")) return;
    try {
      await API.delete(`/admin/plan/${planId}`);
      setPlans(prev => prev.filter(p => p._id !== planId));
      showMessage("Plan deleted", "success");
    } catch (err) {
      showMessage("Failed to delete plan", "error");
    }
  };

  const showMessage = (msg, type) => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-[#1e293b]/50 p-4 rounded-2xl border border-white/5 backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-bold text-white">Subscription Plans</h2>
          <p className="text-sm text-gray-400">Manage pricing tiers and limits.</p>
        </div>
        <button
          onClick={() => setAdding(!adding)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20"
        >
          {adding ? <XMarkIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
          {adding ? "Cancel" : "Add Plan"}
        </button>
      </div>

      {/* Add Plan Form */}
      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[#0f172a] border border-blue-500/30 p-6 rounded-2xl space-y-4 shadow-xl">
              <h3 className="text-white font-bold flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-blue-400" /> New Plan Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputGroup icon={<TagIcon />} name="name" placeholder="Plan Name (e.g. Pro)" value={newPlan.name} onChange={handleInputChange} />
                <InputGroup icon={<CurrencyDollarIcon />} name="price" placeholder="Price (e.g. 299)" type="number" value={newPlan.price} onChange={handleInputChange} />
                <InputGroup icon={<SparklesIcon />} name="dailyQueryLimit" placeholder="Daily Limit (0 = Unlimited)" type="number" value={newPlan.dailyQueryLimit} onChange={handleInputChange} />
                <InputGroup icon={<ListBulletIcon />} name="features" placeholder="Features (comma separated)" value={newPlan.features} onChange={handleInputChange} />
              </div>
              <button onClick={handleAddPlan} className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white font-bold shadow-lg hover:opacity-90 transition">
                Create Plan
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isEditing = editingPlanId === plan._id;
          
          return (
            <motion.div 
              key={plan._id}
              layout
              className={`relative p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between group
                ${isEditing ? 'bg-[#0f172a] border-blue-500/50 shadow-blue-900/20 shadow-xl' : 'bg-[#1e293b]/40 border-white/5 hover:border-white/10 hover:bg-[#1e293b]/60'}
              `}
            >
              {/* Header Actions */}
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {isEditing ? (
                  <>
                    <ActionButton icon={<CheckIcon />} color="text-green-400" onClick={() => handleSaveClick(plan._id)} />
                    <ActionButton icon={<XMarkIcon />} color="text-gray-400" onClick={() => setEditingPlanId(null)} />
                  </>
                ) : (
                  <>
                    <ActionButton icon={<PencilSquareIcon />} color="text-blue-400" onClick={() => { setEditingPlanId(plan._id); setEditPlanData(plan); }} />
                    <ActionButton icon={<TrashIcon />} color="text-red-400" onClick={() => handleDeleteClick(plan._id)} />
                  </>
                )}
              </div>

              {/* Content */}
              <div className="space-y-4">
                {isEditing ? (
                  <div className="space-y-3 mt-6">
                    <EditInput label="Name" name="name" value={editPlanData.name} onChange={handleEditChange} />
                    <EditInput label="Price" name="price" value={editPlanData.price} onChange={handleEditChange} />
                    <EditInput label="Limit" name="dailyQueryLimit" value={editPlanData.dailyQueryLimit} onChange={handleEditChange} />
                    <EditInput label="Features" name="features" value={editPlanData.features} onChange={handleEditChange} />
                  </div>
                ) : (
                  <>
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-wide">{plan.name}</h3>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                          ${plan.price}
                        </span>
                        <span className="text-sm text-gray-500">/mo</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Limits</div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        {plan.dailyQueryLimit === 0 ? "Unlimited Queries" : `${plan.dailyQueryLimit} Queries / Day`}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Features</div>
                      <ul className="space-y-1">
                        {Array.isArray(plan.features) 
                          ? plan.features.map((f, i) => <FeatureItem key={i} text={f} />)
                          : plan.features?.split(',').map((f, i) => <FeatureItem key={i} text={f} />)
                        }
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Toast Notification */}
      {message && (
        <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm animate-in slide-in-from-bottom-5 ${message.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}

// Sub-components for cleanliness
const InputGroup = ({ icon, ...props }) => (
  <div className="relative group">
    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors w-5 h-5">
      {icon}
    </div>
    <input
      {...props}
      className="w-full bg-[#1e293b] text-white pl-10 pr-4 py-3 rounded-xl border border-white/10 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder-gray-600"
    />
  </div>
);

const EditInput = ({ label, ...props }) => (
  <div>
    <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">{label}</label>
    <input {...props} className="w-full bg-black/20 text-white px-3 py-2 rounded-lg border border-white/10 focus:border-blue-500 outline-none text-sm" />
  </div>
);

const ActionButton = ({ icon, color, onClick }) => (
  <button onClick={onClick} className={`p-2 rounded-lg bg-white/5 hover:bg-white/10 ${color} transition-colors`}>
    <div className="w-5 h-5">{icon}</div>
  </button>
);

const FeatureItem = ({ text }) => (
  <li className="flex items-start gap-2 text-sm text-gray-400">
    <CheckIcon className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
    <span>{text}</span>
  </li>
);
