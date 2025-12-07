import React from "react";

export default function LoadingSpinner({ message = "Initializing..." }) {
  return (
    // ✅ Added h-screen and bg-[#0B1120] to match Dashboard theme exactly
    <div className="flex flex-col items-center justify-center h-screen w-full bg-[#0B1120] z-50 fixed inset-0">
      
      {/* 3 Floating Dots Animation */}
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 animate-bounce [animation-delay:-0.3s] shadow-[0_0_15px_rgba(59,130,246,0.6)]"></div>
        <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 animate-bounce [animation-delay:-0.15s] shadow-[0_0_15px_rgba(168,85,247,0.6)]"></div>
        <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 animate-bounce shadow-[0_0_15px_rgba(236,72,153,0.6)]"></div>
      </div>

      {/* Aesthetic Text */}
      <p className="mt-8 text-xs font-bold text-gray-400 uppercase tracking-[0.3em] animate-pulse">
        {message}
      </p>
    </div>
  );
}