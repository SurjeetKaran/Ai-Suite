import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useAuthStore } from "./store/authStore";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import AdminDashboard from "./pages/AdminDashboard"; // ✅ new import
import TeamDashboard from "./pages/TeamDashboard";
import PaymentPage from "./pages/PaymentPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";


function App() {
  const { user, fetchUser } = useAuthStore();

  useEffect(() => {
    // Optional: auto-fetch user session if needed
    if (!user) fetchUser?.();
  }, [user, fetchUser]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
    
      <Route path="/admin" element={<AdminDashboard />} /> {/* ✅ admin route */}
      <Route path="/team" element={<TeamDashboard />} />
      <Route path="/payment" element={<PaymentPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
    </Routes>
  );
}

export default App;



