

import React, { useEffect, useState } from "react";
import { useAdminDashboardStore } from "../../store/adminDashboardStore";
import { motion } from "framer-motion";
import CountUp from "react-countup";

// Charts
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

// Icons
import {
  UsersIcon,
  StarIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CalendarIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  NewspaperIcon,
} from "@heroicons/react/24/outline";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f172a] border border-white/10 p-3 rounded-xl shadow-xl">
        <p className="text-gray-300 text-xs mb-1">{label}</p>
        <p className="text-white font-bold text-sm">
          {payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export default function HomeSection() {
  const { dashboardData, loading, fetchDashboard } = useAdminDashboardStore();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // useEffect(() => {
  //   fetchDashboard();
  // }, [fetchDashboard]);

  const fetchDashboardWithDates = () => {
    fetchDashboard({ start: startDate, end: endDate });
  };

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm tracking-wider uppercase animate-pulse">
        Loading Analytics...
      </div>
    );
  }

  const { userStats, recentQueries } = dashboardData;

  // Charts Data
  const subscriptionSplit = [
    { name: "Pro", value: userStats.proUsers },
    { name: "Free", value: userStats.totalUsers - userStats.proUsers },
  ];

  const metrics = [
    {
      title: "Total Users",
      value: userStats.totalUsers,
      icon: <UsersIcon className="w-6 h-6 text-blue-400" />,
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      title: "Pro Users",
      value: userStats.proUsers,
      icon: <StarIcon className="w-6 h-6 text-amber-400" />,
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      title: "Total Revenue",
      value: userStats.totalRevenue,
      prefix: "$",
      icon: <CurrencyDollarIcon className="w-6 h-6 text-emerald-400" />,
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      title: "Total Queries",
      value: userStats.totalQueries,
      icon: <ChartBarIcon className="w-6 h-6 text-purple-400" />,
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. DATE FILTER */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 bg-[#1e293b]/50 border border-white/5 p-4 rounded-2xl backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-bold text-white">Overview</h2>
          <p className="text-sm text-gray-400">
            Track performance and user activity.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#0f172a] p-1 rounded-xl border border-white/10">
          <div className="flex items-center px-3 py-1.5 border-r border-white/10">
            <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-gray-300 text-xs focus:outline-none w-24"
            />
          </div>
          <div className="flex items-center px-3 py-1.5">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-gray-300 text-xs focus:outline-none w-24"
            />
          </div>
          <button
            onClick={fetchDashboardWithDates}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Filter
          </button>
        </div>
      </div>

      {/* 2. METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`p-5 rounded-2xl border backdrop-blur-xl flex items-center justify-between group hover:scale-[1.02] transition-transform duration-300 ${metric.bg} ${metric.border} border-opacity-50`}
          >
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                {metric.title}
              </p>
              <h3 className="text-2xl font-bold text-white">
                {metric.prefix}
                <CountUp end={metric.value} duration={2} separator="," />
              </h3>
            </div>
            <div
              className={`p-3 rounded-xl bg-white/5 border border-white/5 group-hover:bg-white/10 transition-colors`}
            >
              {metric.icon}
            </div>
          </motion.div>
        ))}
      </div>

      {/* 3. CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#1e293b]/50 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-white mb-6">Revenue Trend</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardData.revenueChart}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#1e293b]/50 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-white mb-6">
            User Distribution
          </h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subscriptionSplit}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                >
                  {subscriptionSplit.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.name === "Pro" ? "#3b82f6" : "#10b981"}
                      strokeWidth={0}
                    />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-gray-400 text-sm ml-2">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. RECENT ACTIVITY */}
      <div className="bg-[#1e293b]/50 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
        <h3 className="text-lg font-bold text-white mb-4">Recent Queries</h3>

        <div className="overflow-hidden rounded-xl border border-white/5">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-white/5 text-gray-200 font-semibold uppercase tracking-wider text-xs">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Plan</th>
                <th className="p-4">Module</th>
                <th className="p-4">Date</th>
                <th className="p-4 w-1/3">Query Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentQueries.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    No recent activity.
                  </td>
                </tr>
              ) : (
                recentQueries.map((query, idx) => {
                  // 1️⃣ Determine Icon based on Module
                  let ModuleIcon = DocumentTextIcon;
                  let iconColor = "text-gray-400";
                  const type = query.moduleType || "General";

                  if (type === "CareerGPT") {
                    ModuleIcon = BriefcaseIcon;
                    iconColor = "text-blue-400";
                  } else if (type === "StudyGPT") {
                    ModuleIcon = AcademicCapIcon;
                    iconColor = "text-green-400";
                  } else if (type === "ContentGPT") {
                    ModuleIcon = NewspaperIcon;
                    iconColor = "text-purple-400";
                  }

                  // 2️⃣ Extract Date
                  const dateString = query.lastUpdated || query.createdAt;
                  const formattedDate = dateString
                    ? new Date(dateString).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "N/A";

                  // 3️⃣ Extract Query Preview (From messages array)
                  // Find the first message sent by the user
                  const userMsg = query.messages?.find(
                    (m) => m.role === "user"
                  );
                  const previewText =
                    userMsg?.content ||
                    query.title ||
                    "Start of conversation...";

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-white/5 transition-colors group"
                    >
                      {/* User Name */}
                      <td className="p-4 font-medium text-white">
                        {query.userId?.name || "Unknown"}
                      </td>

                      {/* Plan Badge */}
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                            query.userId?.subscription === "Pro"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {query.userId?.subscription || "Free"}
                        </span>
                      </td>

                      {/* Module Name + Icon */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <ModuleIcon className={`w-4 h-4 ${iconColor}`} />
                          <span className="text-xs font-medium text-gray-300">
                            {type}
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="p-4 text-xs font-mono text-gray-500 group-hover:text-gray-400">
                        {formattedDate}
                      </td>

                      {/* Query Preview */}
                      <td className="p-4 text-gray-400 text-sm max-w-xs">
                        <div className="truncate" title={previewText}>
                          {previewText}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
