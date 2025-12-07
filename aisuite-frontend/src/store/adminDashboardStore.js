// src/store/adminDashboardStore.js
import { create } from "zustand";
import API from "../api/axios";

export const useAdminDashboardStore = create((set, get) => ({
  dashboardData: null,
  loading: false,

  // ✅ Updated to accept filters (e.g. start/end date)
  fetchDashboard: async (filters = {}) => {
    set({ loading: true });
    try {
      // ✅ Pass 'params: filters' so backend receives req.query
      const res = await API.get("/admin/dashboard", {
        params: filters, 
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      
      set({ dashboardData: res.data, loading: false });
    } catch (err) {
      console.error("Failed to fetch admin dashboard:", err);
      set({ dashboardData: null, loading: false });
    }
  },
}));
