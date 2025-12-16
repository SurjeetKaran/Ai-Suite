import React, { useEffect, useState } from "react";
import API from "../../api/axios";
import log from "../../utils/logger";
import { motion } from "framer-motion";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function ApiKeyManagement() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [form, setForm] = useState({
    provider: "",
    label: "",
    key: "",
    weight: 1,
    dailyLimit: 10000,
    dailyTokenLimit: 1000000,
  });

  /* ---------------- helpers ---------------- */

  const showMsg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      provider: "",
      label: "",
      key: "",
      weight: 1,
      dailyLimit: 10000,
      dailyTokenLimit: 1000000,
    });
  };

  /* ---------------- data ---------------- */

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/api-keys");
      setKeys(res.data || []);
    } catch (err) {
      log("ERROR", "Failed fetching API keys", err?.response?.data || err);
      showMsg("Failed to fetch API keys", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  /* ---------------- create ---------------- */

  const handleCreate = async () => {
    try {
      const provider = form.provider.trim().toLowerCase();

      if (!provider) {
        return showMsg("Provider name is required", "error");
      }
      if (!form.key) {
        return showMsg("API key is required", "error");
      }

      await API.post("/admin/api-keys", {
        provider,
        label: form.label,
        key: form.key,
        weight: Number(form.weight),
        dailyLimit: Number(form.dailyLimit),
        dailyTokenLimit: Number(form.dailyTokenLimit),
      });

      showMsg("API key added");
      resetForm();
      setShowForm(false);
      fetchKeys();
    } catch (err) {
      log("ERROR", "Failed to create API key", err?.response?.data || err);
      showMsg(err?.response?.data?.message || "Failed to add key", "error");
    }
  };

  /* ---------------- update ---------------- */

  const handleUpdate = async () => {
    try {
      await API.put(`/admin/api-keys/${editingId}`, {
        label: form.label,
        key: form.key || undefined,
        weight: Number(form.weight),
        dailyLimit: Number(form.dailyLimit),
        dailyTokenLimit: Number(form.dailyTokenLimit),
      });

      showMsg("API key updated");
      setEditingId(null);
      setShowForm(false);
      resetForm();
      fetchKeys();
    } catch (err) {
      log("ERROR", "Failed to update API key", err?.response?.data || err);
      showMsg("Failed to update key", "error");
    }
  };

  /* ---------------- actions ---------------- */

  const startEdit = (k) => {
    setEditingId(k._id);
    setForm({
      provider: k.provider,
      label: k.label || "",
      key: "",
      weight: k.weight || 1,
      dailyLimit: k.dailyLimit || 10000,
      dailyTokenLimit: k.dailyTokenLimit || 1000000,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleStatus = async (id) => {
    try {
      await API.patch(`/admin/api-keys/${id}/toggle`);
      showMsg("Status toggled");
      fetchKeys();
    } catch {
      showMsg("Failed to toggle status", "error");
    }
  };

  const confirmDelete = (key) => {
    setDeleteTarget(key);
  };

  const handleDeleteConfirmed = async () => {
    try {
      await API.delete(`/admin/api-keys/${deleteTarget._id}`);
      showMsg("API key deleted");
      setDeleteTarget(null);
      fetchKeys();
    } catch (err) {
      log("ERROR", "Failed to delete API key", err?.response?.data || err);
      showMsg("Failed to delete key", "error");
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-[#1e293b]/50 p-4 rounded-2xl border border-white/5">
        <div>
          <h2 className="text-xl font-bold text-white">API Keys</h2>
          <p className="text-sm text-gray-400">
            Manage provider API keys, weights & limits.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowForm((s) => !s);
              setEditingId(null);
              resetForm();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-xl text-white"
          >
            <PlusIcon className="w-4 h-4" />
            {showForm ? "Close" : "Add Key"}
          </button>
          <button
            onClick={fetchKeys}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl text-gray-300"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0f172a] border border-white/5 p-5 rounded-2xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                Provider
              </label>
              <input
                name="provider"
                value={form.provider}
                onChange={handleInput}
                disabled={!!editingId}
                placeholder="e.g. openai, groq"
                className="w-full p-3 rounded-lg bg-transparent border border-white/10 text-white"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                Label
              </label>
              <input
                name="label"
                value={form.label}
                onChange={handleInput}
                className="w-full p-3 rounded-lg bg-transparent border border-white/10 text-white"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                Weight
              </label>
              <input
                name="weight"
                type="number"
                value={form.weight}
                onChange={handleInput}
                className="w-full p-3 rounded-lg bg-transparent border border-white/10 text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">
                API Key
              </label>
              <input
                name="key"
                value={form.key}
                onChange={handleInput}
                className="w-full p-3 rounded-lg bg-transparent border border-white/10 text-white"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                Daily Limit
              </label>
              <input
                name="dailyLimit"
                type="number"
                value={form.dailyLimit}
                onChange={handleInput}
                className="w-full p-3 rounded-lg bg-transparent border border-white/10 text-white"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                Daily Token Limit
              </label>
              <input
                name="dailyTokenLimit"
                type="number"
                value={form.dailyTokenLimit}
                onChange={handleInput}
                className="w-full p-3 rounded-lg bg-transparent border border-white/10 text-white"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            {editingId ? (
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-green-600 rounded-xl text-white"
              >
                <CheckIcon className="w-4 h-4 inline mr-2" />
                Save
              </button>
            ) : (
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 rounded-xl text-white"
              >
                Create Key
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Table */}
      <div className="bg-[#1e293b]/50 border border-white/5 rounded-2xl p-4">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading…</div>
        ) : keys.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No API keys configured.
          </div>
        ) : (
          <table className="w-full text-sm text-gray-300">
            <thead className="text-xs text-gray-400 uppercase">
              <tr>
                <th className="p-3">Provider</th>
                <th className="p-3">Label</th>
                <th className="p-3">Weight</th>
                <th className="p-3">Usage</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k._id} className="border-t border-white/5">
                  <td className="p-3">
                    <span className="px-2 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      {k.provider.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3">{k.label || "-"}</td>
                  <td className="p-3">{k.weight}</td>
                  <td className="p-3 text-xs text-gray-400">
                    🔁 {k.usedRequests}/{k.dailyLimit}
                    <br />
                    🧠 {k.usedTokens || 0}/{k.dailyTokenLimit}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        k.isActive
                          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-300 border border-red-500/20"
                      }`}
                    >
                      {k.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => startEdit(k)}
                      className="p-2 bg-white/5 rounded"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleStatus(k._id)}
                      className="p-2 bg-white/5 rounded"
                    >
                      <CheckIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => confirmDelete(k)}
                      className="p-2 bg-red-600/20 rounded"
                    >
                      <TrashIcon className="w-4 h-4 text-red-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-bold text-white mb-2">
              Delete API Key?
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              This will permanently delete the key for{" "}
              <span className="text-white font-medium">
                {deleteTarget.provider}
              </span>
              {deleteTarget.label && ` (${deleteTarget.label})`}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-white/5 rounded-lg text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="px-4 py-2 bg-red-600 rounded-lg text-white"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Toast */}
      {message && (
        <div
          className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl ${
            message.type === "success" ? "bg-green-600" : "bg-red-600"
          } text-white`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
