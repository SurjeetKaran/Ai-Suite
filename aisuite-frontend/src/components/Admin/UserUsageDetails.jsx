
import React, { useEffect, useState } from "react";
import API from "../../api/axios";
import log from "../../utils/logger";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

/**
 * Full-page User Usage Details (premium SaaS UI)
 * ⚠️ LOGIC / API / MESSAGE EXPANSION UNTOUCHED
 */
export default function UserUsageDetails({
  userId,
  userName = "User",
  onBack,
  teamMode = false,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openOutputs, setOpenOutputs] = useState({});

  const endpointFor = (id) =>
    teamMode
      ? `/team/user-usage/${encodeURIComponent(id)}`
      : `/admin/user-full-usage/${encodeURIComponent(id)}`;

  useEffect(() => {
    if (!userId) return;
    setError(null);
    setLoading(true);
    API.get(endpointFor(userId))
      .then((res) => {
        const payload = res.data || res.data?.data || res.data?.result || res;
        setData(payload);
      })
      .catch((err) => {
        log("ERROR", "User usage fetch error", err?.response?.data || err);
        const status = err?.response?.status;
        if (status === 403)
          setError("You don't have permission to view this user's usage.");
        else if (err?.response?.data?.message)
          setError(err.response.data.message);
        else setError("Failed to load usage details.");
      })
      .finally(() => setLoading(false));
  }, [userId, teamMode]);

  /* ---------------- helpers ---------------- */
  const formatNumber = (n) =>
    n == null ? "0" : Number(n).toLocaleString();

  const safe = (v, fb = 0) => (v == null ? fb : v);

  const getMessageTokens = (m) => {
    if (!m?.tokenUsage) return 0;
    const tu = m.tokenUsage;
    if (typeof tu.total === "number") return tu.total;
    if (typeof tu.tokens === "number") return tu.tokens;
    if (tu.modelTokens && typeof tu.modelTokens === "object") {
      return Object.values(tu.modelTokens).reduce(
        (a, b) => a + (Number(b) || 0),
        0
      );
    }
    return 0;
  };

  const computedTotalTokens = () => {
    if (!data?.detailedQueries)
      return safe(data?.summary?.totalTokensUsed, 0);
    let sum = 0;
    (data.detailedQueries || []).forEach((q) => {
      if (typeof q.totalTokens === "number") sum += q.totalTokens;
      else (q.messages || []).forEach((m) => (sum += getMessageTokens(m)));
    });
    return sum || safe(data?.summary?.totalTokensUsed, 0);
  };

  const modelUsage = (() => {
    const mu = data?.summary?.modelUsage || {};
    const out = {};
    Object.entries(mu).forEach(([k, v]) => {
      const title = k
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      out[title] = Number(v || 0);
    });
    return out;
  })();

  const recentConvs = data?.recentConversations || [];
  const detailedQueries = data?.detailedQueries || [];

  const toggleOutputs = (key) =>
    setOpenOutputs((p) => ({ ...p, [key]: !p[key] }));

  /* ============================ UI ============================ */
  return (
    <div className="min-h-screen bg-[#020617] px-4 md:px-8 py-6">
      <div className="max-w-screen-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-200" />
          </button>
          <div>
            <div className="text-xs text-gray-400">
              Usage • {teamMode ? "Team View" : "Admin View"}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              Usage – {userName}
            </h1>
            <div className="text-xs text-gray-500">
              {data?.user?.email || ""}
            </div>
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="py-12 text-center text-gray-400">
            Loading usage details…
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-900/30 text-red-200 rounded-lg">
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* KPI strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryCard
                title="Total Queries"
                value={formatNumber(
                  safe(data?.summary?.totalQueries, 0)
                )}
              />
              <SummaryCard
                title="Total Tokens"
                value={formatNumber(computedTotalTokens())}
              />
              <SummaryCard
                title="Conversations"
                value={recentConvs.length}
              />
              <SummaryCard
                title="Active Modules"
                value={Object.keys(
                  data?.summary?.moduleUsage || {}
                ).length}
              />
            </div>

            {/* Model usage */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <h3 className="text-sm font-semibold text-gray-200 mb-4">
                Model usage
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {Object.entries(modelUsage).map(([m, v]) => (
                  <div
                    key={m}
                    className="rounded-xl bg-[#050d1c] border border-white/5 p-3"
                  >
                    <div className="text-[11px] text-gray-400">
                      {m}
                    </div>
                    <div className="text-xl font-bold text-white mt-1">
                      {formatNumber(v)}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      requests
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Analytics row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard
                title="Most Used Model"
                value={Object.keys(modelUsage)[0] || "—"}
                subtitle="based on request counts"
              />
              <InfoCard
                title="Average Tokens / Query"
                value={(() => {
                  const q = safe(data?.summary?.totalQueries, 0);
                  return q
                    ? Math.round(computedTotalTokens() / q)
                    : 0;
                })()}
                subtitle="computed from detailed queries"
              />
            </div>

            {/* Recent Conversations – FULL WIDTH */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02]">
              <div className="p-4 border-b border-white/5 text-sm font-semibold text-white">
                Recent Conversations
              </div>

              <div className="divide-y divide-white/5">
                {recentConvs.map((conv) => {
                  const details =
                    detailedQueries.find(
                      (q) => q.queryId === conv.id
                    ) || {};
                  const tokens =
                    typeof details.totalTokens === "number"
                      ? details.totalTokens
                      : (details.messages || []).reduce(
                          (a, m) => a + getMessageTokens(m),
                          0
                        );

                  return (
                    <div
                      key={conv.id}
                      className="p-4 hover:bg-white/[0.02] transition"
                    >
                      {/* ⚠️ MESSAGE EXPANSION UNTOUCHED BELOW */}
                      <div className="flex justify-between gap-4">
                        <div>
                          <div className="font-semibold text-white">
                            {conv.title || "Untitled"}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {conv.moduleType || "General"} •{" "}
                            {conv.date
                              ? new Date(
                                  conv.date
                                ).toLocaleString()
                              : "-"}
                          </div>
                        </div>
                        <div className="text-right text-xs text-gray-300">
                          <div className="font-semibold">
                            {formatNumber(tokens)}
                          </div>
                          <div className="text-gray-500">tokens</div>
                        </div>
                      </div>

                      {/* Original details/messages logic preserved */}
                      <details className="mt-3 text-sm text-gray-300">
                        <summary className="cursor-pointer text-xs text-gray-400">
                          View messages
                        </summary>

                        <div className="mt-2 space-y-2">
                          {(details.messages || []).map((m, i, arr) => {
                            const key = `${conv.id}-${i}`;
                            let tokens = getMessageTokens(m);
                            let modelName =
                              m?.tokenUsage?.model ||
                              Object.keys(
                                m?.individualOutputs || {}
                              )[0] ||
                              "-";

                            if (
                              (m.role === "user" || !tokens) &&
                              Array.isArray(arr)
                            ) {
                              const nextAssistant = arr
                                .slice(i + 1)
                                .find(
                                  (x) =>
                                    x.role === "assistant"
                                );
                              if (nextAssistant) {
                                tokens =
                                  getMessageTokens(
                                    nextAssistant
                                  ) || tokens;
                                modelName =
                                  Object.keys(
                                    nextAssistant.individualOutputs ||
                                      {}
                                  )[0] || modelName;
                              }
                            }

                            return (
                              <div
                                key={i}
                                className="p-3 bg-[#061026] rounded-md border border-white/6"
                              >
                                <div className="flex justify-between gap-3">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                                        m.role === "user"
                                          ? "bg-white/5"
                                          : "bg-blue-600 text-white"
                                      }`}
                                    >
                                      {m.role}
                                    </span>
                                    <div className="text-sm text-gray-100">
                                      {m.contentPreview ||
                                        m.content?.slice?.(
                                          0,
                                          700
                                        )}
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-400 text-right">
                                    <div>
                                      Tokens:{" "}
                                      <span className="text-gray-200">
                                        {formatNumber(tokens)}
                                      </span>
                                    </div>
                                    <div className="text-[11px] mt-1">
                                      Model:{" "}
                                      <span className="text-gray-200">
                                        {modelName}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {m.role === "assistant" &&
                                  m.individualOutputs && (
                                    <div className="mt-3">
                                      <button
                                        onClick={() =>
                                          toggleOutputs(key)
                                        }
                                        className="text-xs text-blue-400 hover:underline"
                                      >
                                        {openOutputs[key]
                                          ? "Hide responses"
                                          : "Show responses"}
                                      </button>

                                      {openOutputs[key] && (
                                        <div className="mt-2 space-y-2">
                                          {Object.entries(
                                            m.individualOutputs
                                          ).map(
                                            ([provider, out], idx) => (
                                              <div
                                                key={idx}
                                                className="p-3 bg-[#041323] rounded border border-white/5"
                                              >
                                                <div className="flex justify-between text-xs text-gray-400">
                                                  <span className="uppercase font-semibold">
                                                    {provider}
                                                  </span>
                                                  <span>
                                                    Tokens:{" "}
                                                    {formatNumber(
                                                      out?.tokensUsed ||
                                                        out?.totalTokens ||
                                                        out?.tokens ||
                                                        0
                                                    )}
                                                  </span>
                                                </div>
                                                <div className="mt-2 text-sm text-gray-200 whitespace-pre-wrap max-h-48 overflow-auto">
                                                  {out?.text ||
                                                    out?.output ||
                                                    JSON.stringify(
                                                      out,
                                                      null,
                                                      2
                                                    )}
                                                </div>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                              </div>
                            );
                          })}
                        </div>
                      </details>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- small UI blocks ---------- */
function SummaryCard({ title, value }) {
  return (
    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
      <div className="text-xs text-gray-400">{title}</div>
      <div className="text-2xl font-bold text-white mt-1">
        {value}
      </div>
    </div>
  );
}

function InfoCard({ title, value, subtitle }) {
  return (
    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5">
      <div className="text-xs text-gray-400">{title}</div>
      <div className="text-xl font-bold text-white mt-2">
        {value}
      </div>
      {subtitle && (
        <div className="text-xs text-gray-500 mt-1">
          {subtitle}
        </div>
      )}
    </div>
  );
}
