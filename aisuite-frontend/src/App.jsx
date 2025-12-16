import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { useChatStore } from "./store/chatStore";

/* =====================================================
 * PAGES (ROUTE TARGETS)
 * ===================================================== */
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import AdminDashboard from "./pages/AdminDashboard";
import TeamDashboard from "./pages/TeamDashboard";
import PaymentPage from "./pages/PaymentPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

/* =====================================================
 * AUXILIARY / SPECIAL ROUTES
 * ===================================================== */
import SocialPopupHandler from "./components/SocialPopupHandler";
import UserUsageDetails from "./components/Admin/UserUsageDetails";

/**
 * =====================================================
 * APP ROOT
 * =====================================================
 * Responsibilities:
 * - Application bootstrapping
 * - Fetch authenticated user (if token exists)
 * - Load AI models ONLY after user is authenticated
 * - Define all top-level routes
 *
 * IMPORTANT:
 * - This component does NOT handle auth guards
 * - Logout resets stores (handled in authStore)
 * - No hard reload is required on logout
 */
function App() {
  /* ---------------- AUTH STORE ---------------- */
  const { user, fetchUser } = useAuthStore();

  /* ---------------- CHAT STORE ---------------- */
  const loadModels = useChatStore((s) => s.loadModels);

  /**
   * =====================================================
   * BOOTSTRAP EFFECT
   * =====================================================
   * Flow:
   * 1. If user is NOT loaded yet → fetch user
   * 2. Once user exists → load AI models
   *
   * Why this order?
   * - Models are user-dependent
   * - Avoids unnecessary API calls for guests
   * - Safe on logout → login without page refresh
   */
  useEffect(() => {
    const boot = async () => {
      // Step 1: Load authenticated user (if token exists)
      if (!user) {
        await fetchUser();
        return;
      }

      // Step 2: Load AI models only for authenticated users
      await loadModels();
    };

    boot();
  }, [user, fetchUser, loadModels]);

  /* =====================================================
   * ROUTES
   * ===================================================== */
  return (
    <Routes>
      {/* ---------- PUBLIC ROUTES ---------- */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/social-auth-popup" element={<SocialPopupHandler />} />

      {/* ---------- USER ROUTES ---------- */}
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/payment" element={<PaymentPage />} />

      {/* ---------- ADMIN / TEAM ROUTES ---------- */}
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/team" element={<TeamDashboard />} />

      {/* ---------- TEAM USER DETAILS ---------- */}
      <Route
        path="/team/user-usage/:userId"
        element={
          <UserUsageDetails
            teamMode={true}
            onBack={() => window.history.back()}
          />
        }
      />
    </Routes>
  );
}

export default App;
