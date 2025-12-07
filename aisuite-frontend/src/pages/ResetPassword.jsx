import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axios";
import ParticlesBackground from "../components/ParticlesBackground";
import { LockClosedIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const { token } = useParams(); // Get token from URL
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    setLoading(true);

    try {
      await API.put(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000); // Redirect after 3s
    } catch (err) {
      setError(err.response?.data?.msg || "Invalid or expired token.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#050505] text-white overflow-hidden px-4">
      <ParticlesBackground />

      <div className="relative z-10 w-full max-w-md p-8 rounded-3xl bg-[#0B1120]/60 backdrop-blur-xl border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-500">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
            <LockClosedIcon className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Reset Password</h2>
          <p className="text-sm text-gray-400 mt-2">
            Create a strong new password for your account.
          </p>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors">
                <LockClosedIcon className="w-5 h-5" />
              </div>
              <input
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white/5 text-white pl-12 pr-4 py-3.5 rounded-xl border border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all placeholder-gray-600 font-medium"
              />
            </div>

            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors">
                <LockClosedIcon className="w-5 h-5" />
              </div>
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-white/5 text-white pl-12 pr-4 py-3.5 rounded-xl border border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all placeholder-gray-600 font-medium"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all ${
                loading
                  ? "bg-indigo-600/50 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/25 hover:-translate-y-0.5"
              }`}
            >
              {loading ? "Resetting..." : "Set New Password"}
            </button>
          </form>
        ) : (
          // Success State
          <div className="text-center py-8 animate-in fade-in slide-in-from-bottom-4">
            <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Password Reset!</h3>
            <p className="text-gray-400 mb-6">
              Your password has been successfully updated. Redirecting to login...
            </p>
            <button 
              onClick={() => navigate("/login")}
              className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
            >
              Go to Login Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}