import React, { useEffect, useState } from "react";
import API from "../../api/axios";
import log from "../../utils/logger";
import dialog from "../../utils/dialogService";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

const MODELS_KEY = "AVAILABLE_MODELS";

export default function SystemConfig() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Models form
  const [newModelId, setNewModelId] = useState("");
  const [newModelName, setNewModelName] = useState("");

  // Generic system config form
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  /* ---------------- helpers ---------------- */

  const showMsg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  /* ---------------- data ---------------- */

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/system-config");
      setConfigs(res.data || []);
    } catch (err) {
      log("ERROR", "Failed to load system config", err?.response?.data || err);
      showMsg("Failed to load system config", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  /* ---------------- models logic ---------------- */

  const modelsConfig = configs.find((c) => c.key === MODELS_KEY);
  const models = Array.isArray(modelsConfig?.value)
    ? modelsConfig.value
    : [];

  const saveModels = async (updatedModels) => {
    try {
      setSaving(true);
      await API.post("/admin/system-config", {
        key: MODELS_KEY,
        value: updatedModels,
      });
      showMsg("Models updated");
      fetchConfigs();
    } catch (err) {
      log("ERROR", "Failed to save models", err?.response?.data || err);
      showMsg("Failed to save models", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddModel = async () => {
    const id = newModelId.trim().toLowerCase();
    const name = newModelName.trim();

    if (!id || !name) {
      return showMsg("Model id and name are required", "error");
    }

    if (models.some((m) => m.id === id)) {
      return showMsg("Model id already exists", "error");
    }

    await saveModels([...models, { id, name }]);
    setNewModelId("");
    setNewModelName("");
  };

  const handleDeleteModel = async (id) => {
    const ok = await dialog.confirm(`Delete model "${id}"?`);
    if (!ok) return;
    await saveModels(models.filter((m) => m.id !== id));
  };

  /* ---------------- generic config logic ---------------- */

  const handleSaveGenericConfig = async () => {
    const key = newKey.trim();

    if (!key) {
      return showMsg("Config key is required", "error");
    }

    let value;
    try {
      value = JSON.parse(newValue);
    } catch {
      value = newValue;
    }

    try {
      setSaving(true);
      await API.post("/admin/system-config", {
        key,
        value,
      });
      showMsg("System config saved");
      setNewKey("");
      setNewValue("");
      fetchConfigs();
    } catch (err) {
      log("ERROR", "Failed to save system config", err?.response?.data || err);
      showMsg("Failed to save system config", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#1e293b]/50 p-4 rounded-2xl border border-white/5">
        <h2 className="text-xl font-bold text-white">System Configuration</h2>
        <p className="text-sm text-gray-400">
          Manage environment-style variables and runtime system behavior.
        </p>
      </div>

      {/* ---------------- AI MODELS ---------------- */}
      <div className="bg-[#0f172a] border border-white/5 p-5 rounded-2xl space-y-4">
        <h3 className="text-lg font-bold text-white">AI Models</h3>
        <p className="text-xs text-gray-400">
          Define which AI models are available in the app.
          <br />
          <span className="text-gray-500">
            ID is internal (lowercase), Name is user-facing.
          </span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={newModelId}
            onChange={(e) => setNewModelId(e.target.value)}
            placeholder="Model ID (e.g. chatgpt)"
            className="p-3 rounded bg-transparent border border-white/10 text-white placeholder-gray-400"
          />
          <input
            value={newModelName}
            onChange={(e) => setNewModelName(e.target.value)}
            placeholder="Model Name (e.g. ChatGPT 4o)"
            className="p-3 rounded bg-transparent border border-white/10 text-white placeholder-gray-400"
          />
          <button
            onClick={handleAddModel}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 rounded text-white disabled:opacity-50"
          >
            <PlusIcon className="w-4 h-4" />
            Add Model
          </button>
        </div>

        {models.length === 0 ? (
          <div className="text-sm text-gray-500">No models configured.</div>
        ) : (
          <table className="w-full text-sm text-gray-300">
            <thead className="text-xs text-gray-400 uppercase">
              <tr>
                <th className="p-2 text-left">ID</th>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.id} className="border-t border-white/5">
                  <td className="p-2 font-mono text-xs">{m.id}</td>
                  <td className="p-2">{m.name}</td>
                  <td className="p-2">
                    <button
                      onClick={() => handleDeleteModel(m.id)}
                      className="p-2 rounded bg-red-600/20 text-red-300 hover:bg-red-600/30"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ---------------- GENERIC SYSTEM CONFIG ---------------- */}
      <div className="bg-[#0f172a] border border-white/5 p-5 rounded-2xl space-y-4">
        <h3 className="text-lg font-bold text-white">
          Add / Update System Config
        </h3>

        <input
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="Config Key (e.g. SMTP_EMAIL, GOOGLE_CLIENT_ID, JWT_SECRET)"
          className="w-full p-3 rounded bg-transparent border border-white/10 text-white placeholder-gray-400"
        />

        <textarea
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          rows={6}
          placeholder={`Config Value examples:

SMTP_EMAIL → support@yourdomain.com
SMTP_PASSWORD → app-password

GOOGLE_CLIENT_ID → your_google_client_id
GOOGLE_CLIENT_SECRET → your_google_client_secret

JWT_SECRET → strong_random_secret
`}
          className="w-full p-3 rounded bg-transparent border border-white/10 text-white placeholder-gray-400 font-mono text-sm"
        />

        <button
          onClick={handleSaveGenericConfig}
          disabled={saving}
          className="px-4 py-2 bg-emerald-600 rounded text-white disabled:opacity-50"
        >
          Save System Config
        </button>
      </div>

      {/* ---------------- EXISTING CONFIGS ---------------- */}
      <div className="bg-[#0f172a] border border-white/5 p-5 rounded-2xl space-y-4">
        <h3 className="text-lg font-bold text-white">Existing Configs</h3>

        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : (
          configs.map((cfg) => (
            <div key={cfg.key} className="space-y-1">
              <div className="text-xs text-gray-400">{cfg.key}</div>
              <textarea
                readOnly
                value={
                  typeof cfg.value === "string"
                    ? cfg.value
                    : JSON.stringify(cfg.value, null, 2)
                }
                rows={3}
                className="w-full p-3 rounded bg-transparent border border-white/10 text-gray-300 text-xs"
              />
            </div>
          ))
        )}
      </div>

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

