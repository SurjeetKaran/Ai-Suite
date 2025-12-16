// src/components/Admin/LoadBalancerConfig.jsx
import React, { useEffect, useState } from "react";
import API from "../../api/axios";
import log from "../../utils/logger";

export default function LoadBalancerConfig() {
  const [config, setConfig] = useState({
    strategy: "weighted",
    retryCount: 1,
    cooldownMinutes: 10,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [providers, setProviders] = useState([]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/lb-config");
      const data = res.data || {};
      setConfig({
        strategy: data.strategy || "weighted",
        retryCount: data.retryCount || 1,
        cooldownMinutes: data.cooldownMinutes || 10,
      });
      setProviders(data.providers || []);
    } catch (err) {
      log("ERROR", "Failed to load LB config", err?.response?.data || err);
      showMsg("Failed to load config", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const showMsg = (txt, type = "success") => {
    setMessage({ txt, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const updateProvider = (index, key, value) => {
    setProviders((p) =>
      p.map((prov, i) =>
        i === index
          ? {
              ...prov,
              [key]:
                key === "percentage" || key === "dailyTokenLimit"
                  ? Number(value)
                  : value,
            }
          : prov
      )
    );
  };

  const totalPercentage = providers.reduce(
    (sum, p) => sum + Number(p.percentage || 0),
    0
  );

  const handleSave = async () => {
    try {
      // 🔒 Validate provider percentages
      if (providers?.length) {
        const total = providers.reduce(
          (sum, p) => sum + Number(p.percentage || 0),
          0
        );

        if (total !== 100) {
          return showMsg("Provider percentages must total 100%", "error");
        }

       const enabledProviders = providers.filter(
  (p) => Number(p.percentage) > 0
);

if (enabledProviders.length === 0) {
  return showMsg(
    "At least one provider must have a percentage greater than 0",
    "error"
  );
}

      }

      setSaving(true);

      await API.put("/admin/lb-config", {
        strategy: config.strategy,
        retryCount: Number(config.retryCount),
        cooldownMinutes: Number(config.cooldownMinutes),
        providers,
      });

      showMsg("Load balancer updated");
    } catch (err) {
      log(
        "ERROR",
        "Failed to update load balancer config",
        err?.response?.data || err
      );
      showMsg("Failed to update", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="bg-[#1e293b]/50 p-4 rounded-2xl border border-white/5">
        <h2 className="text-xl font-bold text-white">Load Balancer</h2>
        <p className="text-sm text-gray-400">
          Configure key selection strategy and retry/cooldown behaviour.
        </p>
      </div>

      <div className="bg-[#0f172a] border border-white/5 p-6 rounded-2xl">
        {loading ? (
          <div className="p-8 text-gray-400">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Strategy
              </label>
              <select
                value={config.strategy}
                onChange={(e) =>
                  setConfig((s) => ({ ...s, strategy: e.target.value }))
                }
                className="w-full p-3 rounded bg-transparent border text-white"
              >
                <option
                  value="weighted"
                  style={{ backgroundColor: "#0f172a", color: "#ffffff" }}
                >
                  Weighted
                </option>
                <option
                  value="round_robin"
                  style={{ backgroundColor: "#0f172a", color: "#ffffff" }}
                >
                  Round Robin
                </option>
                <option
                  value="failover"
                  style={{ backgroundColor: "#0f172a", color: "#ffffff" }}
                >
                  Failover
                </option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Strategy chooses routing: Weighted (by key weight), Round‑Robin,
                or Failover.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Retry Count
                </label>
                <input
                  type="number"
                  value={config.retryCount}
                  onChange={(e) =>
                    setConfig((s) => ({ ...s, retryCount: e.target.value }))
                  }
                  className="w-full p-3 rounded bg-transparent border text-white"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Number of retries before switching providers (recommend 1–2).
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Cooldown (minutes)
                </label>
                <input
                  type="number"
                  value={config.cooldownMinutes}
                  onChange={(e) =>
                    setConfig((s) => ({
                      ...s,
                      cooldownMinutes: e.target.value,
                    }))
                  }
                  className="w-full p-3 rounded bg-transparent border text-white"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Time to pause a failing key after repeated errors to protect
                  quota.
                </p>
              </div>
            </div>

            <div className="border-t border-white/5 pt-6 space-y-4">
              <h3 className="text-sm font-bold text-white">
                Provider Distribution
              </h3>
              <p className="text-xs text-gray-400">
                Control traffic split and daily token limits per provider.
              </p>

              {providers.length === 0 && (
                <div className="text-sm text-gray-500">
                  No providers configured.
                </div>
              )}

              {providers.map((p, i) => (
                <div
                  key={p.provider}
                  className="grid grid-cols-4 gap-3 items-center"
                >
                  <div className="text-sm text-white uppercase">
                    {p.provider}
                  </div>

                  <input
                    type="number"
                    value={p.percentage}
                    onChange={(e) =>
                      updateProvider(i, "percentage", e.target.value)
                    }
                    className="p-2 rounded bg-transparent border text-white"
                    placeholder="%"
                  />

                  <input
                    type="number"
                    value={p.dailyTokenLimit}
                    onChange={(e) =>
                      updateProvider(i, "dailyTokenLimit", e.target.value)
                    }
                    className="p-2 rounded bg-transparent border text-white"
                    placeholder="Tokens/day"
                  />

                  <div className="text-xs text-gray-400">
                    Used: {p.usedTokens?.toLocaleString() || 0}
                  </div>

                
                </div>
              ))}

              <div
                className={`text-xs ${
                  totalPercentage === 100 ? "text-green-400" : "text-red-400"
                }`}
              >
                Total Allocation: {totalPercentage}%
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-4 py-2 rounded text-white ${
                  saving ? "bg-blue-600/50 cursor-not-allowed" : "bg-blue-600"
                }`}
              >
                {saving ? "Saving..." : "Save"}
              </button>

              <button
                onClick={fetchConfig}
                className="px-3 py-2 bg-white/5 rounded text-gray-300"
              >
                Reload
              </button>
            </div>
          </div>
        )}
      </div>

      {message && (
        <div
          className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl ${
            message.type === "success" ? "bg-green-600" : "bg-red-600"
          } text-white`}
        >
          {message.txt}
        </div>
      )}
    </div>
  );
}
