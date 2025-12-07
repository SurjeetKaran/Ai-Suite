import React, { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import ParticlesBackground from "../components/ParticlesBackground";
import { EnvelopeIcon, ArrowLeftIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      await API.post("/auth/forgot-password", { email });
      setMessage("Reset link sent! Please check your inbox.");
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to send reset email. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#050505] text-white overflow-hidden px-4">
      <ParticlesBackground />

      {/* Glass Card */}
      <div className="relative z-10 w-full max-w-md p-8 rounded-3xl bg-[#0B1120]/60 backdrop-blur-xl border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-500">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
            <EnvelopeIcon className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Forgot Password?</h2>
          <p className="text-sm text-gray-400 mt-2">
            Enter your email and we'll send you instructions to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors">
              <EnvelopeIcon className="w-5 h-5" />
            </div>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 text-white pl-12 pr-4 py-3.5 rounded-xl border border-white/10 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder-gray-600 font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
              loading
                ? "bg-blue-600/50 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/25 hover:-translate-y-0.5"
            }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Send Reset Link</span>
                <PaperAirplaneIcon className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Success / Error Messages */}
        {message && (
          <div className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium text-center animate-in slide-in-from-top-2">
            {message}
          </div>
        )}
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center animate-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {/* Back to Login */}
        <div className="mt-8 text-center">
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
          >
            <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}